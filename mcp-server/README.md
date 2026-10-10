# Weavex MCP Server

让豆包（以及其他支持 MCP 的 AI 客户端）直接读写 Weavex 的任务图与笔记数据。

## 功能



* **19 个工具**，覆盖项目、任务节点、依赖边、笔记的完整增删改查

* 数据口径与 Weavex 应用完全一致：SQLite `weavex.db`（graphs /nodes/edges /notes 四表）+ `notes/*.md` 笔记正文

* 自动定位 Weavex 数据目录，无需手工指定

## 启动方式

**默认：Weavex 应用启动时自动拉起 MCP 服务（HTTP 模式），应用退出时自动停止**——无需手动启动，豆包只需配置一次连接器。

也可手动启动（调试 / 单独运行时）：

| 模式 | 启动命令 | 适用客户端 |
| --- | --- | --- |
| **HTTP**（推荐给豆包） | `node server.mjs --http` | 豆包（豆包工作桌面版）等仅支持 HTTP 连接器的客户端 |
| **stdio** | `node server.mjs` | Claude Desktop / Cursor 等支持本地进程的客户端 |

HTTP 模式默认监听 `http://127.0.0.1:8912/mcp`（**生产版**），**开发版**（`--dev` / `WEAVEX_DEV=1`）默认 `8913`；端口均可用环境变量 `WEAVEX_MCP_PORT` 修改（如 `WEAVEX_MCP_PORT=9000`）。

```
cd H:\workspace\weavex\mcp-server
npm install        # 已装过可跳过（Weavex 打包分发时已内置，仅源码开发时需要）
node server.mjs --http
```

> 依赖 Node.js ≥ 22.5（内置 `node:sqlite`，无需任何原生编译）。

## 应用自动拉起的行为说明

| 场景 | 行为 |
| --- | --- |
| Weavex 启动 | 自动检测端口：空闲则拉起 `node server.mjs --http`；已被监听（如手动启动过）则跳过，不重复启动 |
| Weavex 正常退出 | 自动终止 MCP 子进程，释放端口 |
| Weavex 崩溃 / 被强杀 | MCP 子进程内置父进程看护（每 5s 检测），检测到父进程消失后自动退出 |
| 服务日志 | 生产版 `%APPDATA%\padeyao4.weavex\mcp-server.log`；开发版 `%APPDATA%\dev.padeyao4.weavex\mcp-server.log` |
| 生产（打包版） | mcp-server 随安装包分发（bundle.resources）；目标机器需安装 Node.js ≥ 22.5 |

## 在豆包中添加 MCP 服务器（HTTP 连接器）

豆包桌面客户端支持「自定义连接器」，但**只支持 HTTP 传输类型，不支持 stdio 本地进程**。步骤：



1. 启动 Weavex 应用（MCP 服务随之自动启动）

2. 打开豆包桌面客户端，在左侧菜单中选择 **连接器 · 技能 · 伙伴**

3. 点击右上角 **添加 → 新建自定义连接器**

4. 填写配置：

* **服务器名称**：`weavex`

* **传输类型**：`HTTP`

* **服务器 URL**：`http://127.0.0.1:8912/mcp`

  > 若同时运行开发版 Weavex（端口 8913），可再添加一个连接器指向 `http://127.0.0.1:8913/mcp`。

5. 保存后即可在豆包对话中直接查询 / 创建 / 修改你的任务与笔记（如「查看我今天的任务」「新建笔记《xxx》」「给 XX 加个子任务」）

> 说明：豆包连接器支持接入本机运行的服务（官方示例即使用 `http://127.0.0.1:8000/mcp` 形式）。若豆包版本没有「连接器」入口，请升级豆包客户端到最新版。
>
> 兼容性：豆包连接器请求可能只声明 `application/json` 而缺少 `text/event-stream`（MCP 规范要求两者），本服务已做宽容处理（自动补全 Accept 声明），POST 响应统一返回纯 JSON，实测兼容豆包式请求。

