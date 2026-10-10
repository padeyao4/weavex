# Weavex MCP Server

让豆包（以及其他支持 MCP 的 AI 客户端）直接读写 Weavex 的任务图与笔记数据。

**实现方式：Rust 独立二进制（`mcp-server.exe`），仅支持 stdio 传输，目标机器零 Node 依赖。**

- 直接复用 Weavex 应用（Tauri）的 `weavx_lib::db` 数据层（单一 SQL 实现），19 个工具与产品口径逐字段一致
- 数据目录解析规则、`busy_timeout`、filesystem-first 同步机制均与应用相同
- 由 MCP 客户端（豆包 / Claude / Cursor 等）自己 spawn，随客户端生命周期启停；Weavex 应用可完全退出

## 构建

```
cd H:\workspace\weavex\src-tauri
cargo build --release --bin mcp-server
```

产物：`C:\weavex-target\release\mcp-server.exe`（target 目录见 `.cargo/config.toml`）。

随安装包分发：`tauri.conf.json` 的 `bundle.resources` 已配置，安装后位于 `<安装目录>\resources\mcp-server\mcp-server.exe`。

## 在豆包中配置（STDIO 连接器）

豆包桌面客户端 → 连接器 · 技能 · 伙伴 → 添加 → 新建自定义连接器：

- **服务器名称**：`weavex`
- **传输类型**：`STDIO`
- **启动命令**：exe 绝对路径（开发版示例 `H:\workspace\weavex\mcp-server\bin\mcp-server.exe`；打包版填安装目录资源路径）

> 开发期：命令后加 `--dev` 连接开发版数据（`%APPDATA%\dev.padeyao4.weavex`）；正式打包版不加（连接生产数据 `%APPDATA%\padeyao4.weavex`）。

## 数据目录解析规则（优先级从高到低）

| 优先级 | 来源 | 说明 |
| --- | --- | --- |
| 1 | 环境变量 `WEAVEX_DATA_DIR` | 显式指定数据目录 |
| 2 | `%APPDATA%\padeyao4.weavex` | 生产版 Tauri appDataDir（含 weavex.db） |
| 3 | `%APPDATA%\dev.padeyao4.weavex` | 传 `--dev` 参数或设 `WEAVEX_DEV=1` 时读取（开发版 appDataDir） |
| 4 | `~\Documents\WeavexData` | 兜底兼容旧版数据位置 |

数据库不存在时服务报错退出（提示先启动一次 Weavex 或设置 `WEAVEX_DATA_DIR`）。

## 工具清单

| 分类 | 工具 | 说明 |
| -- | --- | --- |
| 项目 | `list_graphs` | 列出所有项目 |
| 项目 | `get_graph` | 获取项目完整结构（节点树 + 边） |
| 项目 | `create_graph` | 创建项目 |
| 项目 | `rename_graph` | 重命名项目 |
| 项目 | `delete_graph` | 删除项目（连带节点与边，不可恢复） |
| 任务 | `list_nodes` | 列出项目全部任务节点 |
| 任务 | `get_node` | 获取单个任务节点 |
| 任务 | `create_node` | 创建任务（可指定父节点） |
| 任务 | `update_node` | 更新任务字段 |
| 任务 | `delete_node` | 删除任务（连带后代子节点，不可恢复） |
| 任务 | `toggle_node_completed` | 切换完成状态 |
| 任务 | `toggle_node_followed` | 切换关注状态 |
| 边 | `add_edge` | 建立前置 / 依赖关系 |
| 边 | `remove_edge` | 删除前置 / 依赖关系 |
| 笔记 | `list_notes` | 列出笔记 |
| 笔记 | `read_note` | 读取笔记正文（Markdown） |
| 笔记 | `create_note` | 创建笔记（可带正文） |
| 笔记 | `update_note` | 更新笔记标题 / 正文 |
| 笔记 | `delete_note` | 删除笔记（连带正文文件，不可恢复） |

## 本地验证

对测试数据副本跑端到端回归（25 项断言，不触碰真实数据）：

```
$env:WEAVEX_DATA_DIR = "H:\workspace\temp\mcp-test-data"
node test-client.mjs H:\workspace\weavex\mcp-server\bin\mcp-server.exe
```

## 注意事项

- 删除类工具（`delete_graph` / `delete_node` / `delete_note`）不可恢复，调用前请与用户确认目标
- MCP 与 Weavex 应用可同时运行（SQLite 使用 `busy_timeout` 处理并发锁）
- 应用内的改动会即时反映到 MCP 查询结果，反之亦然（filesystem-first：应用 watcher 广播变更）
- 日志输出走 stderr（stdio 通道被协议占用）；`WEAVEX_PARENT_PID` 可设置父进程看护（按需）
