# weavex.ps1 —— Weavex 技能的统一调用入口（零 Node 依赖，调用主程序 weavex.exe 的 --mcp-stdio 模式）
# 用法:
#   powershell -NoProfile -ExecutionPolicy Bypass -File weavex.ps1 <tool> '<json 参数>' [--dev] [--data-dir <目录>]
# 示例:
#   .\weavex.ps1 list_graphs '{}'
#   .\weavex.ps1 get_graph '{"graphId":"c0bcc96d-..."}'
#   .\weavex.ps1 create_node '{"graphId":"...","name":"写周报","parentId":"..."}' --dev
#
# 通过 stdio JSON-RPC 调用 weavex.exe --mcp-stdio（单 exe：主应用与 MCP server 合体，19 个工具）。
# 输出为工具返回的 result JSON（2 空格缩进）。错误时退出码非 0。
#
# 环境变量:
#   WEAVEX_MCP_SERVER  weavex.exe 路径（默认指向开发构建 C:\weavex-target\debug\weavex.exe；
#                      打包版/生产数据请设为本机安装的 weavex.exe 绝对路径）
#   WEAVEX_DATA_DIR    数据目录（也可用 --data-dir 传入）

param()

# ---- 手动解析参数（兼容 --dev / -dev、--data-dir / -data-dir）----
$tool = $null
$argsJson = '{}'
$dev = $false
$dataDir = ''
$i = 0
while ($i -lt $args.Count) {
  $a = $args[$i]
  if ($i -eq 0) {
    $tool = $a
  } elseif ($a -eq '--dev' -or $a -eq '-dev') {
    $dev = $true
  } elseif ($a -eq '--data-dir' -or $a -eq '-data-dir') {
    $i++
    if ($i -ge $args.Count) {
      [Console]::Error.WriteLine("--data-dir 缺少目录参数")
      exit 1
    }
    $dataDir = $args[$i]
  } elseif ($argsJson -eq '{}' -and $a -notmatch '^-') {
    $argsJson = $a
  } else {
    [Console]::Error.WriteLine("无法识别的参数: $a")
    exit 1
  }
  $i++
}

if (-not $tool) {
  [Console]::Error.WriteLine("用法: weavex.ps1 <tool> '<json 参数>' [--dev] [--data-dir <目录>]")
  [Console]::Error.WriteLine("可用工具见 references/tools.md（19 个：list_graphs / get_graph / create_node / ...）")
  exit 1
}

$exe = if ($env:WEAVEX_MCP_SERVER) { $env:WEAVEX_MCP_SERVER } else { 'C:\weavex-target\debug\weavex.exe' }

if (-not (Test-Path -LiteralPath $exe)) {
  [Console]::Error.WriteLine("无法启动 weavex.exe: 文件不存在 ($exe)")
  [Console]::Error.WriteLine("开发期请先运行 npm run dev 生成 debug 构建；或用 WEAVEX_MCP_SERVER 指向已有 weavex.exe")
  exit 1
}

# 校验 JSON 参数合法性
try {
  $null = $argsJson | ConvertFrom-Json
} catch {
  [Console]::Error.WriteLine("参数不是合法 JSON: $argsJson")
  exit 1
}

# 构造 exe 命令行参数（--mcp-stdio 进入 MCP 模式）；数据目录用 PowerShell 进程内环境变量（子进程继承）
$exeArgs = '--mcp-stdio'
if ($dev) { $exeArgs += ' --dev' }
if ($dataDir) { $env:WEAVEX_DATA_DIR = $dataDir }

# MCP 握手 + 工具调用（initialize id=1 → notifications/initialized 无 id → tools/call id=2）
$reqs = @(
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"weavex-skill","version":"1.0.0"}}}',
  '{"jsonrpc":"2.0","method":"notifications/initialized","params":{}}',
  ('{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"' + $tool + '","arguments":' + $argsJson + '}}')
) -join "`r`n"

# 用 .NET Process 直接 spawn：
#  - weavex.exe 是 GUI 子系统程序，cmd /c 对它不等待（竞态）→ Process 显式 WaitForExit
#  - BaseStream 按原始字节读写，UTF-8 无损（规避 PS 5.1 管道/编码转码）
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = $exe
$psi.UseShellExecute = $false
$psi.RedirectStandardInput = $true
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.CreateNoWindow = $true
$psi.Arguments = $exeArgs

try {
  $proc = [System.Diagnostics.Process]::Start($psi)
} catch {
  [Console]::Error.WriteLine("无法启动 weavex.exe: " + $_.Exception.Message)
  exit 1
}

$reqBytes = [Text.Encoding]::UTF8.GetBytes($reqs)
$proc.StandardInput.BaseStream.Write($reqBytes, 0, $reqBytes.Length)
$proc.StandardInput.BaseStream.Close()   # stdin EOF → weavex.exe 处理完请求即退出

$errMs = New-Object System.IO.MemoryStream
$proc.StandardError.BaseStream.CopyTo($errMs)
$outMs = New-Object System.IO.MemoryStream
$proc.StandardOutput.BaseStream.CopyTo($outMs)
$proc.WaitForExit()

$respText = [Text.Encoding]::UTF8.GetString($outMs.ToArray())
$stderrText = [Text.Encoding]::UTF8.GetString($errMs.ToArray())

# 透传 exe 的 stderr 日志（[mcp] 前缀）
if ($stderrText) {
  $stderrText -split "`r?`n" | ForEach-Object {
    if ($_) { [Console]::Error.WriteLine("[mcp] " + $_) }
  }
}

if (-not $respText.Trim()) {
  [Console]::Error.WriteLine("weavex.exe 无输出（数据库不存在或请求失败，请查看上方 [mcp] 日志）")
  exit 1
}

$callResp = $null
foreach ($line in ($respText -split "`r?`n")) {
  if (-not $line.Trim()) { continue }
  try {
    $msg = $line | ConvertFrom-Json
  } catch {
    continue
  }
  if ($msg.error) {
    [Console]::Error.WriteLine("工具错误: " + $msg.error.message)
    exit 1
  }
  if ($msg.id -eq 2) { $callResp = $msg }
}
if (-not $callResp) {
  [Console]::Error.WriteLine("未收到 tools/call 响应")
  exit 1
}

$text = $callResp.result.content[0].text
try {
  $obj = $text | ConvertFrom-Json
  $obj | ConvertTo-Json -Depth 20
} catch {
  $text
}
exit 0
