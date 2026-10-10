// Weavex MCP Server —— Rust 实现
//
// 与 Node 版 mcp-server/server.mjs 行为对齐（19 个工具、数据目录解析、返回 JSON 结构），
// 但直接复用 weavx_lib::db 数据层函数（单一 SQL 实现），并编译为独立二进制：
//   目标机器无需安装 Node，随安装包分发 mcp-server.exe 即可。
//
// 协议：MCP over stdio（newline-delimited JSON-RPC 2.0）。
//   stdin 读请求，stdout 写响应（每行一条 JSON），日志一律走 stderr。
//
// 数据定位（优先级从高到低，与 Node 版一致）：
//   1. 环境变量 WEAVEX_DATA_DIR（显式指定）
//   2. %APPDATA%\padeyao4.weavex（--dev 或 WEAVEX_DEV=1 时为 dev.padeyao4.weavex，仅当存在 weavex.db）
//   3. 兜底兼容旧版：~\Documents\WeavexData

use std::env;
use std::fs;
use std::io::{BufRead, Write};
use std::path::{Path, PathBuf};

use rusqlite::{Connection, params};
use serde_json::{Value, json};
use weavx_lib::db::{
    add_edge, create_node, delete_graph, delete_node, delete_note, now_ms, open_db,
    remove_edge, update_node, upsert_graph_meta, upsert_note_meta,
    GraphMetaPatch, NodeDto, NodePatch, NoteMetaDto,
};

const SERVER_NAME: &str = "weavex";
const SERVER_VERSION: &str = "0.1.0";

// ---------------- 数据目录解析（与 Node 版一致） ----------------

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

// ---------------- 查询辅助（返回结构与 Node 版对齐） ----------------

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

// ---------------- normalizeNode（与 Node 版逐字段一致） ----------------

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

