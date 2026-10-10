# Weavex MCP 工具手册

数据模型（SQLite `weavex.db` 四表 + `notes/*.md`）：

- `graphs` 项目（任务图）：`id / name / created_at / updated_at / root_node_ids(JSON) / show_archive / priority(置顶时间戳) / viewport`
- `nodes` 任务节点：`id / graph_id / name / description / record / created_at / updated_at / start_at / end_at / parent_id / completed_at / completed(0|1) / expanded / priority / is_followed / is_archive`
- `edges` 依赖边：`graph_id / source_id / target_id`（source 是 target 的前置，target 依赖 source 完成）
- `notes` 笔记：`id / title / path(相对 notes/ 目录) / created_at / updated_at`

返回约定：

- 时间戳均为**毫秒**（`Date.now()` 语义）
- 节点字段 camelCase：`completed`/`expanded`/`isFollowed`/`isArchive` 为**布尔**（`===1`）；`priority` 为 number 或 null；`parent` 为 string 或 null
- `get_graph` 返回 `{graph, nodes, roots, edges}`：`nodes` 为带 `children` 的树形扁平数组（按 `priority, created_at` 排序），`roots` 为根节点树，`edges` 为 `{source_id, target_id}`（注意 snake_case）
- 删除类工具不可恢复，调用前与用户确认目标

## 项目（图）

| 工具 | 参数 | 返回要点 |
|---|---|---|
| `list_graphs` | 无 | `{count, items:[{id,name,createdAt,updatedAt,rootNodeCount}]}` |
| `get_graph` | `graphId` | `{graph,nodes,roots,edges}` 完整结构 |
| `create_graph` | `name` | 新建后返回完整 `{graph,nodes,roots,edges}` |
| `rename_graph` | `graphId,name` | `{ok,graphId,name}` |
| `delete_graph` | `graphId` | `{ok,graphId}`（连带节点与边，不可恢复） |

## 任务节点

| 工具 | 参数 | 返回要点 |
|---|---|---|
| `list_nodes` | `graphId` | `{graphId,count,nodes[]}`（扁平、无 children） |
| `get_node` | `graphId,nodeId` | 单节点完整字段 |
| `create_node` | `graphId,name`，可选 `description,record,parentId,startAt,endAt` | 创建后返回完整图结构；不带 `parentId` 为根任务（自动加入 `rootNodeIds`） |
| `update_node` | `graphId,nodeId`，可选 `name,description,record,startAt,endAt` | `{ok,graphId,nodeId}`；只更新传入字段 |
| `delete_node` | `graphId,nodeId` | `{ok,graphId,nodeId,deletedNodeCount}`；递归删除子树+连带边（不可恢复） |
| `toggle_node_completed` | `graphId,nodeId` | `{ok,graphId,nodeId,completed}` 取反 |
| `toggle_node_followed` | `graphId,nodeId` | `{ok,graphId,nodeId,isFollowed}` 取反；关注时置顶（priority=now） |

## 依赖边

| 工具 | 参数 | 返回要点 |
|---|---|---|
| `add_edge` | `graphId,sourceId,targetId` | `{ok,graphId,sourceId,targetId}`（幂等） |
| `remove_edge` | `graphId,sourceId,targetId` | `{ok,graphId,sourceId,targetId}` |

## 笔记

| 工具 | 参数 | 返回要点 |
|---|---|---|
| `list_notes` | 无 | `{count,items:[{id,title,createdAt,updatedAt}]}`（按 updated_at 倒序） |
| `read_note` | `noteId` | `{id,title,createdAt,updatedAt,content}`（Markdown 正文） |
| `create_note` | `title`，可选 `content` | `{id,title,createdAt,updatedAt}`；传 content 则写 `notes/<id>.md` |
| `update_note` | `noteId`，可选 `title,content` | `{ok,noteId}`；只更新传入字段 |
| `delete_note` | `noteId` | `{ok,noteId}`（连带正文文件，不可恢复） |

## 错误语义

- 不存在的项目/节点/笔记 → 工具错误，消息形如 `项目不存在: <id>`、`节点不存在: <id>`、`笔记不存在: <id>`
- 调用入口脚本对错误统一输出 `[mcp]` 前缀或 `工具错误:`，退出码非 0
