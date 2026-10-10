# weavex.ps1 —— Weavex 技能的统一调用入口（零 Node 依赖，直接调用 mcp-server.exe）
# 用法:
#   powershell -NoProfile -ExecutionPolicy Bypass -File weavex.ps1 <tool> '<json 参数>' [--dev] [--data-dir <目录>]
# 示例:
#   .\weavex.ps1 list_graphs '{}'
#   .\weavex.ps1 get_graph '{"graphId":"c0bcc96d-..."}'
#   .\weavex.ps1 create_node '{"graphId":"...","name":"写周报","parentId":"..."}' --dev
#
# 通过 stdio JSON-RPC 调用 mcp-server.exe（Rust 版 MCP server，19 个工具）。
# 输出为工具返回的 result JSON（2 空格缩进）。错误时退出码非 0。
#
# 环境变量:
#   WEAVEX_MCP_SERVER  mcp-server.exe 路径（默认指向项目安装位置）
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

$exe = if ($env:WEAVEX_MCP_SERVER) { $env:WEAVEX_MCP_SERVER } else { 'H:\workspace\weavex\mcp-server\bin\mcp-server.exe' }

if (-not (Test-Path -LiteralPath $exe)) {
  [Console]::Error.WriteLine("无法启动 mcp-server.exe: 文件不存在 ($exe)")
  exit 1
}

# 校验 JSON 参数合法性
try {
  $null = $argsJson | ConvertFrom-Json
} catch {
  [Console]::Error.WriteLine("参数不是合法 JSON: $argsJson")
  exit 1
}

# 构造 exe 命令行参数；数据目录用 PowerShell 进程内环境变量（子进程继承，规避 cmd set 尾随空格坑）
$exeArgs = ''
if ($dev) { $exeArgs = ' --dev' }
if ($dataDir) { $env:WEAVEX_DATA_DIR = $dataDir }

# 临时文件（UTF-8 无 BOM）
$tmpDir = [IO.Path]::GetTempPath()
$reqFile = Join-Path $tmpDir ("weavex-req-" + [guid]::NewGuid().ToString('N') + '.json')
$respFile = Join-Path $tmpDir ("weavex-resp-" + [guid]::NewGuid().ToString('N') + '.json')
$errFile = Join-Path $tmpDir ("weavex-err-" + [guid]::NewGuid().ToString('N') + '.txt')

try {
  # MCP 握手 + 工具调用（initialize id=1 → notifications/initialized 无 id → tools/call id=2）
  $reqs = @(
    '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"weavex-skill","version":"1.0.0"}}}',
    '{"jsonrpc":"2.0","method":"notifications/initialized","params":{}}',
    ('{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"' + $tool + '","arguments":' + $argsJson + '}}')
  ) -join "`r`n"
  $utf8 = New-Object Text.UTF8Encoding($false)
  [IO.File]::WriteAllText($reqFile, $reqs, $utf8)

  # cmd 重定向：字节级 stdin/stdout/stderr，绕过 PowerShell 编码与引号问题
  $cmdLine = "`"$exe`"$exeArgs < `"$reqFile`" > `"$respFile`" 2> `"$errFile`""
  cmd /c $cmdLine

  # 透传 exe 的 stderr 日志（[mcp] 前缀，与 Node 版行为一致）
  if (Test-Path -LiteralPath $errFile) {
    $stderr = [IO.File]::ReadAllText($errFile, $utf8)
    if ($stderr) {
      $stderr -split "`r?`n" | ForEach-Object {
        if ($_) { [Console]::Error.WriteLine("[mcp] " + $_) }
      }
    }
  }

  if (-not (Test-Path -LiteralPath $respFile)) {
    [Console]::Error.WriteLine("mcp-server.exe 无输出（可能是数据目录不存在，请先启动一次 Weavex）")
    exit 1
  }
  $respText = [IO.File]::ReadAllText($respFile, $utf8)
  if (-not $respText.Trim()) {
    [Console]::Error.WriteLine("mcp-server.exe 无输出（数据库不存在或请求失败，请查看上方 [mcp] 日志）")
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
} finally {
  Remove-Item $reqFile, $respFile, $errFile -Force -ErrorAction SilentlyContinue
}
