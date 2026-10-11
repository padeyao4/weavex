// SQLite 数据层：混合存储方案中的结构化数据部分。
// 图结构（graphs / nodes / edges）与笔记元数据（notes）落在 SQLite；
// 笔记正文仍为工作目录 notes/ 目录下的 Markdown 文件。
//
// 说明：Tauri 官方 plugin-sql 会把 sqlite 路径强制映射到应用配置目录，
// 无法做到“数据库跟随工作目录”，因此这里用 rusqlite 自实现数据层，
// 数据库文件 weavex.db 直接放在用户选择的工作目录中，可随 Git 同步。

use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::Path;
use std::sync::Mutex;

/// Tauri 托管的数据库连接（同一时间只连接一个工作目录）。
pub struct Db(pub Mutex<Option<Connection>>);

pub const DB_FILE: &str = "weavex.db";

// ---------------- DTO（前端传入 / 返回的载荷） ----------------

#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct GraphDto {
    pub id: String,
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub created_at: i64,
    #[serde(default)]
    pub updated_at: i64,
    #[serde(default)]
    pub root_node_ids: Vec<String>,
    #[serde(default)]
    pub show_archive: Option<bool>,
    #[serde(default)]
    pub priority: Option<f64>,
    #[serde(default)]
    pub viewport: Option<String>,
    #[serde(default)]
    pub nodes: Vec<NodeDto>,
    #[serde(default)]
    pub edges: Vec<EdgeDto>,
}

#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct NodeDto {
    pub id: String,
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub record: String,
    #[serde(default)]
    pub created_at: i64,
    #[serde(default)]
    pub updated_at: i64,
    #[serde(default)]
    pub start_at: i64,
    #[serde(default)]
    pub end_at: i64,
    #[serde(default)]
    pub parent: Option<String>,
    #[serde(default)]
    pub completed_at: i64,
    #[serde(default)]
    pub completed: bool,
    #[serde(default)]
    pub expanded: Option<bool>,
    #[serde(default)]
    pub priority: Option<f64>,
    #[serde(default)]
    pub is_followed: Option<bool>,
    #[serde(default)]
    pub is_archive: Option<bool>,
}

#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct EdgeDto {
    pub source: String,
    pub target: String,
}

#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct NoteMetaDto {
    pub id: String,
    #[serde(default)]
    pub title: String,
    #[serde(default)]
    pub path: Option<String>,
    #[serde(default)]
    pub created_at: i64,
    #[serde(default)]
    pub updated_at: i64,
}

/// 图级元数据部分更新（filesystem-first 细粒度写：只更新传入的字段）。
/// 图不存在且带 name 时按新建处理（INSERT），否则动态 UPDATE。
#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct GraphMetaPatch {
    pub id: String,
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub priority: Option<f64>,
    #[serde(default)]
    pub show_archive: Option<bool>,
    #[serde(default)]
    pub viewport: Option<String>,
    #[serde(default)]
    pub root_node_ids: Option<Vec<String>>,
    #[serde(default)]
    pub updated_at: Option<i64>,
}

/// 节点部分更新（filesystem-first 细粒度写）。
/// parent 用 Option<Option<String>> 区分三种语义：
///   None          = 不更新 parent
///   Some(None)    = 置空 parent（节点脱离父级成为根）
///   Some(Some(p)) = 设为 p
#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct NodePatch {
    pub id: String,
    pub graph_id: String,
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub record: Option<String>,
    #[serde(default)]
    pub start_at: Option<i64>,
    #[serde(default)]
    pub end_at: Option<i64>,
    #[serde(default)]
    pub parent: Option<Option<String>>,
    #[serde(default)]
    pub completed_at: Option<i64>,
    #[serde(default)]
    pub completed: Option<bool>,
    #[serde(default)]
    pub expanded: Option<bool>,
    #[serde(default)]
    pub priority: Option<f64>,
    #[serde(default)]
    pub is_followed: Option<bool>,
    #[serde(default)]
    pub is_archive: Option<bool>,
    #[serde(default)]
    pub updated_at: Option<i64>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MigrateResult {
    pub graphs: i64,
    pub notes: i64,
}

// ---------------- 旧版 JSON 结构（迁移用） ----------------

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct LegacyGraph {
    id: String,
    #[serde(default)]
    name: String,
    #[serde(default)]
    created_at: i64,
    #[serde(default)]
    updated_at: i64,
    #[serde(default)]
    root_node_ids: Vec<String>,
    #[serde(default)]
    show_archive: Option<bool>,
    #[serde(default)]
    priority: Option<f64>,
    #[serde(default)]
    nodes: HashMap<String, LegacyNode>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct LegacyNode {
    id: String,
    #[serde(default)]
    name: String,
    #[serde(default)]
    description: String,
    #[serde(default)]
    record: String,
    #[serde(default)]
    created_at: i64,
    #[serde(default)]
    updated_at: i64,
    #[serde(default)]
    start_at: i64,
    #[serde(default)]
    end_at: i64,
    #[serde(default)]
    parent: Option<String>,
    #[serde(default)]
    completed_at: i64,
    #[serde(default)]
    completed: bool,
    #[serde(default)]
    expanded: Option<bool>,
    #[serde(default)]
    priority: Option<f64>,
    #[serde(default)]
    is_followed: Option<bool>,
    #[serde(default)]
    is_archive: Option<bool>,
    #[serde(default)]
    nexts: Vec<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct LegacyNoteMeta {
    #[serde(default)]
    id: String,
    #[serde(default)]
    title: String,
    #[serde(default)]
    path: Option<String>,
    #[serde(default)]
    created_at: i64,
    #[serde(default)]
    updated_at: i64,
}

// ---------------- 连接与建表 ----------------

/// 当前毫秒时间戳（与前端/MCP 的 Date.now() 口径一致）
pub fn now_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

/// 打开（不存在则创建）工作目录下的 weavex.db，并确保表结构存在。
pub fn open_db(path: &Path) -> Result<Connection, String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create dir: {}", e))?;
    }
    let conn = Connection::open(path)
        .map_err(|e| format!("Failed to open database {}: {}", path.display(), e))?;
    // 多写者（应用 UI + MCP 独立进程）直写同一库：等待而非立刻报 SQLITE_BUSY
    conn.busy_timeout(std::time::Duration::from_millis(5000))
        .map_err(|e| format!("Failed to set busy_timeout: {}", e))?;
    // WAL 模式：多进程并发下读不阻塞写、写不互斥读，长事务期间 UI 不再卡顿。
    // journal_mode 是数据库持久属性，重复设置幂等；WAL 的 -wal/-shm 文件事件
    // 由 watcher 的 150ms 防抖合并（见 watcher.rs DEBOUNCE_MS 注释）。
    conn.execute_batch("PRAGMA journal_mode = WAL;")
        .map_err(|e| format!("Failed to enable WAL: {}", e))?;
    create_schema(&conn)?;
    Ok(conn)
}

