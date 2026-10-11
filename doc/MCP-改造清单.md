# Weavex MCP 改造清单

> 2026-10-11 与项目 owner 讨论后记录，逐项处理。
> 现状参考：`src-tauri/src/mcp_server.rs`（手写 JSON-RPC over stdio，19 工具）。

## 讨论要点（按处理顺序）

| # | 要点 | 说明 | 状态 |
|---|---|---|---|
| 1 | **协议层改官方 SDK** | 现为手写 JSON-RPC（initialize/ping/tools/list/tools/call），resources/prompts/completion 为空占位，错误码一律 -32603，无 logging/roots/sampling。手写协议后续要自己追规范演进，维护成本高。改官方 Rust MCP SDK（rmcp）。 | ✅ 已完成（见下方"第 1 项完成记录"） |
| 2 | **存储并发开 WAL** | 多写者（UI + 多个 MCP 客户端进程）直写同一 SQLite，现靠 busy_timeout 5s 硬等，长事务下 UI 可能卡顿。`open_db` 开 `PRAGMA journal_mode=WAL` 收益高、风险低。 | ✅ 已完成（见下方"第 2 项完成记录"） |
| 3 | **能力面：resources / prompts** | 笔记目前只能按 id 读，客户端无法主动发现内容。可把笔记暴露为 MCP resources（如 `weavex://notes/{id}`），模型可直接引用。 | ✅ 已完成（见下方"第 3 项完成记录"） |
| 4 | **语义细节修正** | ① `rename_graph` 不校验存在性，0 行也返回 ok；② `build_graph_detail` 的 `nodes_out` 对每个节点递归展开完整子树，深图下输出 O(n²) 量级；③ 错误码分级与 isError 结构化错误。 | ✅ 已完成（见下方"第 4 项完成记录"；③ 已随第 1 项完成） |

## 第 1 项完成记录（2026-10-11）

- **改动文件**：
  - `src-tauri/Cargo.toml`：新增 `rmcp = { version = "3.5", features = ["transport-io"] }`、`tokio`（rt-multi-thread/macros/sync）
  - `src-tauri/src/mcp_server.rs`：手写 JSON-RPC 循环替换为 `rmcp` `ServerHandler`（`get_info` / `list_tools` / `call_tool`）；19 个工具实现与返回 JSON 逐字段不变；`stdio_main` 内建 tokio runtime，`server.serve(stdio()).await`
  - `skills/weavex/scripts/weavex.ps1`：新增识别 `isError` 工具级错误（打印 `工具错误:` 并退出非 0）
  - `README.md`、`skills/weavex/references/tools.md`：同步协议说明与错误语义
- **行为变化（有意为之）**：
  - 工具运行失败（参数缺失、目标不存在等）从 JSON-RPC `-32603` 协议错误改为 MCP 标准 `isError` 结果（`content[0].text` 为消息）——客户端可读、符合官方语义；`weavex.ps1` 已同步适配
  - `rusqlite::Connection` 非 `Sync`，进程内用 `Mutex` 串行化访问（stdio 单客户端无影响；跨进程并发仍由 SQLite busy_timeout 兜底）
  - 握手、ping、协议版本协商、`notifications/initialized` 由 SDK 处理
- **验证**：`scripts/test-client.mjs` 25/25 通过（测试数据副本，未触碰真实数据）；`weavex.ps1` 成功路径与错误路径均验证通过
- **注意**：rmcp 要求 Rust >= 1.88（README 环境要求已更新）

## 第 3 项完成记录（2026-10-11）

- **改动文件**：
  - `src-tauri/src/mcp_server.rs`：`get_info` 能力声明增加 `enable_resources()`；新增 `list_resources`（全部笔记映射为 `Resource`，uri `weavex://notes/{noteId}`）、`list_resource_templates`（返回 URI 模板）、`read_resource`（解析 URI → 读取正文，返回 `text/markdown`）；抽取 `load_note` 供工具与资源共用；未知 URI 返回 `-32002` 资源不存在错误
  - `scripts/test-client.mjs`：新增 4 项 resources 断言（list 含新笔记 / read 正文 / templates / read 不存在）
  - `README.md`、`skills/weavex/references/tools.md`：新增 Resources 说明
- **行为**：客户端可 `resources/list` 发现笔记、`resources/templates/list` 获取模板、`resources/read` 直接读正文；`noteId` 与工具返回的 `id` 同源
- **验证**：`scripts/test-client.mjs` 29/29 通过（25 项原有 + 4 项新增）

## 第 4 项完成记录（2026-10-11）

- **改动文件**：
  - `src-tauri/src/mcp_server.rs`：
    - `rename_graph`：检查 UPDATE 影响行数，0 行返回 `项目不存在: <id>`（与 `get_graph` 同口径）
    - `build_graph_detail`：`nodes` 改为扁平序列化，`children` 存**子节点 ID 数组**（与前端 stores/graph 内存模型一致），每个节点只序列化一次，整体 O(N)；`roots` 保留完整递归树供客户端渲染；`edges` 不变
  - `scripts/test-client.mjs`：新增 3 项断言（`nodes.children` 为 ID 数组、`roots` 为嵌套树、重命名不存在项目报错）
  - `skills/weavex/references/tools.md`：更新 `get_graph` 返回契约
- **行为变化（有意为之）**：`get_graph` 的 `nodes[].children` 从"嵌套完整子树"改为"子节点 ID 数组"。属契约收紧：`nodes` 是 O(N) 扁平查找表，树形结构由 `roots` 承担，与前端模型对齐；原有 29 项断言全部兼容
- **验证**：`scripts/test-client.mjs` 32/32 通过

## 第 2 项完成记录（2026-10-11）

- **改动文件**：`src-tauri/src/db.rs` 的 `open_db` 在 busy_timeout 后增加 `PRAGMA journal_mode = WAL;`（幂等；应用 UI 与 MCP 共用此函数，全部连接统一生效）
- **并发验证**（真实多进程，非模拟）：
  - MCP 会话存活期间，另一进程（python）直连同库写入，无阻塞/报错；MCP 随后 `list_graphs` 立即看到外部新增（2→3）
  - `PRAGMA journal_mode` 返回 `wal`（持久属性）
  - 连接关闭后 `-wal`/`-shm` 自动 checkpoint 清理，目录无残留文件
- **对 watcher 的影响**：WAL 的 `-wal`/`-shm` 文件事件由现有 150ms 防抖合并为一次 `data-changed` 广播（watcher.rs 注释本就为此设计），无额外噪声
- **验证**：`scripts/test-client.mjs` 32/32 通过；`weavex.ps1` 正常

## 全部完成（2026-10-11）

四项讨论要点全部落地：① 协议层改官方 SDK（rmcp）② 存储并发开 WAL ③ 笔记暴露为 MCP resources ④ 语义细节修正。
回归测试从 25 项扩展至 **32 项**，全部通过；README / tools.md / SKILL.md / 清单文档同步完毕。

## 验收口径

- 19 个工具行为与返回 JSON 结构不变（与 UI 同口径）。
- `scripts/test-client.mjs` 25 项断言全部通过。
- 保持单 exe、零 Node 依赖；`--mcp-stdio` / `--dev` / `WEAVEX_DATA_DIR` 行为不变。
- `skills/weavex`（weavex.ps1 直调 exe）无需改动即可继续工作。
