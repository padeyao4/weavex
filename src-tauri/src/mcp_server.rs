// Weavex MCP Server —— Rust 实现（基于官方 rmcp SDK，stdio 传输）
//
// 协议层由官方 SDK rmcp（modelcontextprotocol/rust-sdk）接管，替代早期手写 JSON-RPC：
//   - initialize / ping / notifications 握手、协议版本协商由 SDK 处理
//   - tools/list / tools/call 由 ServerHandler 实现（19 个工具）
//   - 错误语义按 SDK 约定：工具运行失败返回 isError 结果（调用方可读），
//     不可路由的请求（未知工具）返回 JSON-RPC 协议错误
// 工具实现与返回 JSON 结构保持不变（与 UI 同口径，直接复用 crate::db 数据层）。
// 自 0.4 起与主应用合并为单一二进制：主程序 weavex.exe 以 --mcp-stdio 参数进入本模式，
// 目标机器无需安装 Node，也无需额外分发 mcp-server.exe。
//
// 数据定位（优先级从高到低，与历史版本一致）：
//   1. 环境变量 WEAVEX_DATA_DIR（显式指定）
//   2. %APPDATA%\padeyao4.weavex（--dev 或 WEAVEX_DEV=1 时为 dev.padeyao4.weavex，仅当存在 weavex.db）
//   3. 兜底兼容旧版：~\Documents\WeavexData

use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};

use rusqlite::{Connection, params};
use serde_json::{Value, json};
use crate::db::{
    add_edge, create_node, delete_graph, delete_node, delete_note, now_ms, open_db,
    remove_edge, update_node, upsert_graph_meta, upsert_note_meta,
    GraphMetaPatch, NodeDto, NodePatch, NoteMetaDto,
};

use rmcp::{
    ErrorData, RoleServer, ServiceExt,
    handler::server::ServerHandler,
    model::{
        CallToolRequestParams, CallToolResponse, CallToolResult, ContentBlock, Implementation,
        ListResourceTemplatesResult, ListResourcesResult, ListToolsResult, PaginatedRequestParams,
        ReadResourceRequestParams, ReadResourceResponse, ReadResourceResult, Resource,
        ResourceContents, ResourceTemplate, ServerCapabilities, ServerConfig, Tool,
    },
    service::RequestContext,
    transport::stdio,
};

const SERVER_NAME: &str = "weavex";
const SERVER_VERSION: &str = "0.1.0";

// ---------------- 数据目录解析（与历史版本一致） ----------------

fn is_dev_mode(args: &[String]) -> bool {
    env::var("WEAVEX_DEV").is_ok_and(|v| v == "1") || args.iter().any(|a| a == "--dev")
}

fn resolve_data_dir(args: &[String]) -> PathBuf {
    if let Ok(d) = env::var("WEAVEX_DATA_DIR") {
        if !d.is_empty() {
            return PathBuf::from(d);
        }
    }
    let app_data = env::var("APPDATA").unwrap_or_else(|_| {
        let home = env::var("USERPROFILE").or_else(|_| env::var("HOME")).unwrap_or_default();
        PathBuf::from(home).join("AppData").join("Roaming").to_string_lossy().into_owned()
    });
    let dir = PathBuf::from(app_data).join(if is_dev_mode(args) {
        "dev.padeyao4.weavex"
    } else {
        "padeyao4.weavex"
    });
    if dir.join("weavex.db").exists() {
        return dir;
    }
    let home = env::var("USERPROFILE").or_else(|_| env::var("HOME")).unwrap_or_default();
    PathBuf::from(home).join("Documents").join("WeavexData")
}

// ---------------- 查询辅助（返回结构与前端对齐） ----------------

struct GraphRow {
    id: String,
    name: String,
    created_at: i64,
    updated_at: i64,
    root_node_ids: String,
    show_archive: Option<i64>,
    priority: Option<f64>,
}

fn get_graph_row(conn: &Connection, graph_id: &str) -> Result<GraphRow, String> {
    conn.query_row(
        "SELECT id, name, created_at, updated_at, root_node_ids, show_archive, priority
         FROM graphs WHERE id = ?1",
        params![graph_id],
        |row| {
            Ok(GraphRow {
                id: row.get(0)?,
                name: row.get(1)?,
                created_at: row.get(2)?,
                updated_at: row.get(3)?,
                root_node_ids: row.get(4)?,
                show_archive: row.get(5)?,
                priority: row.get(6)?,
            })
        },
    )
    .map_err(|_| format!("项目不存在: {}", graph_id))
}

fn parse_root_ids(json: &str) -> Vec<String> {
    serde_json::from_str(json).unwrap_or_default()
}

fn notes_dir(data_dir: &Path) -> PathBuf {
    data_dir.join("notes")
}

// ---------------- normalizeNode（与前端逐字段一致） ----------------

struct NodeRow {
    id: String,
    graph_id: String,
    name: String,
    description: String,
    record: String,
    created_at: i64,
    updated_at: i64,
    start_at: i64,
    end_at: i64,
    parent_id: Option<String>,
    completed_at: i64,
    completed: i64,
    expanded: Option<i64>,
    priority: Option<f64>,
    is_followed: Option<i64>,
    is_archive: Option<i64>,
}