pub fn create_schema(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS graphs (
           id TEXT PRIMARY KEY,
           name TEXT NOT NULL DEFAULT '',
           created_at INTEGER NOT NULL DEFAULT 0,
           updated_at INTEGER NOT NULL DEFAULT 0,
           root_node_ids TEXT NOT NULL DEFAULT '[]',
           show_archive INTEGER,
           priority REAL
         );
         CREATE TABLE IF NOT EXISTS nodes (
           id TEXT PRIMARY KEY,
           graph_id TEXT NOT NULL,
           name TEXT NOT NULL DEFAULT '',
           description TEXT NOT NULL DEFAULT '',
           record TEXT NOT NULL DEFAULT '',
           created_at INTEGER NOT NULL DEFAULT 0,
           updated_at INTEGER NOT NULL DEFAULT 0,
           start_at INTEGER NOT NULL DEFAULT 0,
           end_at INTEGER NOT NULL DEFAULT 0,
           parent_id TEXT,
           completed_at INTEGER NOT NULL DEFAULT 0,
           completed INTEGER NOT NULL DEFAULT 0,
           expanded INTEGER,
           priority REAL,
           is_followed INTEGER,
           is_archive INTEGER
         );
         CREATE INDEX IF NOT EXISTS idx_nodes_graph ON nodes(graph_id);
         CREATE TABLE IF NOT EXISTS edges (
           graph_id TEXT NOT NULL,
           source_id TEXT NOT NULL,
           target_id TEXT NOT NULL,
           PRIMARY KEY (graph_id, source_id, target_id)
         );
         CREATE INDEX IF NOT EXISTS idx_edges_target ON edges(graph_id, target_id);
         CREATE TABLE IF NOT EXISTS notes (
           id TEXT PRIMARY KEY,
           title TEXT NOT NULL DEFAULT '',
           path TEXT,
           created_at INTEGER NOT NULL DEFAULT 0,
           updated_at INTEGER NOT NULL DEFAULT 0
         );",
    )
    .map_err(|e| format!("Failed to create schema: {}", e))?;

    // 迁移：旧库 graphs 表无 viewport 列时补列（幂等）
    let has_viewport = conn
        .prepare("PRAGMA table_info(graphs)")
        .map_err(|e| e.to_string())?
        .query_map([], |row| row.get::<_, String>(1))
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .any(|name| name == "viewport");
    if !has_viewport {
        conn.execute("ALTER TABLE graphs ADD COLUMN viewport TEXT", [])
            .map_err(|e| format!("Failed to add viewport column: {}", e))?;
    }
    Ok(())
}

// ---------------- 图数据读写 ----------------

/// 保存一张图：事务内整体替换该图的数据（图规模小，简单且原子）。
pub fn save_graph(conn: &mut Connection, dto: &GraphDto) -> Result<(), String> {
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    let root_json = serde_json::to_string(&dto.root_node_ids).unwrap_or_else(|_| "[]".into());

    tx.execute(
        "INSERT INTO graphs (id, name, created_at, updated_at, root_node_ids, show_archive, priority, viewport)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           created_at = excluded.created_at,
           updated_at = excluded.updated_at,
           root_node_ids = excluded.root_node_ids,
           show_archive = excluded.show_archive,
           priority = excluded.priority,
           viewport = excluded.viewport",
        params![
            dto.id,
            dto.name,
            dto.created_at,
            dto.updated_at,
            root_json,
            dto.show_archive,
            dto.priority,
            dto.viewport
        ],
    )
    .map_err(|e| format!("Failed to upsert graph {}: {}", dto.id, e))?;

    tx.execute("DELETE FROM nodes WHERE graph_id = ?1", params![dto.id])
        .map_err(|e| format!("Failed to clear nodes: {}", e))?;
    tx.execute("DELETE FROM edges WHERE graph_id = ?1", params![dto.id])
        .map_err(|e| format!("Failed to clear edges: {}", e))?;

    {
        let mut stmt = tx
            .prepare(
                "INSERT INTO nodes
                   (id, graph_id, name, description, record, created_at, updated_at,
                    start_at, end_at, parent_id, completed_at, completed, expanded,
                    priority, is_followed, is_archive)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)",
            )
            .map_err(|e| e.to_string())?;
        for n in &dto.nodes {
            stmt.execute(params![
                n.id,
                dto.id,
                n.name,
                n.description,
                n.record,
                n.created_at,
                n.updated_at,
                n.start_at,
                n.end_at,
                n.parent,
                n.completed_at,
                n.completed,
                n.expanded,
                n.priority,
                n.is_followed,
                n.is_archive
            ])
            .map_err(|e| format!("Failed to insert node {}: {}", n.id, e))?;
        }
    }

    {
        let mut stmt = tx
            .prepare(
                "INSERT OR IGNORE INTO edges (graph_id, source_id, target_id) VALUES (?1, ?2, ?3)",
            )
            .map_err(|e| e.to_string())?;
        let node_ids: HashSet<&String> = dto.nodes.iter().map(|n| &n.id).collect();
        let mut seen: HashSet<(&String, &String)> = HashSet::new();
        for e in &dto.edges {
            if !node_ids.contains(&e.source) || !node_ids.contains(&e.target) {
                continue;
            }
            if !seen.insert((&e.source, &e.target)) {
                continue;
            }
            stmt.execute(params![dto.id, e.source, e.target])
                .map_err(|err| {
                    format!("Failed to insert edge {}-{}: {}", e.source, e.target, err)
                })?;
        }
    }

    tx.commit()
        .map_err(|e| format!("Failed to commit graph {}: {}", dto.id, e))
}

/// 读取全部图数据，返回 GraphDto 数组的 JSON 字符串。
pub fn load_graphs(conn: &Connection) -> Result<String, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, name, created_at, updated_at, root_node_ids, show_archive, priority, viewport
             FROM graphs ORDER BY priority DESC",
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
                row.get::<_, Option<bool>>(5)?,
                row.get::<_, Option<f64>>(6)?,
                row.get::<_, Option<String>>(7)?,
            ))
        })
        .map_err(|e| e.to_string())?;

    let mut graphs: Vec<GraphDto> = Vec::new();
    for row in rows {
        let (id, name, created_at, updated_at, root_json, show_archive, priority, viewport) =
            row.map_err(|e| e.to_string())?;
        let root_node_ids: Vec<String> = serde_json::from_str(&root_json).unwrap_or_default();

        let mut nodes: Vec<NodeDto> = Vec::new();
        {
            let mut nstmt = conn
                .prepare(
                    "SELECT id, name, description, record, created_at, updated_at,
                            start_at, end_at, parent_id, completed_at, completed,
                            expanded, priority, is_followed, is_archive
                     FROM nodes WHERE graph_id = ?1 ORDER BY created_at",
                )
                .map_err(|e| e.to_string())?;
            let nrows = nstmt
                .query_map(params![id], |row| {
                    Ok(NodeDto {
                        id: row.get(0)?,
                        name: row.get(1)?,
                        description: row.get(2)?,
                        record: row.get(3)?,
                        created_at: row.get(4)?,
                        updated_at: row.get(5)?,
                        start_at: row.get(6)?,
                        end_at: row.get(7)?,
                        parent: row.get(8)?,
                        completed_at: row.get(9)?,
                        completed: row.get::<_, i64>(10)? != 0,
                        expanded: row.get(11)?,
                        priority: row.get(12)?,
                        is_followed: row.get(13)?,
                        is_archive: row.get(14)?,
                    })
                })
                .map_err(|e| e.to_string())?;
            for n in nrows {
                nodes.push(n.map_err(|e| e.to_string())?);
            }
        }

        let mut edges: Vec<EdgeDto> = Vec::new();
        {
            let mut estmt = conn
                .prepare(
                    "SELECT source_id, target_id FROM edges
                     WHERE graph_id = ?1 ORDER BY source_id, target_id",
                )
                .map_err(|e| e.to_string())?;
            let erows = estmt
                .query_map(params![id], |row| {
                    Ok(EdgeDto {
                        source: row.get(0)?,
                        target: row.get(1)?,
                    })
                })
                .map_err(|e| e.to_string())?;
            for e in erows {
                edges.push(e.map_err(|e| e.to_string())?);
            }
        }

        graphs.push(GraphDto {
            id,
            name,
            created_at,
            updated_at,
            root_node_ids,
            show_archive,
            priority,
            viewport,
            nodes,
            edges,
        });
    }

    serde_json::to_string(&graphs).map_err(|e| e.to_string())
}

