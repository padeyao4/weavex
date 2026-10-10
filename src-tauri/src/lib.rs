// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::fs;
use std::sync::Mutex;
use tauri::Manager;
use tauri_plugin_log::log::debug;
use tauri_plugin_log::log::error;

use std::path::Path;
use std::process::Command;

mod db;
mod mcp;
mod watcher;
use crate::db::Db;
use crate::mcp::McpState;

#[tauri::command]
fn get_os_type() -> String {
    let os_type = if cfg!(target_os = "windows") {
        "windows"
    } else if cfg!(target_os = "linux") {
        "linux"
    } else if cfg!(target_os = "macos") {
        "macos"
    } else if cfg!(target_os = "android") {
        "android"
    } else if cfg!(target_os = "ios") {
        "ios"
    } else {
        "unknown"
    };
    os_type.into()
}

#[tauri::command]
fn open_dir(dir_path: &str) -> Result<(), String> {
    // 检查路径是否存在
    let path = Path::new(dir_path);
    if !path.exists() {
        return Err(format!("Directory does not exist: {}", dir_path));
    }

    // 检查是否为目录
    if !path.is_dir() {
        return Err(format!("Path is not a directory: {}", dir_path));
    }

    // 根据操作系统使用不同的命令打开目录
    if cfg!(target_os = "windows") {
        Command::new("explorer")
            .arg(dir_path)
            .spawn()
            .map_err(|e| format!("Failed to open directory on Windows: {}", e))?;
    } else if cfg!(target_os = "macos") {
        Command::new("open")
            .arg(dir_path)
            .spawn()
            .map_err(|e| format!("Failed to open directory on macOS: {}", e))?;
    } else if cfg!(target_os = "linux") {
        // Linux 系统尝试使用 xdg-open 命令
        Command::new("xdg-open")
            .arg(dir_path)
            .spawn()
            .map_err(|e| format!("Failed to open directory on Linux: {}", e))?;
    } else {
        return Err("Unsupported operating system".to_string());
    }

    Ok(())
}

#[tauri::command]
fn detect_compositor() -> String {
    // 检测合成器类型
    // 只判断是否是 niri 合成器
    if cfg!(target_os = "linux") {
        // 检查 NIRI_SOCKET 环境变量来判断是否是 niri 合成器
        if std::env::var("NIRI_SOCKET").is_ok() {
            return "niri".into();
        }
        return "other".into();
    } else if cfg!(target_os = "windows") {
        return "windows".into();
    } else if cfg!(target_os = "macos") {
        return "macos".into();
    } else {
        return "unknown".into();
    }
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn read_file(path: &str) -> String {
    let default = "".into();
    // 检查路径是否存在
    if !Path::new(path).exists() {
        error!("read file, File does not exist: {}", path);
        return default;
    } else {
        return fs::read_to_string(path).unwrap_or(default);
    }
}

#[tauri::command]
fn write_file(path: &str, content: &str) -> Result<(), String> {
    // 检查文件所在目录是否存在
    let file_path = Path::new(path);
    if let Some(parent_dir) = file_path.parent() {
        if !parent_dir.exists() {
            debug!(
                "Directory does not exist, creating: {}",
                parent_dir.display()
            );
            fs::create_dir_all(parent_dir)
                .map_err(|e| format!("Failed to create directory: {}", e))?;
        }
    }
    debug!("rust write file, path: {}", path);
    fs::write(path, content).map_err(|e| format!("Failed to write file: {}", e))?;
    watcher::mark_self_write();
    Ok(())
}

#[tauri::command]
fn check_directory_exists(path: &str) -> bool {
    Path::new(path).is_dir()
}

/// 设置 Windows 系统标题栏颜色（跟随应用主题）。
/// Windows 11 22H2+ 通过 DWM 的 DWMWA_CAPTION_COLOR / DWMWA_TEXT_COLOR 生效；
/// 其他平台为 no-op。颜色取值与前端主题 token（--color-base / --color-text）一致。
#[cfg(target_os = "windows")]
#[tauri::command]
fn set_titlebar_color(window: tauri::Window, theme: String) -> Result<(), String> {
    use std::os::raw::c_void;

    #[link(name = "dwmapi")]
    extern "system" {
        fn DwmSetWindowAttribute(
            hwnd: *mut c_void,
            dw_attribute: u32,
            pv_attribute: *const c_void,
            cb_attribute: u32,
        ) -> i32;
    }

    // DWM 窗口属性：标题栏背景色 / 标题栏文字色（Win11 22H2+）
    const DWMWA_CAPTION_COLOR: u32 = 35;
    const DWMWA_TEXT_COLOR: u32 = 36;

    // COLORREF 为 0x00BBGGRR
    let (caption, text) = if theme == "dark" {
        (0x002B241Fu32, 0x00EEE9E6u32) // 背景 #1F242B（--color-base） 文字 #E6E9EE（--color-text）
    } else {
        (0x00FAF8F7u32, 0x0037291Fu32) // 背景 #F7F8FA（--color-base） 文字 #1F2937（--color-text）
    };

    let hwnd = window.hwnd().map_err(|e| e.to_string())?;
    unsafe {
        DwmSetWindowAttribute(
            hwnd.0,
            DWMWA_CAPTION_COLOR,
            &caption as *const u32 as *const c_void,
            4,
        );
        DwmSetWindowAttribute(hwnd.0, DWMWA_TEXT_COLOR, &text as *const u32 as *const c_void, 4);
    }
    Ok(())
}

#[cfg(not(target_os = "windows"))]
#[tauri::command]
fn set_titlebar_color(_window: tauri::Window, _theme: String) -> Result<(), String> {
    Ok(())
}

/// 系统托盘（桌面平台）：
///  - 菜单：打开 Weavex / 退出
///  - 左键单击托盘图标：唤回主窗口
///  - 窗口关闭时隐藏到托盘（托盘常驻），退出仅通过托盘菜单
#[cfg(not(any(target_os = "android", target_os = "ios")))]
fn setup_tray(app: &tauri::AppHandle) -> tauri::Result<()> {
    use tauri::menu::{Menu, MenuItem};
    use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};

    let open_item = MenuItem::with_id(app, "open", "打开 Weavex", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&open_item, &quit_item])?;

    let icon = app
        .default_window_icon()
        .cloned()
        .expect("default window icon is required for tray icon");

    TrayIconBuilder::with_id("weavex-tray")
        .icon(icon)
        .menu(&menu)
        // 左键点击不弹菜单（用于唤回窗口），右键弹出菜单
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open" => show_main_window(app),
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            // 左键单击托盘图标 → 唤回主窗口
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main_window(tray.app_handle());
            }
        })
        .build(app)?;
    Ok(())
}