const NODE_COLS: &str = "id, graph_id, name, description, record, created_at, updated_at, \
     start_at, end_at, parent_id, completed_at, completed, expanded, priority, is_followed, is_archive";

fn query_nodes(conn: &Connection, graph_id: &str) -> Result<Vec<NodeRow>, String> {
    let mut stmt = conn
        .prepare(&format!(
            "SELECT {} FROM nodes WHERE graph_id = ?1 ORDER BY priority, created_at",
            NODE_COLS
        ))
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![graph_id], |row| {
            Ok(NodeRow {
                id: row.get(0)?,
                graph_id: row.get(1)?,
                name: row.get(2)?,
                description: row.get(3)?,
                record: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
                start_at: row.get(7)?,
                end_at: row.get(8)?,
                parent_id: row.get(9)?,
                completed_at: row.get(10)?,
                completed: row.get(11)?,
                expanded: row.get(12)?,
                priority: row.get(13)?,
                is_followed: row.get(14)?,
                is_archive: row.get(15)?,
            })
        })
        .map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for r in rows {
        out.push(r.map_err(|e| e.to_string())?);
    }
    Ok(out)
}

fn normalize_node(n: &NodeRow) -> Value {
    json!({
        "id": n.id,
        "graphId": n.graph_id,
        "name": n.name,
        "description": n.description,
        "record": n.record,
        "createdAt": n.created_at,
        "updatedAt": n.updated_at,
        "startAt": n.start_at,
        "endAt": n.end_at,
        "parent": n.parent_id,
        "completedAt": n.completed_at,
        "completed": n.completed == 1,
        "expanded": n.expanded == Some(1),
        "priority": n.priority,
        "isFollowed": n.is_followed == Some(1),
        "isArchive": n.is_archive == Some(1),
    })
}

/// 组装图详情（与前端口径一致：parent 指向父节点，无 parent 为根）。
/// - `nodes`：扁平数组，每个节点带 `children`（**子节点 ID 数组**，与前端内存模型一致）；
///   只序列化每个节点一次，整体 O(N)，避免深图下的 O(N²) 子树重复展开
/// - `roots`：根节点完整递归树（客户端可直接渲染树形结构）
/// - `edges`：{source_id, target_id}（snake_case）
fn build_graph_detail(conn: &Connection, graph_id: &str) -> Result<Value, String> {
    let g = get_graph_row(conn, graph_id)?;
    let nodes = query_nodes(conn, graph_id)?;

    let by_id: std::collections::HashMap<String, &NodeRow> =
        nodes.iter().map(|n| (n.id.clone(), n)).collect();
    let mut children_of: std::collections::HashMap<String, Vec<String>> =
        std::collections::HashMap::new();
    // nodes 已按 priority, created_at 排序，children 顺序与之一致
    for n in &nodes {
        if let Some(pid) = &n.parent_id {
            if by_id.contains_key(pid) {
                children_of.entry(pid.clone()).or_default().push(n.id.clone());
            }
        }
    }

    fn expand(
        id: &str,
        by_id: &std::collections::HashMap<String, &NodeRow>,
        children_of: &std::collections::HashMap<String, Vec<String>>,
    ) -> Value {
        let node = by_id.get(id).expect("node exists");
        let mut obj = match normalize_node(node) {
            Value::Object(o) => o,
            _ => unreachable!(),
        };
        let kids = children_of.get(id).cloned().unwrap_or_default();
        obj.insert(
            "children".to_string(),
            Value::Array(kids.iter().map(|k| expand(k, by_id, children_of)).collect()),
        );
        Value::Object(obj)
    }

    let mut roots_out: Vec<Value> = Vec::new();
    for n in &nodes {
        let is_root = match &n.parent_id {
            Some(pid) => !by_id.contains_key(pid),
            None => true,
        };
        if is_root {
            roots_out.push(expand(&n.id, &by_id, &children_of));
        }
    }
    // 扁平：children 存子节点 ID（与前端 stores/graph 模型一致，O(N)）
    let nodes_out: Vec<Value> = nodes
        .iter()
        .map(|n| {
            let mut obj = match normalize_node(n) {
                Value::Object(o) => o,
                _ => unreachable!(),
            };
            let kids = children_of.get(&n.id).cloned().unwrap_or_default();
            obj.insert(
                "children".to_string(),
                Value::Array(kids.into_iter().map(Value::String).collect()),
            );
            Value::Object(obj)
        })
        .collect();

    let mut stmt = conn
        .prepare("SELECT source_id, target_id FROM edges WHERE graph_id = ?1")
        .map_err(|e| e.to_string())?;
    let edge_rows = stmt
        .query_map(params![graph_id], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })
        .map_err(|e| e.to_string())?;
    let mut edges_out: Vec<Value> = Vec::new();
    for r in edge_rows {
        let (s, t) = r.map_err(|e| e.to_string())?;
        edges_out.push(json!({ "source_id": s, "target_id": t }));
    }

    let graph = json!({
        "id": g.id,
        "name": g.name,
        "createdAt": g.created_at,
        "updatedAt": g.updated_at,
        "showArchive": g.show_archive == Some(1),
        "priority": g.priority,
        "rootNodeIds": parse_root_ids(&g.root_node_ids),
    });

    Ok(json!({
        "graph": graph,
        "nodes": nodes_out,
        "roots": roots_out,
        "edges": edges_out,
    }))
}