/// 组装带 children 的节点树（与前端口径一致：parent 指向父节点，无 parent 为根）。
/// edges 保持 Node 版返回结构（{source_id, target_id}）。
fn build_graph_detail(conn: &Connection, graph_id: &str) -> Result<Value, String> {
    let g = get_graph_row(conn, graph_id)?;
    let nodes = query_nodes(conn, graph_id)?;

    let by_id: std::collections::HashMap<String, &NodeRow> =
        nodes.iter().map(|n| (n.id.clone(), n)).collect();
    let mut children_of: std::collections::HashMap<String, Vec<String>> =
        std::collections::HashMap::new();
    for n in &nodes {
        if let Some(pid) = &n.parent_id {
            if by_id.contains_key(pid) {
                children_of.entry(pid.clone()).or_default().push(n.id.clone());
            }
        }
    }

    // 递归展开子树（等效于 Node 版 map 引用同一对象：每个节点带完整子树）
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
    let nodes_out: Vec<Value> = nodes.iter().map(|n| expand(&n.id, &by_id, &children_of)).collect();

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
    // 与 Node 版一致：不校验存在性，UPDATE 0 行也返回 ok
    conn.execute(
        "UPDATE graphs SET name = ?1, updated_at = ?2 WHERE id = ?3",
        params![name, now_ms(), graph_id],
    )
    .map_err(|e| format!("Failed to rename graph: {}", e))?;
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
        // 关注时置顶：priority = now；取消关注保留原 priority（与 Node 版一致）
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

fn tool_read_note(conn: &Connection, notes_dir: &Path, args: &Value) -> Result<Value, String> {
    let note_id = arg_str(args, "noteId")?;
    let (id, title, path, created_at, updated_at): (String, String, Option<String>, i64, i64) = conn
        .query_row(
            "SELECT id, title, path, created_at, updated_at FROM notes WHERE id = ?1",
            params![note_id],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?, r.get(4)?)),
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

// ---------------- tools/list schema（手写，与 Node zod 生成的 JSON Schema 对齐） ----------------

fn tools_list() -> Value {
    json!([
        {
            "name": "list_graphs",
            "description": "列出 Weavex 中的所有项目（任务图）概要，包含名称、创建/更新时间、根节点数等。",
            "inputSchema": { "type": "object", "properties": {} }
        },
        {
            "name": "get_graph",
            "description": "获取单个项目的完整结构：项目信息、节点列表（含父子关系与完成/关注状态）、根节点树、边（前置/后置依赖）。",
            "inputSchema": {
                "type": "object",
                "properties": { "graphId": { "type": "string", "description": "项目 ID，来自 list_graphs" } },
                "required": ["graphId"]
            }
        },
        {
            "name": "create_graph",
            "description": "创建一个新的项目（任务图），并返回项目详情。",
            "inputSchema": {
                "type": "object",
                "properties": { "name": { "type": "string", "description": "项目名称" } },
                "required": ["name"]
            }
        },
        {
            "name": "rename_graph",
            "description": "重命名一个项目（任务图）。",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "graphId": { "type": "string" },
                    "name": { "type": "string", "description": "新的项目名称" }
                },
                "required": ["graphId", "name"]
            }
        },
        {
            "name": "delete_graph",
            "description": "删除一个项目（任务图）及其全部节点与边。注意：该操作不可恢复，会连带删除所有任务数据。",
            "inputSchema": {
                "type": "object",
                "properties": { "graphId": { "type": "string" } },
                "required": ["graphId"]
            }
        },
        {
            "name": "list_nodes",
            "description": "列出某个项目下的全部任务节点（扁平的完整列表），含完成、关注、归档、优先级等状态。",
            "inputSchema": {
                "type": "object",
                "properties": { "graphId": { "type": "string" } },
                "required": ["graphId"]
            }
        },
        {
            "name": "get_node",
            "description": "获取单个任务节点的完整字段。",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "graphId": { "type": "string" },
                    "nodeId": { "type": "string" }
                },
                "required": ["graphId", "nodeId"]
            }
        },
        {
            "name": "create_node",
            "description": "在项目中创建一个任务节点。不传 parentId 时创建为根任务；传 parentId 时创建为其子任务。",
            "inputSchema": {
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
            }
        },
        {
            "name": "update_node",
            "description": "更新任务节点的字段（只更新传入的字段）：名称、描述、备注、开始/截止时间。",
            "inputSchema": {
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
            }
        },
        {
            "name": "delete_node",
            "description": "删除一个任务节点及其所有后代子节点（连带删除相关依赖边）。注意：不可恢复。",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "graphId": { "type": "string" },
                    "nodeId": { "type": "string" }
                },
                "required": ["graphId", "nodeId"]
            }
        },
        {
            "name": "toggle_node_completed",
            "description": "切换任务节点的完成状态（完成 ↔ 未完成）。",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "graphId": { "type": "string" },
                    "nodeId": { "type": "string" }
                },
                "required": ["graphId", "nodeId"]
            }
        },
        {
            "name": "toggle_node_followed",
            "description": "切换任务节点的关注状态（关注 ↔ 取消关注）。",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "graphId": { "type": "string" },
                    "nodeId": { "type": "string" }
                },
                "required": ["graphId", "nodeId"]
            }
        },
        {
            "name": "add_edge",
            "description": "在两个任务节点之间建立前置/依赖关系：sourceId 是 targetId 的前置节点（target 依赖 source 完成）。",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "graphId": { "type": "string" },
                    "sourceId": { "type": "string", "description": "前置节点 ID" },
                    "targetId": { "type": "string", "description": "后续节点 ID" }
                },
                "required": ["graphId", "sourceId", "targetId"]
            }
        },
        {
            "name": "remove_edge",
            "description": "删除两个任务节点之间的前置/依赖关系。",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "graphId": { "type": "string" },
                    "sourceId": { "type": "string" },
                    "targetId": { "type": "string" }
                },
                "required": ["graphId", "sourceId", "targetId"]
            }
        },
        {
            "name": "list_notes",
            "description": "列出 Weavex 中的所有笔记元信息（标题、创建/更新时间）。",
            "inputSchema": { "type": "object", "properties": {} }
        },
        {
            "name": "read_note",
            "description": "读取一篇笔记的正文内容（Markdown 文本）。",
            "inputSchema": {
                "type": "object",
                "properties": { "noteId": { "type": "string", "description": "笔记 ID，来自 list_notes" } },
                "required": ["noteId"]
            }
        },
        {
            "name": "create_note",
            "description": "创建一篇新笔记。可传 content 直接写入正文（Markdown）。",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "title": { "type": "string", "description": "笔记标题" },
                    "content": { "type": "string", "description": "笔记正文（Markdown），可选" }
                },
                "required": ["title"]
            }
        },
        {
            "name": "update_note",
            "description": "更新一篇笔记的标题和/或正文。只更新传入的字段。",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "noteId": { "type": "string" },
                    "title": { "type": "string" },
                    "content": { "type": "string", "description": "新的正文（Markdown）" }
                },
                "required": ["noteId"]
            }
        },
        {
            "name": "delete_note",
            "description": "删除一篇笔记（连同其正文文件）。注意：不可恢复。",
            "inputSchema": {
                "type": "object",
                "properties": { "noteId": { "type": "string" } },
                "required": ["noteId"]
            }
        }
    ])
}

