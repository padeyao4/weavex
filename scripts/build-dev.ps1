<#
.SYNOPSIS
  编译 Weavex 开发版（dev）可执行文件，供豆包虚拟桌面运行。

.DESCRIPTION
  与普通 `npm run dev`（tauri dev，真实桌面运行）不同，本脚本直接编译 dev identifier 的 debug exe：
  - identifier = dev.padeyao4.weavex（与正式版 padeyao4.weavex 单例隔离，可双开）
  - 无控制台窗口（日志经 tauri-plugin-log 写入 {appDataDir}/logs/）
  - devUrl = http://127.0.0.1:3300（依赖 vite 前端 dev server，见 start-dev-vite.ps1）

  用法：
    powershell -ExecutionPolicy Bypass -File scripts\build-dev.ps1
  产物：
    C:\weavex-target\debug\weavex.exe（target 目录由 src-tauri\.cargo\config.toml 重定向到 C:/weavex-target）
#>
$ErrorActionPreference = "Stop"
$root = "H:\workspace\weavex"
$devConf = Join-Path $root "src-tauri\tauri.dev.conf.json"
$outLog = "H:\workspace\temp\logs\build-dev.log"

Write-Host "[1/2] 设置 dev 配置 (TAURI_CONFIG = tauri.dev.conf.json)"
$env:TAURI_CONFIG = Get-Content $devConf -Raw

Set-Location (Join-Path $root "src-tauri")
Write-Host "[2/2] cargo build (debug, dev identifier, 无控制台)..."
cargo build 2>&1 | Out-File $outLog -Encoding UTF8
if ($LASTEXITCODE -ne 0) {
    Write-Host "[FAIL] 编译失败，详见 $outLog" -ForegroundColor Red
    exit 1
}
$exe = "C:\weavex-target\debug\weavex.exe"
Write-Host "[OK] 编译成功: $exe" -ForegroundColor Green
Write-Host "      接下来启动 vite 后再到豆包虚拟桌面启动 dev（见 doc\虚拟桌面跑dev.md）"
