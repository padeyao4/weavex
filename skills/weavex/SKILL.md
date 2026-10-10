***

name: weavex

description: 操作 Weavex 任务图与笔记数据。当用户提到 Weavex、任务图 / 项目（Weavex 语境）、任务节点、依赖边、笔记（Weavex 语境）、任务进度 / 完成率汇总，或要求读取、创建、修改、删除本地 Weavex 数据时使用。提供统一 CLI 调用 19 个 MCP 工具（项目、任务、依赖边、笔记的完整增删改查）与常用工作流。



***

# Weavex 技能

通过 mcp-server.exe（Rust 版 MCP server，stdio）读写 Weavex 的 SQLite 数据与 Markdown 笔记，与 Weavex 应用完全同口径（filesystem-first，应用运行时会自动同步 UI）。

## 入口

所有工具都通过统一 CLI 调用（脚本位于本技能 `scripts/weavex.ps1`，PowerShell 直接调用 mcp-server.exe，**零 Node 依赖**）：

```
powershell -NoProfile -ExecutionPolicy Bypass -File <本技能目录>/scripts/weavex.ps1 <tool> '<json 参数>' [--dev] [--data-dir <目录>]
```

- `<tool>`：19 个工具之一，参数与返回手册见 references/tools.md（必读）
- `--dev`：操作开发版数据（`%APPDATA%\dev.padeyao4.weavex`）；不加则操作生产数据（`%APPDATA%\padeyao4.weavex`）。开发期用户通常用 `--dev`，与 `npm run dev` 的数据一致
- `--data-dir <目录>`：显式指定数据目录（等效环境变量 `WEAVEX_DATA_DIR`），优先级最高
- mcp-server.exe 路径可用环境变量 `WEAVEX_MCP_SERVER` 覆盖（默认项目安装位 `H:\workspace\weavex\mcp-server\bin\mcp-server.exe`）

输出为工具返回的 result JSON（2 空格缩进）。错误时退出码非 0，消息带 `[mcp]` 或 `工具错误：` 前缀。

## 常用工作流

### 查询



1. 列项目：`weavex.ps1 list_graphs '{}'`，得到 items `[].id`

2. 项目详情（节点树 + 边）：get\_graph '{"graphId":""}'

3. 列任务：list\_nodes '{"graphId":""}'；单任务：get\_node '{"graphId":"","nodeId":""}'

4. 笔记：list\_notes '{}' → read\_note '{"noteId":""}'

### 写入

先查询确认目标 id，再执行：



* 建项目：create\_graph '{"name":"..."}'

* 重命名：rename\_graph '{"graphId":"...","name":"..."}'

* 建任务：create\_node '{"graphId":"...","name":"...","parentId":"< 可选>"}'（不带 parentId 为根任务）

* 改任务：update\_node '{"graphId":"...","nodeId":"...","description":"..."}'（只更新传入字段）

* 切换完成 / 关注：toggle\_node\_completed /toggle\_node\_followed（参数 graphId,nodeId）

* 依赖边：add\_edge '{"graphId":"...","sourceId":"...","targetId":"..."}'（source 为前置）；remove\_edge 同参数

* 笔记：create\_note '{"title":"...","content":"..."}'、update\_note '{"noteId":"...","title":"...","content":"..."}'

删除类工具（delete\_graph /delete\_node/delete\_note）不可恢复，调用前必须向用户确认目标。

### 进度汇总

组合调用，按需组装成报告：



1. list\_graphs 列出全部项目

2. 对每个项目 get\_graph，从 nodes（扁平数组，每项含 children）统计：

* 总节点数、已完成数（completed: true）、完成率

* 根任务数（nodes 中 parent 为 null 的数量，或 roots.length）

* 过期任务：!completed && endAt > 0 && endAt <当前毫秒时间戳（用 Date.now () 计算）

* 关注任务：isFollowed: true

1. 输出建议：每个项目一行要点（完成率、未完成数、过期任务名），再给整体结论；引用具体任务名和 ID 便于后续操作

## 注意事项



* 数据目录解析：WEAVEX\_DATA\_DIR → --dev 时 dev.padeyao4.weavex/ 否则 padeyao4.weavex（目录存在 weavex.db 才采用）→ 兜底～\Documents\WeavexData；数据库不存在时 mcp-server 报错退出（提示先启动一次 Weavex）

* 时间戳均为毫秒；priority 为置顶时间戳（越大越靠前），showArchive/completed/expanded/isFollowed/isArchive 均为布尔

* get\_graph 的 edges 为 {source\_id, target\_id}（snake\_case），其余字段 camelCase

* 应用正在运行时，写入会被应用 watcher 自动同步到界面；应用未运行时，改动在下次启动 Weavex 时加载

* 所有 id 均为 uuid 字符串，跨工具可互相引用（如 parentId、sourceId 都来自 get\_graph/list\_nodes 的 id）