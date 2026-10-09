// Weavex 应用启动时自动拉起 MCP 服务（供豆包等客户端通过 HTTP 连接器调用），退出时自动停止。
//
// 定位规则：
//   - dev（debug）：<项目根>/mcp-server（由 CARGO_MANIFEST_DIR 推断）
//   - release：tauri 打包资源目录下的 mcp-server（tauri.conf.json bundle.resources 已配置）
//
// 依赖：系统 Node.js ≥ 22.5（server.mjs 使用内置 node:sqlite）。
// 若端口已被监听（如用户已手动启动、或上次退出残留的孤儿进程），则跳过拉起，避免重复。

use std::fs::OpenOptions;
use std::net::{SocketAddr, TcpStream};
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::time::Duration;

use tauri::path::BaseDirectory;
use tauri::Manager;
use tauri_plugin_log::log::{error, info, warn};

/// 保存 MCP 子进程句柄，应用退出时据此终止
pub struct McpState(pub Mutex<Option<Child>>);

fn mcp_port() -> u16 {
    std::env::var("WEAVEX_MCP_PORT")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(8912)
}

/// 探测本地端口是否已被监听（能建立 TCP 连接即视为占用）
fn port_in_use(port: u16) -> bool {
    let addr: SocketAddr = format!("127.0.0.1:{}", port).parse().unwrap();
    TcpStream::connect_timeout(&addr, Duration::from_millis(200)).is_ok()
}

/// 定位 mcp-server 目录（含 server.mjs）
fn locate_server_dir(app: &tauri::AppHandle) -> Option<PathBuf> {
    // dev：cargo 编译期注入的清单目录 = src-tauri，其上一级为项目根
    if cfg!(debug_assertions) {
        let dev = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../mcp-server");
        if dev.join("server.mjs").exists() {
            return Some(dev);
        }
    }
    match app.path().resolve("mcp-server", BaseDirectory::Resource) {
        Ok(p) if p.join("server.mjs").exists() => Some(p),
        _ => None,
    }
}

/// 打开（或新建）MCP 子进程日志文件，位于应用数据目录下
fn open_log_file(app: &tauri::AppHandle) -> Option<std::fs::File> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| error!("[mcp] 获取应用数据目录失败: {}", e))
        .ok()?;
    if let Err(e) = std::fs::create_dir_all(&dir) {
        error!("[mcp] 创建应用数据目录失败: {}", e);
        return None;
    }
    let log = dir.join("mcp-server.log");
    OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log)
        .map_err(|e| error!("[mcp] 打开日志文件失败: {}", e))
        .ok()
}

/// 应用启动时调用：若端口空闲则拉起 node server.mjs --http，返回子进程句柄
pub fn spawn_mcp_server(app: &tauri::AppHandle) -> Result<Option<Child>, String> {
    let port = mcp_port();
    if port_in_use(port) {
        info!(
            "[mcp] 端口 {} 已被监听，跳过自动拉起（服务可能已在运行）",
            port
        );
        return Ok(None);
    }
    let dir = match locate_server_dir(app) {
        Some(d) => d,
        None => {
            warn!("[mcp] 未找到 mcp-server 目录，跳过自动拉起（仅影响豆包等 MCP 客户端接入）");
            return Ok(None);
        }
    };

    let out = open_log_file(app).ok_or_else(|| "无法创建 MCP 日志文件".to_string())?;
    let err = out
        .try_clone()
        .map_err(|e| format!("无法复制日志句柄: {}", e))?;

    let child = Command::new("node")
        .arg("server.mjs")
        .arg("--http")
        .current_dir(&dir)
        // 父进程看护：应用退出（含崩溃/强杀）时让 node 自动退出
        .env("WEAVEX_PARENT_PID", std::process::id().to_string())
        .stdin(Stdio::null())
        .stdout(Stdio::from(out))
        .stderr(Stdio::from(err))
        .spawn()
        .map_err(|e| format!("启动 MCP 服务失败（需要系统已安装 Node.js ≥ 22.5）: {}", e))?;

    info!(
        "[mcp] 已自动拉起 MCP HTTP 服务: http://127.0.0.1:{}/mcp (pid {})",
        port,
        child.id()
    );
    Ok(Some(child))
}

/// 应用退出时调用：终止 MCP 子进程
pub fn stop_mcp_server(app: &tauri::AppHandle) {
    if let Some(state) = app.try_state::<McpState>() {
        if let Some(mut child) = state.0.lock().unwrap().take() {
            let _ = child.kill();
            let _ = child.wait();
            info!("[mcp] MCP 服务已停止");
        }
    }
}