pub fn delete_graph(conn: &Connection, id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM nodes WHERE graph_id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM edges WHERE graph_id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM graphs WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

// ---------------- 细粒度图/节点/边操作（filesystem-first） ----------------
// 与 mcp-server/server.mjs 的 SQL 口径保持一致：节点字段映射、root_node_ids 维护、
// 删除节点时递归子树 + 连带边 + 根列表清理。每条命令单条事务，避免“全量写回”覆盖外部写入。

/// 递归收集 graph_id 下 node_id 的全部后代 id（含自身），与 MCP collectSubtreeIds 一致。
fn collect_subtree_ids(conn: &Connection, graph_id: &str, node_id: &str) -> Result<Vec<String>, String> {
    let mut ids: HashSet<String> = HashSet::from([node_id.to_string()]);
    let mut queue: Vec<String> = vec![node_id.to_string()];
    let mut stmt = conn
        .prepare("SELECT id FROM nodes WHERE graph_id = ?1 AND parent_id = ?2")
        .map_err(|e| e.to_string())?;
    while let Some(cur) = queue.pop() {
        let rows = stmt
            .query_map(params![graph_id, cur], |row| row.get::<_, String>(0))
            .map_err(|e| e.to_string())?;
        for r in rows {
            let child = r.map_err(|e| e.to_string())?;
            if ids.insert(child.clone()) {
                queue.push(child);
            }
        }
    }
    Ok(ids.into_iter().collect())
}

fn get_graph_row(conn: &Connection, graph_id: &str) -> Result<(String, String), String> {
    conn.query_row(
        "SELECT id, root_node_ids FROM graphs WHERE id = ?1",
        params![graph_id],
        |row| Ok((row.get(0)?, row.get(1)?)),
    )
    .map_err(|e| format!("项目不存在: {} ({})", graph_id, e))
}

fn parse_root_ids(json: &str) -> Vec<String> {
    serde_json::from_str(json).unwrap_or_default()
}

fn set_root_ids(conn: &Connection, graph_id: &str, ids: &[String], updated_at: i64) -> Result<(), String> {
    let json = serde_json::to_string(ids).unwrap_or_else(|_| "[]".into());
    conn.execute(
        "UPDATE graphs SET root_node_ids = ?1, updated_at = ?2 WHERE id = ?3",
        params![json, updated_at, graph_id],
    )
    .map_err(|e| format!("Failed to update root_node_ids: {}", e))?;
    Ok(())
}

/// 图级元数据部分更新：只更新传入字段；图不存在且带 name 时按新建处理。
pub fn upsert_graph_meta(conn: &Connection, patch: &GraphMetaPatch) -> Result<(), String> {
    let mut fields: Vec<(String, Box<dyn rusqlite::types::ToSql>)> = Vec::new();

    if let Some(name) = &patch.name {
        fields.push(("name".into(), Box::new(name.clone())));
    }
    if let Some(p) = patch.priority {
        fields.push(("priority".into(), Box::new(p)));
    }
    if let Some(sa) = patch.show_archive {
        fields.push(("show_archive".into(), Box::new(sa)));
    }
    if let Some(vp) = &patch.viewport {
        fields.push(("viewport".into(), Box::new(vp.clone())));
    }
    if let Some(roots) = &patch.root_node_ids {
        let json = serde_json::to_string(roots).unwrap_or_else(|_| "[]".into());
        fields.push(("root_node_ids".into(), Box::new(json)));
    }
    let now = now_ms();
    fields.push(("updated_at".into(), Box::new(patch.updated_at.unwrap_or(now))));

    let sets: Vec<String> = fields
        .iter()
        .enumerate()
        .map(|(i, (col, _))| format!("{} = ?{}", col, i + 1))
        .collect();
    let sql = format!(
        "UPDATE graphs SET {} WHERE id = ?{}",
        sets.join(", "),
        fields.len() + 1
    );

    let mut params: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();
    for (_, v) in fields.drain(..) {
        params.push(v);
    }
    params.push(Box::new(patch.id.clone()));

    let mut stmt = conn.prepare_cached(&sql).map_err(|e| e.to_string())?;
    let updated = stmt
        .execute(rusqlite::params_from_iter(
            params.iter().map(|v| v as &dyn rusqlite::types::ToSql),
        ))
        .map_err(|e| format!("Failed to upsert graph meta {}: {}", patch.id, e))?;
    drop(stmt);

    if updated == 0 {
        // 图不存在：作为新建处理（仅当提供了 name 才插入；否则报错）
        let name = patch
            .name
            .clone()
            .ok_or_else(|| format!("项目不存在: {}", patch.id))?;
        let t = now;
        let roots = patch.root_node_ids.clone().unwrap_or_default();
        let root_json = serde_json::to_string(&roots).unwrap_or_else(|_| "[]".into());
        conn.execute(
            "INSERT INTO graphs (id, name, created_at, updated_at, root_node_ids, show_archive, priority, viewport)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                patch.id,
                name,
                patch.updated_at.unwrap_or(t),
                t,
                root_json,
                patch.show_archive,
                patch.priority,
                patch.viewport
            ],
        )
        .map_err(|e| format!("Failed to insert graph {}: {}", patch.id, e))?;
    }
    Ok(())
}

