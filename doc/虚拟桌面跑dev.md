# 虚拟桌面运行 Weavex 开发版（dev）

> 目标：让 **dev 开发版**运行在豆包虚拟桌面，豆包可直接看到并操作（截图/点击），
> 与真实桌面的 **prod 正式版** 互不抢占鼠标键盘，实现双开与独立数据。

## 双环境架构

| 项 | prod 正式版（真实桌面） | dev 开发版（豆包虚拟桌面） |
| --- | --- | --- |
| identifier | `padeyao4.weavex` | `dev.padeyao4.weavex` |
| 数据目录 | `%APPDATA%\padeyao4.weavex` | `%APPDATA%\dev.padeyao4.weavex` |
| MCP 端口 | 8912 | 8913 |
| 窗口标题 | Weavex | Weavex Dev |
| 可执行文件 | `C:\Users\11818\AppData\Local\Weavex\weavx.exe`（安装版） | `C:\weavex-target\debug\weavx.exe`（cargo 编译） |
| 前端加载 | 内置 dist | `http://127.0.0.1:3300`（vite dev server） |

单例互不冲突（按 identifier 隔离），因此两套可同时运行。

## 完整流程（三步）

### 1. 启动前端 dev server（vite）

```powershell
powershell -ExecutionPolicy Bypass -File H:\workspace\weavex\scripts\start-dev-vite.ps1
```

- 幂等：已监听 `127.0.0.1:3300` 会直接跳过。
- 必须监听 **IPv4 127.0.0.1**，不要用 `localhost`：虚拟桌面 WebView2 解析 localhost 走 IPv6（::1），vite 只监听 IPv4 时会连接拒绝（ERR_CONNECTION_REFUSED）。
- 日志：`H:\workspace\temp\logs\vite.log` / `vite-err.log`。

### 2. 编译 dev 可执行文件

```powershell
powershell -ExecutionPolicy Bypass -File H:\workspace\weavex\scripts\build-dev.ps1
```

关键点：
- 直接 `cargo build` 默认读取 `tauri.conf.json`（**prod identifier**），会与真实桌面 prod 单例冲突、启动即退。
- 脚本设置 `TAURI_CONFIG` 环境变量（内容为 `src-tauri\tauri.dev.conf.json`）后 `cargo build`，
  产物即 **dev identifier + 无控制台** 的 debug exe。
- 产物路径：`C:\weavex-target\debug\weavx.exe`（target 目录由 `src-tauri\.cargo\config.toml` 重定向到 `C:/weavex-target`，勿改）。
- 源码变更（前端除外）后需重新编译；前端变更只需 vite 热更新（无需重编）。

### 3. 在豆包虚拟桌面启动 dev

方式 A（推荐，豆包侧自动完成）：让豆包执行“在虚拟桌面启动 Weavex dev”。
豆包使用虚拟桌面 GUI 的 `launch_app` 启动 `weavx` 条目，窗口出现在虚拟桌面。

方式 B（手动）：在豆包虚拟桌面上双击桌面 “Weavex” 图标启动。

注意：
- dev 是单例（dev identifier），不要同时在真实桌面再开 dev；真实桌面 prod 不受影响。
- 启动后**不再弹出命令行控制台**：
  - dev 主进程已通过 `windows_subsystem = "windows"` 关闭控制台；
  - MCP 子进程（node server.mjs）通过 `CREATE_NO_WINDOW` 隐藏控制台。
  - 日志位置：
    - dev 应用日志：`%LOCALAPPDATA%\dev.padeyao4.weavex\logs\Weavex Dev.log`
    - MCP 日志：`%APPDATA%\dev.padeyao4.weavex\mcp-server.log`

## 验证清单

| # | 检查项 | 方法 |
| --- | --- | --- |
| 1 | dev 进程存在 | `Get-Process weavx`（应看到 prod + dev 两个 PID） |
| 2 | MCP 8913 监听 | `netstat -ano | Select-String ":8913"` |
| 3 | dev 数据目录 | dev 日志/进程启动参数确认 `dev.padeyao4.weavex` |
| 4 | 主窗口显示 | 虚拟桌面截屏可见 “Weavex Dev” 窗口与任务列表 |
| 5 | 可交互 | 虚拟桌面点击“创建项目”应弹出“创建新项目”对话框 |
| 6 | 日志文件 | `%LOCALAPPDATA%\dev.padeyao4.weavex\logs\Weavex Dev.log` 持续追加 |

## 常见问题

- **启动即退**：exe 是 prod identifier（用错配置编译）→ 用 `build-dev.ps1` 重新编译。
- **白屏 / ERR_CONNECTION_REFUSED**：vite 未启动，或监听了 IPv6 而非 127.0.0.1 → 跑 `start-dev-vite.ps1`。
- **launch 返回 accepted_unverified**：属正常（虚拟桌面接受请求但窗口确认延迟），等待几秒后截屏确认，不要重复 launch。
- **误杀 prod**：dev/prod 同名进程（weavx），杀进程前先区分 PID/数据目录。
- **出现黑色 node 控制台窗口**：那是 MCP server（node server.mjs）的控制台；新版已用 `CREATE_NO_WINDOW` 隐藏。若仍出现（旧 exe 或手动启动的 server.mjs），说明该窗口属于豆包环境自身，勿强行结束。

## 相关文件

- 配置：`src-tauri\tauri.conf.json`（prod）、`src-tauri\tauri.dev.conf.json`（dev 覆盖）
- 脚本：`scripts\build-dev.ps1`、`scripts\start-dev-vite.ps1`
- 前端 host：`vite.config.ts`（`host: host \|\| "127.0.0.1"`）
- devUrl：`tauri.conf.json` 的 `devUrl: "http://127.0.0.1:3300"`
