// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::{Deserialize, Serialize};
use std::env;
use std::fs;
use tauri_plugin_log::log::debug;
use tauri_plugin_log::log::error;

use std::path::Path;
use std::process::Command;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[derive(Debug, Serialize, Deserialize)]
struct GitOptions {
    branch: String,
    repo_url: String,
    target_dir: String,
    commit_message: Option<String>,
    files: Option<Vec<String>>,
}

#[tauri::command]
fn check_git_repository(path: Option<&str>) -> bool {
    // 如果路径为None，直接返回false
    let Some(path_str) = path else {
        debug!("Path is None");
        return false;
    };

    // 检查路径是否为空或空字符串
    if path_str.trim().is_empty() {
        debug!("Path is empty");
        return false;
    }

    let dir_path = Path::new(path_str);

    // 检查路径是否存在且是目录
    if !dir_path.exists() || !dir_path.is_dir() {
        debug!("Path does not exist or is not a directory");
        return false;
    }

    // 检查是否存在.git目录
    let git_dir = dir_path.join(".git");
    git_dir.exists() && git_dir.is_dir()
}

/**
 * 克隆Git仓库
 *
 * 自动调用系统的git命令进行clone.认证方式使用默认ssh key
 */
#[tauri::command]
fn git_clone(options: GitOptions) -> Result<String, String> {
    let target_path = Path::new(&options.target_dir);

    // 检查目标目录是否存在，如果不存在则创建
    if !target_path.exists() {
        fs::create_dir_all(target_path)
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    // 构建git clone命令
    let mut cmd = Command::new("git");
    cmd.arg("clone");

    let repo_url = options.repo_url;

    cmd.arg(&repo_url);
    cmd.arg(&options.target_dir);

    // 如果指定了分支，则添加分支参数
    if !options.branch.is_empty() && options.branch != "main" && options.branch != "master" {
        cmd.arg("--branch").arg(&options.branch);
    }

    // 打印执行的git命令
    debug!("Executing git command: {:?}", cmd);

    // 执行命令
    let output = cmd
        .output()
        .map_err(|e| format!("Failed to execute git clone: {}", e))?;

    if output.status.success() {
        Ok(format!(
            "Repository cloned successfully to {}",
            options.target_dir
        ))
    } else {
        let error_msg = String::from_utf8_lossy(&output.stderr);
        Err(format!("Git clone failed: {}", error_msg))
    }
}

#[tauri::command]
fn git_pull(options: GitOptions) -> Result<String, String> {
    let target_path = Path::new(&options.target_dir);

    // 检查目录是否存在
    if !target_path.exists() {
        return Err(format!("Directory does not exist: {}", options.target_dir));
    }

    // 切换到目标目录
    let current_dir =
        env::current_dir().map_err(|e| format!("Failed to get current directory: {}", e))?;
    env::set_current_dir(&target_path).map_err(|e| format!("Failed to change directory: {}", e))?;

    // 构建git pull命令
    let mut cmd = Command::new("git");
    cmd.arg("pull");

    // 如果指定了分支，则添加分支参数
    if !options.branch.is_empty() {
        cmd.arg("origin").arg(&options.branch);
    }

    // 执行命令
    let output = cmd
        .output()
        .map_err(|e| format!("Failed to execute git pull: {}", e))?;

    // 恢复原始目录
    env::set_current_dir(&current_dir)
        .map_err(|e| format!("Failed to restore directory: {}", e))?;

    if output.status.success() {
        let output_str = String::from_utf8_lossy(&output.stdout);
        Ok(format!("Git pull successful: {}", output_str))
    } else {
        let error_msg = String::from_utf8_lossy(&output.stderr);
        Err(format!("Git pull failed: {}", error_msg))
    }
}

#[tauri::command]
fn git_commit(options: GitOptions) -> Result<String, String> {
    let target_path = Path::new(&options.target_dir);

    // 检查目录是否存在
    if !target_path.exists() {
        return Err(format!("Directory does not exist: {}", options.target_dir));
    }

    // 切换到目标目录
    let current_dir =
        env::current_dir().map_err(|e| format!("Failed to get current directory: {}", e))?;
    env::set_current_dir(&target_path).map_err(|e| format!("Failed to change directory: {}", e))?;

    // 检查是否有提交消息
    let commit_message = options
        .commit_message
        .ok_or("Commit message is required".to_string())?;

    // 添加文件到暂存区
    if let Some(files) = &options.files {
        for file in files {
            let mut add_cmd = Command::new("git");
            add_cmd.arg("add").arg(file);
            let add_output = add_cmd
                .output()
                .map_err(|e| format!("Failed to add file {}: {}", file, e))?;
            if !add_output.status.success() {
                let error_msg = String::from_utf8_lossy(&add_output.stderr);
                env::set_current_dir(&current_dir).ok();
                return Err(format!("Failed to add file {}: {}", file, error_msg));
            }
        }
    } else {
        // 如果没有指定文件，添加所有更改
        let mut add_cmd = Command::new("git");
        add_cmd.arg("add").arg(".");
        let add_output = add_cmd
            .output()
            .map_err(|e| format!("Failed to add files: {}", e))?;
        if !add_output.status.success() {
            let error_msg = String::from_utf8_lossy(&add_output.stderr);
            env::set_current_dir(&current_dir).ok();
            return Err(format!("Failed to add files: {}", error_msg));
        }
    }

    // 执行git commit
    let mut cmd = Command::new("git");
    cmd.arg("commit").arg("-m").arg(&commit_message);

    let output = cmd
        .output()
        .map_err(|e| format!("Failed to execute git commit: {}", e))?;

    // 恢复原始目录
    env::set_current_dir(&current_dir)
        .map_err(|e| format!("Failed to restore directory: {}", e))?;

    if output.status.success() {
        let output_str = String::from_utf8_lossy(&output.stdout);
        Ok(format!("Commit successful: {}", output_str))
    } else {
        let error_msg = String::from_utf8_lossy(&output.stderr);
        Err(format!("Commit failed: {}", error_msg))
    }
}

#[tauri::command]
fn git_push(options: GitOptions) -> Result<String, String> {
    let target_path = Path::new(&options.target_dir);

    // 检查目录是否存在
    if !target_path.exists() {
        return Err(format!("Directory does not exist: {}", options.target_dir));
    }

    // 切换到目标目录
    let current_dir =
        env::current_dir().map_err(|e| format!("Failed to get current directory: {}", e))?;
    env::set_current_dir(&target_path).map_err(|e| format!("Failed to change directory: {}", e))?;

    // 构建git push命令
    let mut cmd = Command::new("git");
    cmd.arg("push");

    // 如果指定了分支，则推送到特定分支
    if !options.branch.is_empty() {
        cmd.arg("origin").arg(&options.branch);
    } else {
        // 获取当前分支
        let branch_cmd = Command::new("git")
            .args(["branch", "--show-current"])
            .output()
            .map_err(|e| format!("Failed to get current branch: {}", e))?;

        if branch_cmd.status.success() {
            let current_branch = String::from_utf8_lossy(&branch_cmd.stdout)
                .trim()
                .to_string();
            if !current_branch.is_empty() {
                cmd.arg("origin").arg(&current_branch);
            }
        }
    }

    // 执行命令
    let output = cmd
        .output()
        .map_err(|e| format!("Failed to execute git push: {}", e))?;

    // 恢复原始目录
    env::set_current_dir(&current_dir)
        .map_err(|e| format!("Failed to restore directory: {}", e))?;

    if output.status.success() {
        let output_str = String::from_utf8_lossy(&output.stdout);
        Ok(format!("Git push successful: {}", output_str))
    } else {
        let error_msg = String::from_utf8_lossy(&output.stderr);
        Err(format!("Git push failed: {}", error_msg))
    }
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
    // 检查路径是否存在
    if !Path::new(path).exists() {
        return Err(format!("File does not exist: {}", path));
    }
    fs::write(path, content).map_err(|e| format!("Failed to write file: {}", e))
}

#[tauri::command]
fn check_directory_exists(path: &str) -> bool {
    Path::new(path).is_dir()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
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
        .invoke_handler(tauri::generate_handler![
            greet,
            check_git_repository,
            git_clone,
            git_pull,
            git_commit,
            git_push,
            read_file,
            write_file,
            check_directory_exists
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