/// 创建节点：插入全字段；parent 为空时把节点追加进 root_node_ids（与 MCP create_node 一致）。
pub fn create_node(conn: &Connection, graph_id: &str, dto: &NodeDto) -> Result<(), String> {
    get_graph_row(conn, graph_id)?;
    let t = dto.created_at.max(dto.updated_at).max(now_ms());
    conn.execute(
        "INSERT INTO nodes
           (id, graph_id, name, description, record, created_at, updated_at,
            start_at, end_at, parent_id, completed_at, completed, expanded,
            priority, is_followed, is_archive)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)",
        params![
            dto.id,
            graph_id,
            dto.name,
            dto.description,
            dto.record,
            t,
            t,
            dto.start_at,
            dto.end_at,
            dto.parent,
            dto.completed_at,
            dto.completed,
            dto.expanded,
            dto.priority,
            dto.is_followed,
            dto.is_archive
        ],
    )
    .map_err(|e| format!("Failed to create node {}: {}", dto.id, e))?;

    if dto.parent.is_none() {
        let (_, root_json) = get_graph_row(conn, graph_id)?;
        let mut roots = parse_root_ids(&root_json);
        if !roots.contains(&dto.id) {
            roots.push(dto.id.clone());
        }
        set_root_ids(conn, graph_id, &roots, t)?;
    }
    Ok(())
}

/// 更新节点：只更新传入字段；parent 变化时联动 root_node_ids（脱离父级变根/挂到父级移出根列表）。
pub fn update_node(conn: &Connection, patch: &NodePatch) -> Result<(), String> {
    let exists = conn
        .query_row(
            "SELECT parent_id FROM nodes WHERE graph_id = ?1 AND id = ?2",
            params![patch.graph_id, patch.id],
            |row| row.get::<_, Option<String>>(0),
        )
        .map_err(|e| format!("节点不存在: {} ({})", patch.id, e))?;

    let mut fields: Vec<(String, Box<dyn rusqlite::types::ToSql>)> = Vec::new();

    if let Some(name) = &patch.name {
        fields.push(("name".into(), Box::new(name.clone())));
    }
    if let Some(d) = &patch.description {
        fields.push(("description".into(), Box::new(d.clone())));
    }
    if let Some(r) = &patch.record {
        fields.push(("record".into(), Box::new(r.clone())));
    }
    if let Some(s) = patch.start_at {
        fields.push(("start_at".into(), Box::new(s)));
    }
    if let Some(e) = patch.end_at {
        fields.push(("end_at".into(), Box::new(e)));
    }
    if let Some(p) = patch.parent.clone() {
        fields.push(("parent_id".into(), Box::new(p)));
    }
    if let Some(c) = patch.completed_at {
        fields.push(("completed_at".into(), Box::new(c)));
    }
    if let Some(c) = patch.completed {
        fields.push(("completed".into(), Box::new(c)));
    }
    if let Some(e) = patch.expanded {
        fields.push(("expanded".into(), Box::new(e)));
    }
    if let Some(p) = patch.priority {
        fields.push(("priority".into(), Box::new(p)));
    }
    if let Some(f) = patch.is_followed {
        fields.push(("is_followed".into(), Box::new(f)));
    }
    if let Some(a) = patch.is_archive {
        fields.push(("is_archive".into(), Box::new(a)));
    }
    let t = patch.updated_at.unwrap_or_else(now_ms);
    fields.push(("updated_at".into(), Box::new(t)));

    let sets: Vec<String> = fields
        .iter()
        .enumerate()
        .map(|(i, (col, _))| format!("{} = ?{}", col, i + 1))
        .collect();
    let sql = format!(
        "UPDATE nodes SET {} WHERE graph_id = ?{} AND id = ?{}",
        sets.join(", "),
        fields.len() + 1,
        fields.len() + 2
    );

    let mut params: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();
    for (_, v) in fields.drain(..) {
        params.push(v);
    }
    params.push(Box::new(patch.graph_id.clone()));
    params.push(Box::new(patch.id.clone()));

    let mut stmt = conn.prepare_cached(&sql).map_err(|e| e.to_string())?;
    stmt.execute(rusqlite::params_from_iter(
        params.iter().map(|v| v as &dyn rusqlite::types::ToSql),
    ))
    .map_err(|e| format!("Failed to update node {}: {}", patch.id, e))?;
    drop(stmt);

    // parent 变更 → root_node_ids 联动
    if let Some(new_parent) = patch.parent.clone() {
        let (_, root_json) = get_graph_row(conn, &patch.graph_id)?;
        let mut roots = parse_root_ids(&root_json);
        let was_root = exists.is_none();
        match new_parent {
            Some(_) => {
                if was_root {
                    roots.retain(|id| id != &patch.id);
                }
            }
            None => {
                if !was_root && !roots.contains(&patch.id) {
                    roots.push(patch.id.clone());
                }
            }
        }
        set_root_ids(conn, &patch.graph_id, &roots, t)?;
    }
    Ok(())
}

/// 删除节点：递归删除子树 + 连带边 + 从 root_node_ids 清理（与 MCP delete_node 一致）。返回删除的节点数。
pub fn delete_node(conn: &Connection, graph_id: &str, node_id: &str) -> Result<i64, String> {
    let ids = collect_subtree_ids(conn, graph_id, node_id)?;
    let count = ids.len() as i64;
    let placeholders: Vec<&str> = ids.iter().map(|_| "?").collect();
    let ph = placeholders.join(",");

    let mut edge_params: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();
    edge_params.push(Box::new(graph_id.to_string()));
    for id in &ids { edge_params.push(Box::new(id.clone())); }
    for id in &ids { edge_params.push(Box::new(id.clone())); }
    let mut estmt = conn
        .prepare(&format!(
            "DELETE FROM edges WHERE graph_id = ?1 AND (source_id IN ({}) OR target_id IN ({}))",
            ph, ph
        ))
        .map_err(|e| e.to_string())?;
    estmt.execute(rusqlite::params_from_iter(edge_params.iter().map(|v| v as &dyn rusqlite::types::ToSql)))
        .map_err(|e| format!("Failed to delete edges: {}", e))?;
    drop(estmt);

    let mut node_params: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();
    node_params.push(Box::new(graph_id.to_string()));
    for id in &ids { node_params.push(Box::new(id.clone())); }
    let mut nstmt = conn
        .prepare(&format!("DELETE FROM nodes WHERE graph_id = ?1 AND id IN ({})", ph))
        .map_err(|e| e.to_string())?;
    nstmt.execute(rusqlite::params_from_iter(node_params.iter().map(|v| v as &dyn rusqlite::types::ToSql)))
        .map_err(|e| format!("Failed to delete nodes: {}", e))?;
    drop(nstmt);

    let (_, root_json) = get_graph_row(conn, graph_id)?;
    let roots = parse_root_ids(&root_json);
    let new_roots: Vec<String> = roots.into_iter().filter(|id| !ids.contains(id)).collect();
    set_root_ids(conn, graph_id, &new_roots, now_ms())?;

    Ok(count)
}

/// 建立前置/依赖关系（target 依赖 source 完成）。幂等（INSERT OR IGNORE）。
pub fn add_edge(conn: &Connection, graph_id: &str, source_id: &str, target_id: &str) -> Result<(), String> {
    conn.execute(
        "INSERT OR IGNORE INTO edges (graph_id, source_id, target_id) VALUES (?1, ?2, ?3)",
        params![graph_id, source_id, target_id],
    )
    .map_err(|e| format!("Failed to add edge {}-{}: {}", source_id, target_id, e))?;
    Ok(())
}

