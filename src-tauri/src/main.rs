// 无控制台窗口：debug/release 均不弹控制台（日志通过 tauri-plugin-log 写文件）
#![windows_subsystem = "windows"]

fn main() {
    let args: Vec<String> = std::env::args().collect();
    // MCP stdio 模式：不初始化 Tauri，直接跑 JSON-RPC 主循环（复用 weavx_lib::db）
    if args.iter().any(|a| a == "--mcp-stdio") {
        weavx_lib::mcp_stdio_main();
        return;
    }
    weavx_lib::run()
}