// ---------------- 19 个工具实现 ----------------

fn tool_list_graphs(conn: &Connection) -> Result<Value, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, name, created_at, updated_at, root_node_ids FROM graphs ORDER BY priority, created_at",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, i64>(2)?,
                row.get::<_, i64>(3)?,
                row.get::<_, String>(4)?,
            ))
        })
        .map_err(|e| e.to_string())?;
    let mut items: Vec<Value> = Vec::new();
    for r in rows {
        let (id, name, created_at, updated_at, root_json) = r.map_err(|e| e.to_string())?;
        items.push(json!({
            "id": id,
            "name": name,
            "createdAt": created_at,
            "updatedAt": updated_at,
            "rootNodeCount": parse_root_ids(&root_json).len(),
        }));
    }
    Ok(json!({ "count": items.len(), "items": items }))
}

fn tool_get_graph(conn: &Connection, args: &Value) -> Result<Value, String> {
    let graph_id = arg_str(args, "graphId")?;
    build_graph_detail(conn, &graph_id)
}

fn tool_create_graph(conn: &Connection, args: &Value) -> Result<Value, String> {
    let name = arg_str(args, "name")?;
    let id = uuid::Uuid::new_v4().to_string();
    let t = now_ms();
    upsert_graph_meta(
        conn,
        &GraphMetaPatch {
            id: id.clone(),
            name: Some(name),
            priority: Some(t as f64),
            updated_at: Some(t),
            ..Default::default()
        },
    )?;
    build_graph_detail(conn, &id)
}

fn tool_rename_graph(conn: &Connection, args: &Value) -> Result<Value, String> {
    let graph_id = arg_str(args, "graphId")?;
    let name = arg_str(args, "name")?;
    let affected = conn
        .execute(
            "UPDATE graphs SET name = ?1, updated_at = ?2 WHERE id = ?3",
            params![name, now_ms(), graph_id],
        )
        .map_err(|e| format!("Failed to rename graph: {}", e))?;
    if affected == 0 {
        return Err(format!("项目不存在: {}", graph_id));
    }
    Ok(json!({ "ok": true, "graphId": graph_id, "name": name }))
}

fn tool_delete_graph(conn: &Connection, args: &Value) -> Result<Value, String> {
    let graph_id = arg_str(args, "graphId")?;
    delete_graph(conn, &graph_id)?;
    Ok(json!({ "ok": true, "graphId": graph_id }))
}

fn tool_list_nodes(conn: &Connection, args: &Value) -> Result<Value, String> {
    let graph_id = arg_str(args, "graphId")?;
    get_graph_row(conn, &graph_id)?;
    let nodes = query_nodes(conn, &graph_id)?;
    let node_values: Vec<Value> = nodes.iter().map(normalize_node).collect();
    Ok(json!({ "graphId": graph_id, "count": node_values.len(), "nodes": node_values }))
}

fn tool_get_node(conn: &Connection, args: &Value) -> Result<Value, String> {
    let graph_id = arg_str(args, "graphId")?;
    let node_id = arg_str(args, "nodeId")?;
    let row: NodeRow = conn
        .query_row(
            &format!("SELECT {} FROM nodes WHERE graph_id = ?1 AND id = ?2", NODE_COLS),
            params![graph_id, node_id],
            |r| {
                Ok(NodeRow {
                    id: r.get(0)?,
                    graph_id: r.get(1)?,
                    name: r.get(2)?,
                    description: r.get(3)?,
                    record: r.get(4)?,
                    created_at: r.get(5)?,
                    updated_at: r.get(6)?,
                    start_at: r.get(7)?,
                    end_at: r.get(8)?,
                    parent_id: r.get(9)?,
                    completed_at: r.get(10)?,
                    completed: r.get(11)?,
                    expanded: r.get(12)?,
                    priority: r.get(13)?,
                    is_followed: r.get(14)?,
                    is_archive: r.get(15)?,
                })
            },
        )
        .map_err(|_| format!("节点不存在: {}", node_id))?;
    Ok(normalize_node(&row))
}

fn tool_create_node(conn: &Connection, args: &Value) -> Result<Value, String> {
    let graph_id = arg_str(args, "graphId")?;
    let name = arg_str(args, "name")?;
    let id = uuid::Uuid::new_v4().to_string();
    let t = now_ms();
    let dto = NodeDto {
        id: id.clone(),
        name,
        description: arg_opt_str(args, "description").unwrap_or_default(),
        record: arg_opt_str(args, "record").unwrap_or_default(),
        created_at: t,
        updated_at: t,
        start_at: arg_opt_i64(args, "startAt").unwrap_or(0),
        end_at: arg_opt_i64(args, "endAt").unwrap_or(0),
        parent: arg_opt_str(args, "parentId"),
        completed_at: 0,
        completed: false,
        expanded: None,
        priority: Some(t as f64),
        is_followed: Some(false),
        is_archive: Some(false),
    };
    create_node(conn, &graph_id, &dto)?;
    build_graph_detail(conn, &graph_id)
}