/// 删除前置/依赖关系。
pub fn remove_edge(conn: &Connection, graph_id: &str, source_id: &str, target_id: &str) -> Result<(), String> {
    conn.execute(
        "DELETE FROM edges WHERE graph_id = ?1 AND source_id = ?2 AND target_id = ?3",
        params![graph_id, source_id, target_id],
    )
    .map_err(|e| format!("Failed to remove edge {}-{}: {}", source_id, target_id, e))?;
    Ok(())
}

/// 删除笔记：删除 notes 行并连带删除正文文件（notes_dir 为数据目录下的 notes/ 目录）。
pub fn delete_note(conn: &Connection, note_id: &str, notes_dir: &Path) -> Result<(), String> {
    let row: Option<String> = conn
        .query_row("SELECT path FROM notes WHERE id = ?1", params![note_id], |r| r.get(0))
        .map_err(|e| format!("笔记不存在: {} ({})", note_id, e))?;
    conn.execute("DELETE FROM notes WHERE id = ?1", params![note_id])
        .map_err(|e| format!("Failed to delete note {}: {}", note_id, e))?;
    if let Some(path) = row {
        if !path.is_empty() {
            let file = notes_dir.join(&path);
            if file.exists() {
                fs::remove_file(&file).map_err(|e| format!("Failed to delete note file {}: {}", file.display(), e))?;
            }
        }
    }
    Ok(())
}

// ---------------- 笔记元数据 ----------------