// ---------------- tools/call 分发 ----------------

fn call_tool(conn: &Connection, data_dir: &Path, name: &str, args: &Value) -> Result<Value, String> {
    let notes = notes_dir(data_dir);
    let result = match name {
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
        _ => return Err(format!("未知工具: {}", name)),
    }?;
    // 与 Node 版 jsonText 一致：text 为 2 空格缩进的 JSON
    let text = serde_json::to_string_pretty(&result).unwrap_or_else(|_| "{}".into());
    Ok(json!({ "content": [{ "type": "text", "text": text }] }))
}

// ---------------- JSON-RPC 分发 ----------------

fn handle(conn: &Connection, data_dir: &Path, method: &str, params: &Value) -> Result<Value, String> {
    match method {
        "initialize" => {
            let protocol_version = params
                .get("protocolVersion")
                .and_then(|v| v.as_str())
                .unwrap_or("2024-11-05")
                .to_string();
            Ok(json!({
                "protocolVersion": protocol_version,
                "capabilities": { "tools": { "listChanged": false } },
                "serverInfo": { "name": SERVER_NAME, "version": SERVER_VERSION }
            }))
        }
        "ping" => Ok(json!({})),
        "notifications/initialized" => Ok(Value::Null),
        "tools/list" => Ok(json!({ "tools": tools_list() })),
        "tools/call" => {
            let name = params
                .get("name")
                .and_then(|n| n.as_str())
                .ok_or("tools/call 缺少 name")?;
            let args = params.get("arguments").cloned().unwrap_or_else(|| json!({}));
            call_tool(conn, data_dir, name, &args)
        }
        // 未实现的 MCP 能力：返回空（与 Node SDK 默认一致）
        "resources/list" => Ok(json!({ "resources": [] })),
        "prompts/list" => Ok(json!({ "prompts": [] })),
        "completion/complete" => Ok(json!({ "completion": { "values": [], "hasMore": false } })),
        _ => Err(format!("未知方法: {}", method)),
    }
}

// ---------------- main ----------------

fn main() {
    let args: Vec<String> = env::args().collect();

    if args.iter().any(|a| a == "--http") || env::var("WEAVEX_MCP_HTTP").is_ok_and(|v| v == "1") {
        eprintln!(
            "[weavex-mcp] HTTP 模式尚未在 Rust 版实现；请使用默认 stdio 模式（不传 --http），\
             或继续使用 Node 版 server.mjs --http。"
        );
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

    // stdio 主循环：每行一条 JSON-RPC 消息；客户端退出（stdin EOF）即进程结束
    let stdin = std::io::stdin();
    let stdout = std::io::stdout();
    let mut out = stdout.lock();
    for line in stdin.lock().lines() {
        let line = match line {
            Ok(l) => l,
            Err(_) => break,
        };
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }
        let msg: Value = match serde_json::from_str(trimmed) {
            Ok(v) => v,
            Err(e) => {
                eprintln!("[weavex-mcp] 无效 JSON 消息: {}", e);
                continue;
            }
        };
        let id = msg.get("id").cloned();
        let method = msg.get("method").and_then(|m| m.as_str()).unwrap_or("").to_string();
        let params = msg.get("params").cloned().unwrap_or_else(|| json!({}));
        let result = handle(&conn, &data_dir, &method, &params);
        if let Some(id) = id {
            let resp = match result {
                Ok(r) => json!({ "jsonrpc": "2.0", "id": id, "result": r }),
                Err(e) => json!({
                    "jsonrpc": "2.0",
                    "id": id,
                    "error": { "code": -32603, "message": e }
                }),
            };
            let s = serde_json::to_string(&resp).unwrap_or_default();
            let _ = writeln!(out, "{}", s);
            let _ = out.flush();
        }
        // notification（无 id）不响应；initialized 等已在上层处理
    }
}