fn tool_update_node(conn: &Connection, args: &Value) -> Result<Value, String> {
    let graph_id = arg_str(args, "graphId")?;
    let node_id = arg_str(args, "nodeId")?;
    let mut patch = NodePatch {
        id: node_id.clone(),
        graph_id: graph_id.clone(),
        updated_at: Some(now_ms()),
        ..Default::default()
    };
    if let Some(v) = arg_opt_str(args, "name") {
        patch.name = Some(v);
    }
    if let Some(v) = arg_opt_str(args, "description") {
        patch.description = Some(v);
    }
    if let Some(v) = arg_opt_str(args, "record") {
        patch.record = Some(v);
    }
    if let Some(v) = arg_opt_i64(args, "startAt") {
        patch.start_at = Some(v);
    }
    if let Some(v) = arg_opt_i64(args, "endAt") {
        patch.end_at = Some(v);
    }
    update_node(conn, &patch)?;
    Ok(json!({ "ok": true, "graphId": graph_id, "nodeId": node_id }))
}

fn tool_delete_node(conn: &Connection, args: &Value) -> Result<Value, String> {
    let graph_id = arg_str(args, "graphId")?;
    let node_id = arg_str(args, "nodeId")?;
    let count = delete_node(conn, &graph_id, &node_id)?;
    Ok(json!({ "ok": true, "graphId": graph_id, "nodeId": node_id, "deletedNodeCount": count }))
}

fn tool_toggle_node_completed(conn: &Connection, args: &Value) -> Result<Value, String> {
    let graph_id = arg_str(args, "graphId")?;
    let node_id = arg_str(args, "nodeId")?;
    let old: i64 = conn
        .query_row(
            "SELECT completed FROM nodes WHERE graph_id = ?1 AND id = ?2",
            params![graph_id, node_id],
            |r| r.get(0),
        )
        .map_err(|_| format!("节点不存在: {}", node_id))?;
    let completed = if old == 1 { 0 } else { 1 };
    let t = now_ms();
    update_node(
        conn,
        &NodePatch {
            id: node_id.clone(),
            graph_id: graph_id.clone(),
            completed: Some(completed == 1),
            completed_at: Some(if completed == 1 { t } else { 0 }),
            updated_at: Some(t),
            ..Default::default()
        },
    )?;
    Ok(json!({ "ok": true, "graphId": graph_id, "nodeId": node_id, "completed": completed == 1 }))
}

fn tool_toggle_node_followed(conn: &Connection, args: &Value) -> Result<Value, String> {
    let graph_id = arg_str(args, "graphId")?;
    let node_id = arg_str(args, "nodeId")?;
    let (old, old_priority): (i64, Option<f64>) = conn
        .query_row(
            "SELECT is_followed, priority FROM nodes WHERE graph_id = ?1 AND id = ?2",
            params![graph_id, node_id],
            |r| Ok((r.get(0)?, r.get(1)?)),
        )
        .map_err(|_| format!("节点不存在: {}", node_id))?;
    let followed = if old == 1 { 0 } else { 1 };
    let t = now_ms();
    let mut patch = NodePatch {
        id: node_id.clone(),
        graph_id: graph_id.clone(),
        is_followed: Some(followed == 1),
        updated_at: Some(t),
        ..Default::default()
    };
    if followed == 1 {
        // 关注时置顶：priority = now；取消关注保留原 priority（与历史版本一致）
        patch.priority = Some(t as f64);
    } else {
        patch.priority = old_priority;
    }
    update_node(conn, &patch)?;
    Ok(json!({ "ok": true, "graphId": graph_id, "nodeId": node_id, "isFollowed": followed == 1 }))
}

fn tool_add_edge(conn: &Connection, args: &Value) -> Result<Value, String> {
    let graph_id = arg_str(args, "graphId")?;
    let source_id = arg_str(args, "sourceId")?;
    let target_id = arg_str(args, "targetId")?;
    add_edge(conn, &graph_id, &source_id, &target_id)?;
    Ok(json!({ "ok": true, "graphId": graph_id, "sourceId": source_id, "targetId": target_id }))
}

fn tool_remove_edge(conn: &Connection, args: &Value) -> Result<Value, String> {
    let graph_id = arg_str(args, "graphId")?;
    let source_id = arg_str(args, "sourceId")?;
    let target_id = arg_str(args, "targetId")?;
    remove_edge(conn, &graph_id, &source_id, &target_id)?;
    Ok(json!({ "ok": true, "graphId": graph_id, "sourceId": source_id, "targetId": target_id }))
}

fn tool_list_notes(conn: &Connection) -> Result<Value, String> {
    let mut stmt = conn
        .prepare("SELECT id, title, created_at, updated_at FROM notes ORDER BY updated_at DESC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, i64>(2)?,
                row.get::<_, i64>(3)?,
            ))
        })
        .map_err(|e| e.to_string())?;
    let mut items: Vec<Value> = Vec::new();
    for r in rows {
        let (id, title, created_at, updated_at) = r.map_err(|e| e.to_string())?;
        items.push(json!({
            "id": id,
            "title": title,
            "createdAt": created_at,
            "updatedAt": updated_at,
        }));
    }
    Ok(json!({ "count": items.len(), "items": items }))
}

