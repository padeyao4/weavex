<#
.SYNOPSIS
  启动 Weavex 前端 dev server（vite, 127.0.0.1:3300），供 dev 版应用加载。
  已监听 3300 时跳过，幂等。

.DESCRIPTION
  dev 版 exe 通过 devUrl = http://127.0.0.1:3300 加载前端。
  注意：必须监听 IPv4 127.0.0.1（不要用 localhost，虚拟桌面 WebView2 解析差异会导致连接拒绝）。

  用法：
    powershell -ExecutionPolicy Bypass -File scripts\start-dev-vite.ps1
#>
$ErrorActionPreference = "Stop"
$root = "H:\workspace\weavex"
$logDir = "H:\workspace\temp\logs"
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Force $logDir | Out-Null }

$already = netstat -ano | Select-String ":3300\s+.*LISTENING"
if ($already) {
    Write-Host "[OK] vite 已在监听 127.0.0.1:3300，跳过启动" -ForegroundColor Green
    exit 0
}

Write-Host "[1/2] 启动 vite (npm run vue-serve)..."
Start-Process -FilePath "npm.cmd" -ArgumentList "run", "vue-serve" -WorkingDirectory $root -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $logDir "vite.log") `
    -RedirectStandardError (Join-Path $logDir "vite-err.log")

Write-Host "[2/2] 等待监听就绪..."
for ($i = 0; $i -lt 15; $i++) {
    Start-Sleep -Seconds 1
    if (netstat -ano | Select-String ":3300\s+.*LISTENING") {
        Write-Host "[OK] vite 就绪: http://127.0.0.1:3300" -ForegroundColor Green
        exit 0
    }
}
Write-Host "[WARN] 15s 内未监听 3300，请查看 $logDir\vite.log / vite-err.log" -ForegroundColor Yellow
exit 1
