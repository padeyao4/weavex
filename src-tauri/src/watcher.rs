//! 数据目录变更广播器（filesystem-first 的核心）。
//!
//! 设计：存储（weavex.db + notes/*.md）是唯一真相源，存在多个写者（应用 UI、
//! MCP 独立进程、未来其他工具）。本模块用文件系统事件感知**外部写者**的变更，
//! 防抖合并后广播 `data-changed` 给前端，由前端重新加载为只读缓存；
//! 应用自身（Rust 命令）的写通过 `mark_self_write` 抑制窗口抑制，避免
//! "应用操作 → 事件 → 广播 → 前端 reload → 覆盖 UI 态"的抖动循环。
//!
//! 监听不依赖窗口生命周期：窗口隐藏（托盘常驻）期间线程照跑，事件无人接收无害。

use std::path::PathBuf;
use std::sync::atomic::{AtomicI64, Ordering};
use std::sync::{Mutex, OnceLock};
use std::time::Duration;

use notify::{RecursiveMode, Watcher};
use tauri::{AppHandle, Emitter};

use crate::db::now_ms;

/// 自身写抑制窗口（毫秒）：应用命令写库后，其引发的文件事件在此窗口内不广播。
const SELF_WRITE_SUPPRESS_MS: i64 = 1500;
/// 外部事件防抖窗口（毫秒）：MCP 一次操作可能触发 db/wal/journal/notes 多个文件事件，
/// 只合并为一次广播。
const DEBOUNCE_MS: i64 = 150;
/// 广播轮询间隔（毫秒）。
const POLL_MS: u64 = 200;

/// 最近一次外部文件事件的时间戳（0 = 无待广播事件）。
static LAST_EXTERNAL_MS: AtomicI64 = AtomicI64::new(0);
/// 自身写抑制截止时间戳。
static SELF_WRITE_UNTIL: AtomicI64 = AtomicI64::new(0);
/// 应用句柄（用于 emit）。
static APP: OnceLock<AppHandle> = OnceLock::new();
/// 底层 watcher（保活 + 支持切换目录）。
static WATCHER: Mutex<Option<notify::RecommendedWatcher>> = Mutex::new(None);
/// 广播线程只启动一次。
static THREAD_STARTED: std::sync::Once = std::sync::Once::new();

/// 应用自身写库后调用：其引发的文件事件在抑制窗口内不广播（避免 UI 抖动循环）。
pub fn mark_self_write() {
    SELF_WRITE_UNTIL.store(now_ms() + SELF_WRITE_SUPPRESS_MS, Ordering::Relaxed);
}

fn is_self_write(now: i64) -> bool {
    SELF_WRITE_UNTIL.load(Ordering::Relaxed) >= now
}

/// 初始化：注册数据目录监听并启动防抖广播线程（幂等）。
/// 应在 setup 阶段调用；数据目录随后由 `db_init` 的真实 work_dir 校正。
pub fn init(app: AppHandle, dir: PathBuf) {
    let _ = APP.set(app);
    set_watched_dir(dir);
    THREAD_STARTED.call_once(|| {
        std::thread::Builder::new()
            .name("weavex-data-watcher".into())
            .spawn(broadcast_loop)
            .expect("failed to spawn data watcher thread");
    });
}

/// 切换/设置监听目录（db_init 传入真实数据目录时调用，校正 dev/prod 差异）。
pub fn set_watched_dir(dir: PathBuf) {
    if !dir.exists() {
        return;
    }
    let mut guard = WATCHER.lock().unwrap();
    if let Some(w) = guard.as_mut() {
        let _ = w.unwatch(dir.as_path());
    }
    match notify::recommended_watcher(
        move |res: notify::Result<notify::Event>| {
            if let Ok(ev) = res {
                if matches!(
                    ev.kind,
                    notify::EventKind::Create(_)
                        | notify::EventKind::Modify(_)
                        | notify::EventKind::Remove(_)
                ) {
                    LAST_EXTERNAL_MS.store(now_ms(), Ordering::Relaxed);
                }
            }
        },
    ) {
        Ok(mut w) => {
            if let Err(e) = w.watch(&dir, RecursiveMode::Recursive) {
                tauri_plugin_log::log::error!(
                    "[watcher] 监听数据目录失败 {}: {}",
                    dir.display(),
                    e
                );
            }
            *guard = Some(w);
        }
        Err(e) => {
            tauri_plugin_log::log::error!("[watcher] 创建监听失败: {}", e);
        }
    }
}

/// 防抖广播线程：外部事件静默 150ms 后广播一次 `data-changed`。
fn broadcast_loop() {
    loop {
        std::thread::sleep(Duration::from_millis(POLL_MS));
        let last = LAST_EXTERNAL_MS.load(Ordering::Relaxed);
        if last == 0 {
            continue;
        }
        let now = now_ms();
        if now - last < DEBOUNCE_MS {
            continue;
        }
        // 置 0 再判断，避免重复广播同一批事件
        LAST_EXTERNAL_MS.store(0, Ordering::Relaxed);
        if is_self_write(now) {
            continue;
        }
        if let Some(app) = APP.get() {
            let _ = app.emit("data-changed", serde_json::json!({ "ts": now }));
        }
    }
}
