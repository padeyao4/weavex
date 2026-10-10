fn main() {
    // tauri CLI 在 Windows build 时仍会注入已废弃的 STATIC_VCRUNTIME 环境变量，
    // 触发 tauri-build 2.x 的 deprecation warning（"STATIC_VCRUNTIME is deprecated"）。
    // 这里在 build script 进程内清除它，改由 tauri.conf.json 的
    // build.windows.staticVCRuntime 统一控制 VC 运行时静态链接行为。
    #[cfg(windows)]
    std::env::remove_var("STATIC_VCRUNTIME");

    tauri_build::build()
}
