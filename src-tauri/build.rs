fn main() {
    // tauri CLI 在 Windows build 时仍会注入已废弃的 STATIC_VCRUNTIME 环境变量，
    // 触发 tauri-build 2.x 的 deprecation warning（"STATIC_VCRUNTIME is deprecated"）。
    // 这里在 build script 进程内清除它，改由 build.rs 的 WindowsAttributes 显式控制
    // VC 运行时静态链接行为（当前 tauri CLI 版本不支持 conf.json 的 build.windows 字段）。
    #[cfg(windows)]
    std::env::remove_var("STATIC_VCRUNTIME");

    let attributes = tauri_build::Attributes::new();
    #[cfg(windows)]
    let attributes = attributes.windows_attributes(
        tauri_build::WindowsAttributes::new().static_vc_runtime(true),
    );

    tauri_build::try_build(attributes).expect("failed to run tauri-build")
}