/// 读取单篇笔记：返回 (标题, 正文 Markdown)。文件缺失/无 path 时正文为空字符串。
fn load_note(conn: &Connection, notes_dir: &Path, note_id: &str) -> Result<(String, String), String> {
    let (title, path): (String, Option<String>) = conn
        .query_row(
            "SELECT title, path FROM notes WHERE id = ?1",
            params![note_id],
            |r| Ok((r.get(0)?, r.get(1)?)),
        )
        .map_err(|_| format!("笔记不存在: {}", note_id))?;
    let mut content = String::new();
    if let Some(p) = path {
        if !p.is_empty() {
            let file = notes_dir.join(&p);
            if file.exists() {
                content = fs::read_to_string(&file)
                    .map_err(|e| format!("读取笔记文件失败 {}: {}", file.display(), e))?;
            }
        }
    }
    Ok((title, content))
}

fn tool_read_note(conn: &Connection, notes_dir: &Path, args: &Value) -> Result<Value, String> {
    let note_id = arg_str(args, "noteId")?;
    let (id, title, created_at, updated_at): (String, String, i64, i64) = conn
        .query_row(
            "SELECT id, title, created_at, updated_at FROM notes WHERE id = ?1",
            params![note_id],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?)),
        )
        .map_err(|_| format!("笔记不存在: {}", note_id))?;
    let (_, content) = load_note(conn, notes_dir, &note_id)?;
    Ok(json!({
        "id": id,
        "title": title,
        "createdAt": created_at,
        "updatedAt": updated_at,
        "content": content,
    }))
}

fn tool_create_note(conn: &Connection, notes_dir: &Path, args: &Value) -> Result<Value, String> {
    let title = arg_str(args, "title")?;
    let content = arg_opt_str(args, "content");
    let id = uuid::Uuid::new_v4().to_string();
    let t = now_ms();
    let meta_path = if content.is_some() {
        Some(format!("{}.md", id))
    } else {
        None
    };
    upsert_note_meta(
        conn,
        &NoteMetaDto {
            id: id.clone(),
            title: title.clone(),
            path: meta_path.clone(),
            created_at: t,
            updated_at: t,
        },
    )?;
    if let (Some(c), Some(p)) = (content, meta_path) {
        fs::create_dir_all(notes_dir)
            .map_err(|e| format!("创建笔记目录失败 {}: {}", notes_dir.display(), e))?;
        fs::write(notes_dir.join(&p), c)
            .map_err(|e| format!("写入笔记文件失败: {}", e))?;
    }
    Ok(json!({ "id": id, "title": title, "createdAt": t, "updatedAt": t }))
}

fn tool_update_note(conn: &Connection, notes_dir: &Path, args: &Value) -> Result<Value, String> {
    let note_id = arg_str(args, "noteId")?;
    let title = arg_opt_str(args, "title");
    let content = arg_opt_str(args, "content");
    let path: Option<String> = conn
        .query_row("SELECT path FROM notes WHERE id = ?1", params![note_id], |r| r.get(0))
        .map_err(|e| format!("笔记不存在: {} ({})", note_id, e))?;
    let t = now_ms();
    let mut new_path = path;
    if let Some(ref c) = content {
        if new_path.is_none() {
            new_path = Some(format!("{}.md", note_id));
            conn.execute(
                "UPDATE notes SET path = ?1 WHERE id = ?2",
                params![new_path.as_deref().unwrap_or(""), note_id],
            )
            .map_err(|e| format!("Failed to set note path: {}", e))?;
        }
        let p = new_path.as_deref().unwrap_or("");
        fs::create_dir_all(notes_dir)
            .map_err(|e| format!("创建笔记目录失败 {}: {}", notes_dir.display(), e))?;
        fs::write(notes_dir.join(p), c).map_err(|e| format!("写入笔记文件失败: {}", e))?;
    }
    if let Some(title) = title {
        conn.execute(
            "UPDATE notes SET title = ?1, updated_at = ?2 WHERE id = ?3",
            params![title, t, note_id],
        )
        .map_err(|e| format!("Failed to update note title: {}", e))?;
    } else if content.is_some() {
        conn.execute(
            "UPDATE notes SET updated_at = ?1 WHERE id = ?2",
            params![t, note_id],
        )
        .map_err(|e| format!("Failed to update note updated_at: {}", e))?;
    }
    Ok(json!({ "ok": true, "noteId": note_id }))
}

fn tool_delete_note(conn: &Connection, notes_dir: &Path, args: &Value) -> Result<Value, String> {
    let note_id = arg_str(args, "noteId")?;
    delete_note(conn, &note_id, notes_dir)?;
    Ok(json!({ "ok": true, "noteId": note_id }))
}

// ---------------- 参数提取辅助 ----------------

fn arg_str(v: &Value, key: &str) -> Result<String, String> {
    v.get(key)
        .and_then(|x| x.as_str())
        .map(|s| s.to_string())
        .ok_or_else(|| format!("缺少参数: {}", key))
}

fn arg_opt_str(v: &Value, key: &str) -> Option<String> {
    v.get(key).and_then(|x| x.as_str()).map(|s| s.to_string())
}

fn arg_opt_i64(v: &Value, key: &str) -> Option<i64> {
    v.get(key).and_then(|x| x.as_f64().map(|f| f as i64))
}