## 排错

| 现象 | 处理 |
| --- | --- |
| 豆包报 `Not Acceptable: Client must accept text/event-stream` | 旧版服务对 Accept 校验过严，**重启 Weavex** 使新版 server.mjs 生效即可 |
| 豆包提示连不上 / 拉不到工具 | 确认 Weavex 正在运行；重启 Weavex 后再进连接器列表编辑触发重新拉取，或重启豆包客户端 |
| 端口被占用 | Weavex 启动时会自动检测，占用则跳过（可能复用的是旧进程，重启 Weavex 可刷新） |

## 数据目录解析规则（优先级从高到低）



| 优先级 | 来源 | 说明 |
| --- | --- | --- |
| 1 | 环境变量 `WEAVEX_DATA_DIR` | 显式指定数据目录 |
| 2 | `%APPDATA%\padeyao4.weavex` | Weavex **生产版** Tauri appDataDir（含 weavex.db） |
| 3 | `%APPDATA%\dev.padeyao4.weavex` | 传 `--dev` 参数或设 `WEAVEX_DEV=1` 时读取（**开发版** appDataDir） |
| 4 | `~\Documents\WeavexData` | 兜底兼容旧版数据位置 |

> dev/prod 通过 **identifier 分离**（`padeyao4.weavex` vs `dev.padeyao4.weavex`）实现数据隔离，MCP 服务随应用自动拉起时会自动匹配对应环境。

示例：让服务器操作开发版数据（同时切到开发版端口 8913）

```
node server.mjs --http --dev
```

## 工具清单



| 分类 | 工具                      | 说明                 |
| -- | ----------------------- | ------------------ |
| 项目 | `list_graphs`           | 列出所有项目             |
| 项目 | `get_graph`             | 获取项目完整结构（节点树 + 边）  |
| 项目 | `create_graph`          | 创建项目               |
| 项目 | `rename_graph`          | 重命名项目              |
| 项目 | `delete_graph`          | 删除项目（连带节点与边，不可恢复）  |
| 任务 | `list_nodes`            | 列出项目全部任务节点         |
| 任务 | `get_node`              | 获取单个任务节点           |
| 任务 | `create_node`           | 创建任务（可指定父节点）       |
| 任务 | `update_node`           | 更新任务字段             |
| 任务 | `delete_node`           | 删除任务（连带后代子节点，不可恢复） |
| 任务 | `toggle_node_completed` | 切换完成状态             |
| 任务 | `toggle_node_followed`  | 切换关注状态             |
| 边  | `add_edge`              | 建立前置 / 依赖关系        |
| 边  | `remove_edge`           | 删除前置 / 依赖关系        |
| 笔记 | `list_notes`            | 列出笔记               |
| 笔记 | `read_note`             | 读取笔记正文（Markdown）   |
| 笔记 | `create_note`           | 创建笔记（可带正文）         |
| 笔记 | `update_note`           | 更新笔记标题 / 正文        |
| 笔记 | `delete_note`           | 删除笔记（连带正文文件，不可恢复）  |

## 本地验证

对**测试数据副本**跑端到端测试（不会触碰真实数据）：



```
Copy-Item "$env:USERPROFILE\Documents\WeavexData" "H:\workspace\temp\mcp-test-data" -Recurse
$env:WEAVEX_DATA_DIR = "H:\workspace\temp\mcp-test-data"
cd H:\workspace\weavex\mcp-server
node test-client.mjs        # stdio 模式回归（25 项断言）
node server.mjs --http      # 另开窗口启动 HTTP 模式
node http-test.mjs          # HTTP 模式回归（4 项断言）
```

## 注意事项



* 删除类工具（`delete_graph` / `delete_node` / `delete_note`）不可恢复，调用前请与用户确认目标

* MCP 与 Weavex 应用可同时运行（SQLite 使用 `busy_timeout` 处理并发锁）

* 应用内的改动会即时反映到 MCP 查询结果，反之亦然