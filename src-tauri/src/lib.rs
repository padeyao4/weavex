// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

struct GitOptions {
    branch: String,
    repo_url: String,
    target_dir: String,
    username: Option<String>,
    password: Option<String>,
    ssh_key: Option<String>,
    auth_method: String,
}

#[tauri::command]
fn git_clone(option: &GitOptions) {
    // todo
}

#[tauri::command]
fn git_commit(option: &GitOptions) {
    // todo
}

#[tauri::command]
fn git_push(option: &GitOptions) {
    // todo
}

#[tauri::command]
fn git_pull(option: &GitOptions) {
    // todo
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
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