// ---------------- 工具分发 ----------------

fn dispatch_tool(conn: &Connection, data_dir: &Path, name: &str, args: &Value) -> Result<Value, String> {
    let notes = notes_dir(data_dir);
    match name {
        "list_graphs" => tool_list_graphs(conn),
        "get_graph" => tool_get_graph(conn, args),
        "create_graph" => tool_create_graph(conn, args),
        "rename_graph" => tool_rename_graph(conn, args),
        "delete_graph" => tool_delete_graph(conn, args),
        "list_nodes" => tool_list_nodes(conn, args),
        "get_node" => tool_get_node(conn, args),
        "create_node" => tool_create_node(conn, args),
        "update_node" => tool_update_node(conn, args),
        "delete_node" => tool_delete_node(conn, args),
        "toggle_node_completed" => tool_toggle_node_completed(conn, args),
        "toggle_node_followed" => tool_toggle_node_followed(conn, args),
        "add_edge" => tool_add_edge(conn, args),
        "remove_edge" => tool_remove_edge(conn, args),
        "list_notes" => tool_list_notes(conn),
        "read_note" => tool_read_note(conn, &notes, args),
        "create_note" => tool_create_note(conn, &notes, args),
        "update_note" => tool_update_note(conn, &notes, args),
        "delete_note" => tool_delete_note(conn, &notes, args),
        _ => Err(format!("未知工具: {}", name)),
    }
}

// ---------------- tools/list 定义（rmcp Tool，inputSchema 与历史版本逐字段一致） ----------------

/// 把手写的 JSON Schema（json! 对象）转成 rmcp 需要的 Arc<JsonObject>。
fn tool_def(name: &'static str, description: &'static str, schema: Value) -> Tool {
    let map = schema.as_object().cloned().unwrap_or_default();
    Tool::new(name, description, Arc::new(map))
}

fn tools_meta() -> Vec<Tool> {
    vec![
        tool_def(
            "list_graphs",
            "列出 Weavex 中的所有项目（任务图）概要，包含名称、创建/更新时间、根节点数等。",
            json!({ "type": "object", "properties": {} }),
        ),
        tool_def(
            "get_graph",
            "获取单个项目的完整结构：项目信息、节点列表（含父子关系与完成/关注状态）、根节点树、边（前置/后置依赖）。",
            json!({
                "type": "object",
                "properties": { "graphId": { "type": "string", "description": "项目 ID，来自 list_graphs" } },
                "required": ["graphId"]
            }),
        ),
        tool_def(
            "create_graph",
            "创建一个新的项目（任务图），并返回项目详情。",
            json!({
                "type": "object",
                "properties": { "name": { "type": "string", "description": "项目名称" } },
                "required": ["name"]
            }),
        ),
        tool_def(
            "rename_graph",
            "重命名一个项目（任务图）。",
            json!({
                "type": "object",
                "properties": {
                    "graphId": { "type": "string" },
                    "name": { "type": "string", "description": "新的项目名称" }
                },
                "required": ["graphId", "name"]
            }),
        ),
        tool_def(
            "delete_graph",
            "删除一个项目（任务图）及其全部节点与边。注意：该操作不可恢复，会连带删除所有任务数据。",
            json!({
                "type": "object",
                "properties": { "graphId": { "type": "string" } },
                "required": ["graphId"]
            }),
        ),
        tool_def(
            "list_nodes",
            "列出某个项目下的全部任务节点（扁平的完整列表），含完成、关注、归档、优先级等状态。",
            json!({
                "type": "object",
                "properties": { "graphId": { "type": "string" } },
                "required": ["graphId"]
            }),
        ),
        tool_def(
            "get_node",
            "获取单个任务节点的完整字段。",
            json!({
                "type": "object",
                "properties": {
                    "graphId": { "type": "string" },
                    "nodeId": { "type": "string" }
                },
                "required": ["graphId", "nodeId"]
            }),
        ),
        tool_def(
            "create_node",
            "在项目中创建一个任务节点。不传 parentId 时创建为根任务；传 parentId 时创建为其子任务。",
            json!({
                "type": "object",
                "properties": {
                    "graphId": { "type": "string" },
                    "name": { "type": "string", "description": "任务名称" },
                    "description": { "type": "string", "description": "任务描述" },
                    "record": { "type": "string", "description": "备注/记录文本" },
                    "parentId": { "type": "string", "description": "父任务节点 ID（可选，传则创建为子任务）" },
                    "startAt": { "type": "number", "description": "开始时间（毫秒时间戳，可选）" },
                    "endAt": { "type": "number", "description": "截止时间（毫秒时间戳，可选）" }
                },
                "required": ["graphId", "name"]
            }),
        ),
        tool_def(
            "update_node",
            "更新任务节点的字段（只更新传入的字段）：名称、描述、备注、开始/截止时间。",
            json!({
                "type": "object",
                "properties": {
                    "graphId": { "type": "string" },
                    "nodeId": { "type": "string" },
                    "name": { "type": "string" },
                    "description": { "type": "string" },
                    "record": { "type": "string" },
                    "startAt": { "type": "number" },
                    "endAt": { "type": "number" }
                },
                "required": ["graphId", "nodeId"]
            }),
        ),
        tool_def(
            "delete_node",
            "删除一个任务节点及其所有后代子节点（连带删除相关依赖边）。注意：不可恢复。",
            json!({
                "type": "object",
                "properties": {
                    "graphId": { "type": "string" },
                    "nodeId": { "type": "string" }
                },
                "required": ["graphId", "nodeId"]
            }),
        ),
        tool_def(
            "toggle_node_completed",
            "切换任务节点的完成状态（完成 ↔ 未完成）。",
            json!({
                "type": "object",
                "properties": {
                    "graphId": { "type": "string" },
                    "nodeId": { "type": "string" }
                },
                "required": ["graphId", "nodeId"]
            }),
        ),
        tool_def(
            "toggle_node_followed",
            "切换任务节点的关注状态（关注 ↔ 取消关注）。",
            json!({
                "type": "object",
                "properties": {
                    "graphId": { "type": "string" },
                    "nodeId": { "type": "string" }
                },
                "required": ["graphId", "nodeId"]
            }),
        ),
        tool_def(
            "add_edge",
            "在两个任务节点之间建立前置/依赖关系：sourceId 是 targetId 的前置节点（target 依赖 source 完成）。",
            json!({
                "type": "object",
                "properties": {
                    "graphId": { "type": "string" },
                    "sourceId": { "type": "string", "description": "前置节点 ID" },
                    "targetId": { "type": "string", "description": "后续节点 ID" }
                },
                "required": ["graphId", "sourceId", "targetId"]
            }),
        ),
        tool_def(
            "remove_edge",
            "删除两个任务节点之间的前置/依赖关系。",
            json!({
                "type": "object",
                "properties": {
                    "graphId": { "type": "string" },
                    "sourceId": { "type": "string" },
                    "targetId": { "type": "string" }
                },
                "required": ["graphId", "sourceId", "targetId"]
            }),
        ),
        tool_def(
            "list_notes",
            "列出 Weavex 中的所有笔记元信息（标题、创建/更新时间）。",
            json!({ "type": "object", "properties": {} }),
        ),
        tool_def(
            "read_note",
            "读取一篇笔记的正文内容（Markdown 文本）。",
            json!({
                "type": "object",
                "properties": { "noteId": { "type": "string", "description": "笔记 ID，来自 list_notes" } },
                "required": ["noteId"]
            }),
        ),
        tool_def(
            "create_note",
            "创建一篇新笔记。可传 content 直接写入正文（Markdown）。",
            json!({
                "type": "object",
                "properties": {
                    "title": { "type": "string", "description": "笔记标题" },
                    "content": { "type": "string", "description": "笔记正文（Markdown），可选" }
                },
                "required": ["title"]
            }),
        ),
        tool_def(
            "update_note",
            "更新一篇笔记的标题和/或正文。只更新传入的字段。",
            json!({
                "type": "object",
                "properties": {
                    "noteId": { "type": "string" },
                    "title": { "type": "string" },
                    "content": { "type": "string", "description": "新的正文（Markdown）" }
                },
                "required": ["noteId"]
            }),
        ),
        tool_def(
            "delete_note",
            "删除一篇笔记（连同其正文文件）。注意：不可恢复。",
            json!({
                "type": "object",
                "properties": { "noteId": { "type": "string" } },
                "required": ["noteId"]
            }),
        ),
    ]
}