pub fn load_note_metas(conn: &Connection) -> Result<String, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, title, path, created_at, updated_at FROM notes ORDER BY updated_at DESC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(NoteMetaDto {
                id: row.get(0)?,
                title: row.get(1)?,
                path: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;
    let mut metas = Vec::new();
    for r in rows {
        metas.push(r.map_err(|e| e.to_string())?);
    }
    serde_json::to_string(&metas).map_err(|e| e.to_string())
}

pub fn upsert_note_meta(conn: &Connection, dto: &NoteMetaDto) -> Result<(), String> {
    conn.execute(
        "INSERT INTO notes (id, title, path, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5)
         ON CONFLICT(id) DO UPDATE SET
           title = excluded.title,
           path = excluded.path,
           created_at = excluded.created_at,
           updated_at = excluded.updated_at",
        params![dto.id, dto.title, dto.path, dto.created_at, dto.updated_at],
    )
    .map_err(|e| format!("Failed to upsert note {}: {}", dto.id, e))?;
    Ok(())
}

// ---------------- 旧数据迁移 ----------------

fn legacy_to_dto(g: LegacyGraph) -> GraphDto {
    let nodes: Vec<NodeDto> = g
        .nodes
        .values()
        .map(|n| NodeDto {
            id: n.id.clone(),
            name: n.name.clone(),
            description: n.description.clone(),
            record: n.record.clone(),
            created_at: n.created_at,
            updated_at: n.updated_at,
            start_at: n.start_at,
            end_at: n.end_at,
            parent: n.parent.clone(),
            completed_at: n.completed_at,
            completed: n.completed,
            expanded: n.expanded,
            priority: n.priority,
            is_followed: n.is_followed,
            is_archive: n.is_archive,
        })
        .collect();

    let mut edges: Vec<EdgeDto> = Vec::new();
    let mut seen: HashSet<(String, String)> = HashSet::new();
    for n in g.nodes.values() {
        for next in &n.nexts {
            if !g.nodes.contains_key(next) {
                continue;
            }
            if seen.insert((n.id.clone(), next.clone())) {
                edges.push(EdgeDto {
                    source: n.id.clone(),
                    target: next.clone(),
                });
            }
        }
    }

    GraphDto {
        id: g.id,
        name: g.name,
        created_at: g.created_at,
        updated_at: g.updated_at,
        root_node_ids: g.root_node_ids,
        show_archive: g.show_archive,
        priority: g.priority,
        viewport: None,
        nodes,
        edges,
    }
}

/// 将工作目录下的旧版 graphs.json / note-meta.json 迁移进 SQLite，
/// 成功后把旧文件重命名为 *.bak（保证只迁移一次；可安全重入）。
pub fn migrate_legacy(conn: &mut Connection, work_dir: &str) -> Result<MigrateResult, String> {
    let mut graphs_migrated: i64 = 0;

    let graphs_path = Path::new(work_dir).join("graphs.json");
    let graphs_bak = Path::new(work_dir).join("graphs.json.bak");
    if graphs_path.exists() && !graphs_bak.exists() {
        let text = fs::read_to_string(&graphs_path)
            .map_err(|e| format!("Failed to read graphs.json: {}", e))?;
        if !text.trim().is_empty() {
            let map: HashMap<String, LegacyGraph> = serde_json::from_str(&text)
                .map_err(|e| format!("Failed to parse graphs.json: {}", e))?;
            for (key, mut g) in map {
                if g.id.is_empty() {
                    g.id = key;
                }
                let dto = legacy_to_dto(g);
                save_graph(conn, &dto)?;
                graphs_migrated += 1;
            }
        }
        fs::rename(&graphs_path, &graphs_bak)
            .map_err(|e| format!("Failed to rename graphs.json: {}", e))?;
    }

    let mut notes_migrated: i64 = 0;
    let notes_path = Path::new(work_dir).join("note-meta.json");
    let notes_bak = Path::new(work_dir).join("note-meta.json.bak");
    if notes_path.exists() && !notes_bak.exists() {
        let text = fs::read_to_string(&notes_path)
            .map_err(|e| format!("Failed to read note-meta.json: {}", e))?;
        if !text.trim().is_empty() {
            let map: HashMap<String, LegacyNoteMeta> = serde_json::from_str(&text)
                .map_err(|e| format!("Failed to parse note-meta.json: {}", e))?;
            for (key, mut m) in map {
                if m.id.is_empty() {
                    m.id = key;
                }
                upsert_note_meta(
                    conn,
                    &NoteMetaDto {
                        id: m.id,
                        title: m.title,
                        path: m.path,
                        created_at: m.created_at,
                        updated_at: m.updated_at,
                    },
                )?;
                notes_migrated += 1;
            }
        }
        fs::rename(&notes_path, &notes_bak)
            .map_err(|e| format!("Failed to rename note-meta.json: {}", e))?;
    }

    Ok(MigrateResult {
        graphs: graphs_migrated,
        notes: notes_migrated,
    })
}

// ---------------- Tauri 命令 ----------------

#[tauri::command]
pub fn db_init(state: tauri::State<Db>, work_dir: &str) -> Result<(), String> {
    let mut guard = state
        .0
        .lock()
        .map_err(|e| format!("db lock poisoned: {}", e))?;
    // 切换工作目录时先释放旧连接
    *guard = None;
    let conn = open_db(&Path::new(work_dir).join(DB_FILE))?;
    *guard = Some(conn);
    // 以真实数据目录校正 watcher 监听范围（dev/prod 目录名不同）
    crate::watcher::set_watched_dir(Path::new(work_dir).to_path_buf());
    crate::watcher::mark_self_write();
    Ok(())
}

#[tauri::command]
pub fn db_load_graphs(state: tauri::State<Db>) -> Result<String, String> {
    let guard = state.0.lock().map_err(|e| e.to_string())?;
    let conn = guard
        .as_ref()
        .ok_or("Database not initialized, call db_init first")?;
    load_graphs(conn)
}

#[tauri::command]
pub fn db_save_graph(state: tauri::State<Db>, graph_json: &str) -> Result<(), String> {
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    let conn = guard
        .as_mut()
        .ok_or("Database not initialized, call db_init first")?;
    let dto: GraphDto =
        serde_json::from_str(graph_json).map_err(|e| format!("Invalid graph payload: {}", e))?;
    save_graph(conn, &dto)?;
    crate::watcher::mark_self_write();
    Ok(())
}

#[tauri::command]
pub fn db_delete_graph(state: tauri::State<Db>, id: &str) -> Result<(), String> {
    let guard = state.0.lock().map_err(|e| e.to_string())?;
    let conn = guard
        .as_ref()
        .ok_or("Database not initialized, call db_init first")?;
    delete_graph(conn, id)?;
    crate::watcher::mark_self_write();
    Ok(())
}

#[tauri::command]
pub fn db_load_note_metas(state: tauri::State<Db>) -> Result<String, String> {
    let guard = state.0.lock().map_err(|e| e.to_string())?;
    let conn = guard
        .as_ref()
        .ok_or("Database not initialized, call db_init first")?;
    load_note_metas(conn)
}

#[tauri::command]
pub fn db_upsert_note_meta(state: tauri::State<Db>, meta_json: &str) -> Result<(), String> {
    let guard = state.0.lock().map_err(|e| e.to_string())?;
    let conn = guard
        .as_ref()
        .ok_or("Database not initialized, call db_init first")?;
    let dto: NoteMetaDto =
        serde_json::from_str(meta_json).map_err(|e| format!("Invalid note meta payload: {}", e))?;
    upsert_note_meta(conn, &dto)?;
    crate::watcher::mark_self_write();
    Ok(())
}

#[tauri::command]
pub fn db_migrate(state: tauri::State<Db>, work_dir: &str) -> Result<MigrateResult, String> {
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    let conn = guard
        .as_mut()
        .ok_or("Database not initialized, call db_init first")?;
    migrate_legacy(conn, work_dir).map(|r| {
        crate::watcher::mark_self_write();
        r
    })
}

// ---------------- 细粒度命令（filesystem-first：UI/MCP 单条写，不整图覆盖） ----------------

#[tauri::command]
pub fn db_upsert_graph_meta(state: tauri::State<Db>, meta_json: &str) -> Result<(), String> {
    let guard = state.0.lock().map_err(|e| e.to_string())?;
    let conn = guard
        .as_ref()
        .ok_or("Database not initialized, call db_init first")?;
    let patch: GraphMetaPatch = serde_json::from_str(meta_json)
        .map_err(|e| format!("Invalid graph meta payload: {}", e))?;
    upsert_graph_meta(conn, &patch)?;
    crate::watcher::mark_self_write();
    Ok(())
}

#[tauri::command]
pub fn db_create_node(state: tauri::State<Db>, graph_id: &str, node_json: &str) -> Result<(), String> {
    let guard = state.0.lock().map_err(|e| e.to_string())?;
    let conn = guard
        .as_ref()
        .ok_or("Database not initialized, call db_init first")?;
    let dto: NodeDto =
        serde_json::from_str(node_json).map_err(|e| format!("Invalid node payload: {}", e))?;
    create_node(conn, graph_id, &dto)?;
    crate::watcher::mark_self_write();
    Ok(())
}

#[tauri::command]
pub fn db_update_node(state: tauri::State<Db>, node_json: &str) -> Result<(), String> {
    let guard = state.0.lock().map_err(|e| e.to_string())?;
    let conn = guard
        .as_ref()
        .ok_or("Database not initialized, call db_init first")?;
    let patch: NodePatch =
        serde_json::from_str(node_json).map_err(|e| format!("Invalid node patch payload: {}", e))?;
    update_node(conn, &patch)?;
    crate::watcher::mark_self_write();
    Ok(())
}

#[tauri::command]
pub fn db_delete_node(state: tauri::State<Db>, graph_id: &str, node_id: &str) -> Result<i64, String> {
    let guard = state.0.lock().map_err(|e| e.to_string())?;
    let conn = guard
        .as_ref()
        .ok_or("Database not initialized, call db_init first")?;
    delete_node(conn, graph_id, node_id).map(|n| {
        crate::watcher::mark_self_write();
        n
    })
}

#[tauri::command]
pub fn db_add_edge(state: tauri::State<Db>, graph_id: &str, source_id: &str, target_id: &str) -> Result<(), String> {
    let guard = state.0.lock().map_err(|e| e.to_string())?;
    let conn = guard
        .as_ref()
        .ok_or("Database not initialized, call db_init first")?;
    add_edge(conn, graph_id, source_id, target_id)?;
    crate::watcher::mark_self_write();
    Ok(())
}

#[tauri::command]
pub fn db_remove_edge(state: tauri::State<Db>, graph_id: &str, source_id: &str, target_id: &str) -> Result<(), String> {
    let guard = state.0.lock().map_err(|e| e.to_string())?;
    let conn = guard
        .as_ref()
        .ok_or("Database not initialized, call db_init first")?;
    remove_edge(conn, graph_id, source_id, target_id)?;
    crate::watcher::mark_self_write();
    Ok(())
}

#[tauri::command]
pub fn db_delete_note(state: tauri::State<Db>, note_id: &str, data_dir: &str) -> Result<(), String> {
    let guard = state.0.lock().map_err(|e| e.to_string())?;
    let conn = guard
        .as_ref()
        .ok_or("Database not initialized, call db_init first")?;
    let notes_dir = Path::new(data_dir).join("notes");
    delete_note(conn, note_id, &notes_dir)?;
    crate::watcher::mark_self_write();
    Ok(())
}

#[tauri::command]
pub fn move_file(src: &str, dst: &str) -> Result<(), String> {
    if let Some(parent) = Path::new(dst).parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::rename(src, dst).map_err(|e| format!("Failed to move {} -> {}: {}", src, dst, e))?;
    crate::watcher::mark_self_write();
    Ok(())
}

#[tauri::command]
pub fn file_exists(path: &str) -> bool {
    Path::new(path).is_file()
}

// ---------------- 单元测试 ----------------

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    fn temp_workdir(tag: &str) -> std::path::PathBuf {
        let dir = env::temp_dir().join(format!("weavex_{}_{}", tag, std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    fn sample_dto() -> GraphDto {
        GraphDto {
            id: "g1".into(),
            name: "测试图".into(),
            created_at: 100,
            updated_at: 200,
            root_node_ids: vec!["a".into()],
            show_archive: Some(false),
            priority: Some(10.0),
            viewport: None,
            nodes: vec![
                NodeDto {
                    id: "a".into(),
                    name: "根节点".into(),
                    parent: None,
                    created_at: 1,
                    ..Default::default()
                },
                NodeDto {
                    id: "b".into(),
                    name: "子节点".into(),
                    parent: Some("a".into()),
                    created_at: 2,
                    ..Default::default()
                },
                NodeDto {
                    id: "c".into(),
                    name: "游离节点".into(),
                    created_at: 3,
                    ..Default::default()
                },
            ],
            edges: vec![EdgeDto {
                source: "a".into(),
                target: "b".into(),
            }],
        }
    }

    #[test]
    fn roundtrip_save_load_delete() {
        let dir = temp_workdir("rt");
        let db_path = dir.join(DB_FILE);
        let mut conn = open_db(&db_path).unwrap();

        save_graph(&mut conn, &sample_dto()).unwrap();

        let json = load_graphs(&conn).unwrap();
        let graphs: Vec<GraphDto> = serde_json::from_str(&json).unwrap();
        assert_eq!(graphs.len(), 1);
        let g = &graphs[0];
        assert_eq!(g.id, "g1");
        assert_eq!(g.root_node_ids, vec!["a".to_string()]);
        assert_eq!(g.nodes.len(), 3);
        assert_eq!(g.edges.len(), 1);
        assert_eq!(g.edges[0].source, "a");
        assert_eq!(g.edges[0].target, "b");

        // 覆盖保存（幂等）
        save_graph(&mut conn, &sample_dto()).unwrap();
        let graphs2: Vec<GraphDto> = serde_json::from_str(&load_graphs(&conn).unwrap()).unwrap();
        assert_eq!(graphs2.len(), 1);
        assert_eq!(graphs2[0].nodes.len(), 3);

        delete_graph(&conn, "g1").unwrap();
        let graphs3: Vec<GraphDto> = serde_json::from_str(&load_graphs(&conn).unwrap()).unwrap();
        assert!(graphs3.is_empty());

        drop(conn);
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn persistence_across_reopen() {
        let dir = temp_workdir("reopen");
        let db_path = dir.join(DB_FILE);
        {
            let mut conn = open_db(&db_path).unwrap();
            save_graph(&mut conn, &sample_dto()).unwrap();
        }
        let conn = open_db(&db_path).unwrap();
        let graphs: Vec<GraphDto> = serde_json::from_str(&load_graphs(&conn).unwrap()).unwrap();
        assert_eq!(graphs.len(), 1);
        assert_eq!(graphs[0].name, "测试图");
        drop(conn);
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn note_meta_roundtrip() {
        let dir = temp_workdir("note");
        let db_path = dir.join(DB_FILE);
        let conn = open_db(&db_path).unwrap();

        upsert_note_meta(
            &conn,
            &NoteMetaDto {
                id: "n1".into(),
                title: "第一份笔记".into(),
                path: Some("n1.md".into()),
                created_at: 1,
                updated_at: 2,
            },
        )
        .unwrap();
        upsert_note_meta(
            &conn,
            &NoteMetaDto {
                id: "n1".into(),
                title: "改名了".into(),
                path: Some("n1.md".into()),
                created_at: 1,
                updated_at: 3,
            },
        )
        .unwrap();

        let metas: Vec<NoteMetaDto> =
            serde_json::from_str(&load_note_metas(&conn).unwrap()).unwrap();
        assert_eq!(metas.len(), 1);
        assert_eq!(metas[0].title, "改名了");
        assert_eq!(metas[0].updated_at, 3);
        drop(conn);
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn graph_meta_patch_insert_and_update() {
        let dir = temp_workdir("meta");
        let db_path = dir.join(DB_FILE);
        let conn = open_db(&db_path).unwrap();

        // 新图（INSERT 分支）
        upsert_graph_meta(
            &conn,
            &GraphMetaPatch {
                id: "g1".into(),
                name: Some("项目A".into()),
                priority: Some(5.0),
                show_archive: Some(false),
                ..Default::default()
            },
        )
        .unwrap();

        // 更新部分字段
        upsert_graph_meta(
            &conn,
            &GraphMetaPatch {
                id: "g1".into(),
                name: Some("项目A改".into()),
                root_node_ids: Some(vec!["a".into(), "b".into()]),
                ..Default::default()
            },
        )
        .unwrap();

        let graphs: Vec<GraphDto> = serde_json::from_str(&load_graphs(&conn).unwrap()).unwrap();
        assert_eq!(graphs.len(), 1);
        assert_eq!(graphs[0].name, "项目A改");
        assert_eq!(graphs[0].root_node_ids, vec!["a".to_string(), "b".to_string()]);
        assert_eq!(graphs[0].priority, Some(5.0));
        assert!(graphs[0].updated_at > 0);
        drop(conn);
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn create_update_delete_node_with_root_link() {
        let dir = temp_workdir("node");
        let db_path = dir.join(DB_FILE);
        let conn = open_db(&db_path).unwrap();

        upsert_graph_meta(
            &conn,
            &GraphMetaPatch {
                id: "g1".into(),
                name: Some("项目".into()),
                ..Default::default()
            },
        )
        .unwrap();

        // 根节点 → 自动进 root_node_ids
        create_node(
            &conn,
            "g1",
            &NodeDto {
                id: "a".into(),
                name: "根".into(),
                created_at: 1,
                updated_at: 1,
                start_at: 1,
                end_at: 1,
                priority: Some(100.0),
                expanded: Some(false),
                is_followed: Some(false),
                ..Default::default()
            },
        )
        .unwrap();

        // 子节点（parent=a）→ 不进 root
        create_node(
            &conn,
            "g1",
            &NodeDto {
                id: "b".into(),
                name: "子".into(),
                parent: Some("a".into()),
                created_at: 2,
                updated_at: 2,
                ..Default::default()
            },
        )
        .unwrap();

        let graphs: Vec<GraphDto> = serde_json::from_str(&load_graphs(&conn).unwrap()).unwrap();
        assert_eq!(graphs[0].root_node_ids, vec!["a".to_string()]);
        assert_eq!(graphs[0].nodes.len(), 2);
        assert_eq!(graphs[0].nodes[1].parent.as_deref(), Some("a"));

        // 更新字段
        update_node(
            &conn,
            &NodePatch {
                id: "b".into(),
                graph_id: "g1".into(),
                name: Some("子改".into()),
                completed: Some(true),
                completed_at: Some(999),
                expanded: Some(true),
                ..Default::default()
            },
        )
        .unwrap();
        let graphs2: Vec<GraphDto> = serde_json::from_str(&load_graphs(&conn).unwrap()).unwrap();
        assert_eq!(graphs2[0].nodes[1].name, "子改");
        assert!(graphs2[0].nodes[1].completed);
        assert_eq!(graphs2[0].nodes[1].completed_at, 999);
        assert_eq!(graphs2[0].nodes[1].expanded, Some(true));

        // parent 置空 → b 变根，进 root_node_ids
        update_node(
            &conn,
            &NodePatch {
                id: "b".into(),
                graph_id: "g1".into(),
                parent: Some(None),
                ..Default::default()
            },
        )
        .unwrap();
        let graphs3: Vec<GraphDto> = serde_json::from_str(&load_graphs(&conn).unwrap()).unwrap();
        assert_eq!(graphs3[0].nodes[1].parent, None);
        let mut roots = graphs3[0].root_node_ids.clone();
        roots.sort();
        assert_eq!(roots, vec!["a".to_string(), "b".to_string()]);

        // 再挂回 a → b 移出 root
        update_node(
            &conn,
            &NodePatch {
                id: "b".into(),
                graph_id: "g1".into(),
                parent: Some(Some("a".into())),
                ..Default::default()
            },
        )
        .unwrap();
        let graphs4: Vec<GraphDto> = serde_json::from_str(&load_graphs(&conn).unwrap()).unwrap();
        assert_eq!(graphs4[0].root_node_ids, vec!["a".to_string()]);

        drop(conn);
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn delete_node_removes_subtree_and_edges() {
        let dir = temp_workdir("delnode");
        let db_path = dir.join(DB_FILE);
        let conn = open_db(&db_path).unwrap();

        upsert_graph_meta(
            &conn,
            &GraphMetaPatch {
                id: "g1".into(),
                name: Some("项目".into()),
                root_node_ids: Some(vec!["a".into()]),
                ..Default::default()
            },
        )
        .unwrap();
        for (id, parent, name) in [
            ("a", None, "根"),
            ("b", Some("a"), "子B"),
            ("c", Some("b"), "孙C"),
            ("d", None, "根D"),
        ] {
            create_node(
                &conn,
                "g1",
                &NodeDto {
                    id: id.into(),
                    name: name.into(),
                    parent: parent.map(|p| p.to_string()),
                    created_at: 1,
                    updated_at: 1,
                    ..Default::default()
                },
            )
            .unwrap();
        }
        add_edge(&conn, "g1", "b", "d").unwrap();
        add_edge(&conn, "g1", "a", "d").unwrap();

        // 删除 b → 连带 c 与边 (b-d, a-d 中涉及 b 的部分)
        let removed = delete_node(&conn, "g1", "b").unwrap();
        assert_eq!(removed, 2); // b + c

        let graphs: Vec<GraphDto> = serde_json::from_str(&load_graphs(&conn).unwrap()).unwrap();
        assert_eq!(graphs[0].nodes.len(), 2); // a, d
        assert_eq!(graphs[0].edges.len(), 1); // a-d 保留，b-d 删除
        let mut roots = graphs[0].root_node_ids.clone();
        roots.sort();
        assert_eq!(roots, vec!["a".to_string(), "d".to_string()]);
        drop(conn);
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn edge_add_remove_roundtrip() {
        let dir = temp_workdir("edge");
        let db_path = dir.join(DB_FILE);
        let conn = open_db(&db_path).unwrap();

        upsert_graph_meta(
            &conn,
            &GraphMetaPatch {
                id: "g1".into(),
                name: Some("项目".into()),
                ..Default::default()
            },
        )
        .unwrap();
        add_edge(&conn, "g1", "a", "b").unwrap();
        add_edge(&conn, "g1", "a", "b").unwrap(); // 幂等
        remove_edge(&conn, "g1", "a", "b").unwrap();

        let graphs: Vec<GraphDto> = serde_json::from_str(&load_graphs(&conn).unwrap()).unwrap();
        assert!(graphs[0].edges.is_empty());
        drop(conn);
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn delete_note_removes_row_and_file() {
        let dir = temp_workdir("delnote");
        let db_path = dir.join(DB_FILE);
        let notes_dir = dir.join("notes");
        fs::create_dir_all(&notes_dir).unwrap();
        let conn = open_db(&db_path).unwrap();

        upsert_note_meta(
            &conn,
            &NoteMetaDto {
                id: "n1".into(),
                title: "笔记".into(),
                path: Some("n1.md".into()),
                created_at: 1,
                updated_at: 2,
            },
        )
        .unwrap();
        fs::write(notes_dir.join("n1.md"), "hello").unwrap();

        delete_note(&conn, "n1", &notes_dir).unwrap();
        assert!(!notes_dir.join("n1.md").exists());
        let metas: Vec<NoteMetaDto> =
            serde_json::from_str(&load_note_metas(&conn).unwrap()).unwrap();
        assert!(metas.is_empty());
        drop(conn);
        let _ = fs::remove_dir_all(&dir);
    }

    /// 使用真实旧数据做迁移验证：设置环境变量 WEAVEX_TEST_DATA 指向包含
    /// graphs.json 与 note-meta.json 的目录（可用备份目录）后运行。
    #[test]
    fn migrate_real_backup_data() {
        let dir = env::var("WEAVEX_TEST_DATA").unwrap_or_default();
        if dir.is_empty() {
            eprintln!("skip: WEAVEX_TEST_DATA not set");
            return;
        }

        let work = temp_workdir("migrate");
        fs::copy(
            Path::new(&dir).join("graphs.json"),
            work.join("graphs.json"),
        )
        .unwrap();
        fs::copy(
            Path::new(&dir).join("note-meta.json"),
            work.join("note-meta.json"),
        )
        .unwrap();

        // 期望值：直接解析旧文件统计
        let legacy_text = fs::read_to_string(work.join("graphs.json")).unwrap();
        let legacy_map: HashMap<String, LegacyGraph> = serde_json::from_str(&legacy_text).unwrap();
        let expected_graphs = legacy_map.len() as i64;
        let mut expected_nodes = 0i64;
        let mut expected_edges = 0i64;
        for g in legacy_map.values() {
            expected_nodes += g.nodes.len() as i64;
            let mut edge_set: HashSet<(String, String)> = HashSet::new();
            for n in g.nodes.values() {
                for t in &n.nexts {
                    if g.nodes.contains_key(t) {
                        edge_set.insert((n.id.clone(), t.clone()));
                    }
                }
            }
            expected_edges += edge_set.len() as i64;
        }
        let notes_text = fs::read_to_string(work.join("note-meta.json")).unwrap();
        let legacy_notes: HashMap<String, LegacyNoteMeta> =
            serde_json::from_str(&notes_text).unwrap();
        let expected_notes = legacy_notes.len() as i64;

        let db_path = work.join(DB_FILE);
        let mut conn = open_db(&db_path).unwrap();
        let res = migrate_legacy(&mut conn, work.to_str().unwrap()).unwrap();
        assert_eq!(res.graphs, expected_graphs, "migrated graphs count");
        assert_eq!(res.notes, expected_notes, "migrated notes count");

        let loaded: Vec<GraphDto> = serde_json::from_str(&load_graphs(&conn).unwrap()).unwrap();
        assert_eq!(loaded.len() as i64, expected_graphs);
        let mut nodes = 0i64;
        let mut edges = 0i64;
        for g in &loaded {
            nodes += g.nodes.len() as i64;
            edges += g.edges.len() as i64;
        }
        assert_eq!(nodes, expected_nodes, "node rows match legacy");
        assert_eq!(edges, expected_edges, "edge rows match legacy");

        // 旧文件应被重命名为 .bak
        assert!(work.join("graphs.json.bak").exists());
        assert!(!work.join("graphs.json").exists());
        assert!(work.join("note-meta.json.bak").exists());
        assert!(!work.join("note-meta.json").exists());

        drop(conn);
        let _ = fs::remove_dir_all(&work);
    }
}
