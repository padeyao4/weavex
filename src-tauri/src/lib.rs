// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::fs;
use std::sync::Mutex;
use tauri_plugin_log::log::debug;
use tauri_plugin_log::log::error;

use std::path::Path;
use std::process::Command;

mod db;
use crate::db::Db;

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
    fs::write(path, content).map_err(|e| format!("Failed to write file: {}", e))
}

#[tauri::command]
fn check_directory_exists(path: &str) -> bool {
    Path::new(path).is_dir()
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
                .build(),
        )
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .manage(Db(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![
            get_os_type,
            detect_compositor,
            greet,
            read_file,
            write_file,
            check_directory_exists,
            open_dir,
            db::db_init,
            db::db_load_graphs,
            db::db_save_graph,
            db::db_delete_graph,
            db::db_load_note_metas,
            db::db_upsert_note_meta,
            db::db_migrate,
            db::move_file,
            db::file_exists
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
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