// ---------------- MCP Resources（笔记暴露为 weavex://notes/{id}） ----------------

/// 全部笔记作为 Resource 列出（uri: weavex://notes/{noteId}，MIME: text/markdown）。
fn note_resources(conn: &Connection) -> Result<Vec<Resource>, String> {
    let mut stmt = conn
        .prepare("SELECT id, title FROM notes ORDER BY updated_at DESC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })
        .map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for r in rows {
        let (id, title) = r.map_err(|e| e.to_string())?;
        out.push(
            Resource::new(format!("weavex://notes/{}", id), title.clone())
                .with_title(title)
                .with_description("Weavex 笔记正文（Markdown）")
                .with_mime_type("text/markdown"),
        );
    }
    Ok(out)
}

/// 从 URI 解析笔记 ID；只接受 weavex://notes/{noteId} 形式。
fn note_id_from_uri(uri: &str) -> Option<String> {
    let id = uri.strip_prefix("weavex://notes/")?;
    if id.is_empty() || id.contains('/') {
        None
    } else {
        Some(id.to_string())
    }
}

// ---------------- ServerHandler（SDK 接管协议层） ----------------

struct WeavexServer {
    conn: Arc<Mutex<Connection>>,
    data_dir: PathBuf,
}

impl ServerHandler for WeavexServer {
    fn get_info(&self) -> ServerConfig {
        ServerConfig::new(
            ServerCapabilities::builder()
                .enable_tools()
                .enable_resources()
                .build(),
        )
        .with_server_info(Implementation::new(SERVER_NAME, SERVER_VERSION))
    }

    async fn list_tools(
        &self,
        _request: Option<PaginatedRequestParams>,
        _context: RequestContext<RoleServer>,
    ) -> Result<ListToolsResult, ErrorData> {
        Ok(ListToolsResult::with_all_items(tools_meta()))
    }

    async fn list_resources(
        &self,
        _request: Option<PaginatedRequestParams>,
        _context: RequestContext<RoleServer>,
    ) -> Result<ListResourcesResult, ErrorData> {
        let conn = self.conn.lock().unwrap_or_else(|e| e.into_inner());
        match note_resources(&conn) {
            Ok(items) => Ok(ListResourcesResult::with_all_items(items)),
            Err(msg) => Err(ErrorData::internal_error(msg, None)),
        }
    }

    async fn list_resource_templates(
        &self,
        _request: Option<PaginatedRequestParams>,
        _context: RequestContext<RoleServer>,
    ) -> Result<ListResourceTemplatesResult, ErrorData> {
        let template = ResourceTemplate::new("weavex://notes/{noteId}", "Weavex 笔记")
            .with_description("按笔记 ID 读取单篇笔记正文（Markdown）；noteId 来自 resources/list 或 list_notes。")
            .with_mime_type("text/markdown");
        Ok(ListResourceTemplatesResult::with_all_items(vec![template]))
    }

    async fn read_resource(
        &self,
        request: ReadResourceRequestParams,
        _context: RequestContext<RoleServer>,
    ) -> Result<ReadResourceResponse, ErrorData> {
        let uri = request.uri;
        let note_id = match note_id_from_uri(&uri) {
            Some(id) => id,
            None => {
                return Err(ErrorData::resource_not_found(
                    format!("未知资源: {}", uri),
                    None,
                ))
            }
        };
        let conn = self.conn.lock().unwrap_or_else(|e| e.into_inner());
        let notes = notes_dir(&self.data_dir);
        match load_note(&conn, &notes, &note_id) {
            Ok((_title, content)) => Ok(
                ReadResourceResult::new(vec![ResourceContents::text(content, uri)
                    .with_mime_type("text/markdown")])
                .into(),
            ),
            Err(msg) => Err(ErrorData::resource_not_found(msg, None)),
        }
    }

    async fn call_tool(
        &self,
        request: CallToolRequestParams,
        _context: RequestContext<RoleServer>,
    ) -> Result<CallToolResponse, ErrorData> {
        let name = request.name.to_string();
        let args = request
            .arguments
            .map(Value::Object)
            .unwrap_or_else(|| json!({}));
        // rusqlite::Connection 不是 Sync：用 Mutex 串行化本进程内的数据库访问。
        // stdio 模式同一时刻只有一个客户端，串行访问不会成为瓶颈；
        // 跨进程并发由 SQLite 的 busy_timeout 兜底（open_db 已设置）。
        let conn = self.conn.lock().unwrap_or_else(|e| e.into_inner());
        match dispatch_tool(&conn, &self.data_dir, &name, &args) {
            Ok(result) => {
                // 与历史版本 jsonText 一致：text 为 2 空格缩进的 JSON
                let text = serde_json::to_string_pretty(&result).unwrap_or_else(|_| "{}".into());
                Ok(CallToolResult::success(vec![ContentBlock::text(text)]).into())
            }
            // 工具运行失败（参数缺失、目标不存在等）：返回 isError 结果，调用方可读消息
            Err(msg) => Ok(CallToolResult::error(vec![ContentBlock::text(msg)]).into()),
        }
    }
}

// ---------------- stdio 入口（主程序 weavex.exe --mcp-stdio 调用） ----------------

pub fn stdio_main() {
    // 过滤掉本模式标志 --mcp-stdio，其余参数（--dev 等）继续生效
    let args: Vec<String> = env::args().filter(|a| a != "--mcp-stdio").collect();

    if args.iter().any(|a| a == "--http") || env::var("WEAVEX_MCP_HTTP").is_ok_and(|v| v == "1") {
        eprintln!("[weavex-mcp] HTTP 模式已弃用；请使用默认 stdio 模式（不传 --http）。");
        std::process::exit(1);
    }

    let data_dir = resolve_data_dir(&args);
    let db_path = data_dir.join("weavex.db");
    if !db_path.exists() {
        eprintln!(
            "未找到 Weavex 数据库: {}\n请先启动一次 Weavex 应用生成数据目录，或设置环境变量 WEAVEX_DATA_DIR 指向正确目录。",
            db_path.display()
        );
        std::process::exit(1);
    }

    let conn = match open_db(&db_path) {
        Ok(c) => c,
        Err(e) => {
            eprintln!("打开数据库失败: {}", e);
            std::process::exit(1);
        }
    };

    let server = WeavexServer {
        conn: Arc::new(Mutex::new(conn)),
        data_dir,
    };

    // rmcp 基于 tokio；为 MCP 模式单独启动运行时，不干扰主应用（GUI）路径
    let rt = match tokio::runtime::Runtime::new() {
        Ok(rt) => rt,
        Err(e) => {
            eprintln!("[weavex-mcp] 启动 tokio 运行时失败: {}", e);
            std::process::exit(1);
        }
    };
    rt.block_on(async {
        // stdio 传输：客户端断开（stdin EOF）时 SDK 结束服务循环
        match server.serve(stdio()).await {
            Ok(running) => {
                let _ = running.waiting().await;
            }
            Err(e) => {
                eprintln!("[weavex-mcp] MCP 服务启动失败: {}", e);
                std::process::exit(1);
            }
        }
    });
}
