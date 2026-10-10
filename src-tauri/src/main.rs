// 无控制台窗口：debug/release 均不弹控制台（日志通过 tauri-plugin-log 写文件）
#![windows_subsystem = "windows"]

fn main() {
    weavx_lib::run()
}