/// 显示并聚焦主窗口（从托盘唤回）
#[cfg(not(any(target_os = "android", target_os = "ios")))]
fn show_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_single_instance::init(|_app, _args, _cwd| {
            print!("单例模式")
        }))
        .plugin(
            tauri_plugin_log::Builder::new()
                .format(|out, message, record| {
                    use chrono::Local;
                    let timestamp = Local::now().format("%Y-%m-%d %H:%M:%S");
                    out.finish(format_args!(
                        "[{} {}] {}",
                        timestamp,
                        record.level(),
                        message
                    ))
                })
                .targets([
                    // 控制台输出（无控制台窗口时静默丢弃）
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Stdout),
                    // 文件输出：{appLogDir}/weavx.log（默认文件名 = 应用名）
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::LogDir {
                        file_name: None,
                    }),
                ])
                .build(),
        )
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        // 关闭窗口 → 隐藏到系统托盘（托盘常驻，退出需通过托盘菜单）
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .manage(Db(Mutex::new(None)))
        .manage(McpState(Mutex::new(None)))
        .setup(|app| {
            // 系统托盘（桌面平台）
            #[cfg(not(any(target_os = "android", target_os = "ios")))]
            if let Err(e) = setup_tray(app.handle()) {
                error!("[tray] 创建系统托盘失败: {}", e);
            }
            // 自动拉起 MCP 服务（失败不阻塞应用，仅记录日志）
            match mcp::spawn_mcp_server(app.handle()) {
                Ok(Some(child)) => {
                    let state = app.state::<McpState>();
                    *state.0.lock().unwrap() = Some(child);
                }
                Ok(None) => {}
                Err(e) => {
                    error!("[mcp] {}", e);
                }
            }
            // 数据目录变更监听（filesystem-first：外部写者直写存储 → 广播给前端）
            let data_dir = app
                .path()
                .app_data_dir()
                .unwrap_or_else(|e| {
                    error!("[watcher] 获取数据目录失败: {}", e);
                    std::env::temp_dir()
                });
            watcher::init(app.handle().clone(), data_dir);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_os_type,
            detect_compositor,
            greet,
            read_file,
            write_file,
            check_directory_exists,
            open_dir,
            set_titlebar_color,
            db::db_init,
            db::db_load_graphs,
            db::db_save_graph,
            db::db_delete_graph,
            db::db_load_note_metas,
            db::db_upsert_note_meta,
            db::db_migrate,
            db::db_upsert_graph_meta,
            db::db_create_node,
            db::db_update_node,
            db::db_delete_node,
            db::db_add_edge,
            db::db_remove_edge,
            db::db_delete_note,
            db::move_file,
            db::file_exists
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            if let tauri::RunEvent::Exit = event {
                mcp::stop_mcp_server(app_handle);
            }
        });
}

#[cfg(test)]
mod tests {
    use crate::{detect_compositor, get_os_type};

    #[test]
    fn test_get_os_type() {
        let os_type = get_os_type();
        println!("os type {}", os_type);
    }

    #[test]
    fn test_detect_compositor() {
        let compositor = detect_compositor();
        println!("compositor : {}", compositor)
    }
}
