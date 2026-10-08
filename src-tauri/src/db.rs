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

/// 打开（不存在则创建）工作目录下的 weavex.db，并确保表结构存在。
pub fn open_db(path: &Path) -> Result<Connection, String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create dir: {}", e))?;
    }
    let conn = Connection::open(path)
        .map_err(|e| format!("Failed to open database {}: {}", path.display(), e))?;
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
    .map_err(|e| format!("Failed to create schema: {}", e))
}

// ---------------- 图数据读写 ----------------

/// 保存一张图：事务内整体替换该图的数据（图规模小，简单且原子）。
pub fn save_graph(conn: &mut Connection, dto: &GraphDto) -> Result<(), String> {
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    let root_json = serde_json::to_string(&dto.root_node_ids).unwrap_or_else(|_| "[]".into());

    tx.execute(
        "INSERT INTO graphs (id, name, created_at, updated_at, root_node_ids, show_archive, priority)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           created_at = excluded.created_at,
           updated_at = excluded.updated_at,
           root_node_ids = excluded.root_node_ids,
           show_archive = excluded.show_archive,
           priority = excluded.priority",
        params![
            dto.id,
            dto.name,
            dto.created_at,
            dto.updated_at,
            root_json,
            dto.show_archive,
            dto.priority
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
            .prepare("INSERT OR IGNORE INTO edges (graph_id, source_id, target_id) VALUES (?1, ?2, ?3)")
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
                .map_err(|err| format!("Failed to insert edge {}-{}: {}", e.source, e.target, err))?;
        }
    }

    tx.commit()
        .map_err(|e| format!("Failed to commit graph {}: {}", dto.id, e))
}

/// 读取全部图数据，返回 GraphDto 数组的 JSON 字符串。
pub fn load_graphs(conn: &Connection) -> Result<String, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, name, created_at, updated_at, root_node_ids, show_archive, priority
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
            ))
        })
        .map_err(|e| e.to_string())?;

    let mut graphs: Vec<GraphDto> = Vec::new();
    for row in rows {
        let (id, name, created_at, updated_at, root_json, show_archive, priority) =
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

// ---------------- 笔记元数据 ----------------

pub fn load_note_metas(conn: &Connection) -> Result<String, String> {
    let mut stmt = conn
        .prepare("SELECT id, title, path, created_at, updated_at FROM notes ORDER BY updated_at DESC")
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
    let dto: GraphDto = serde_json::from_str(graph_json)
        .map_err(|e| format!("Invalid graph payload: {}", e))?;
    save_graph(conn, &dto)
}

#[tauri::command]
pub fn db_delete_graph(state: tauri::State<Db>, id: &str) -> Result<(), String> {
    let guard = state.0.lock().map_err(|e| e.to_string())?;
    let conn = guard
        .as_ref()
        .ok_or("Database not initialized, call db_init first")?;
    delete_graph(conn, id)
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
    let dto: NoteMetaDto = serde_json::from_str(meta_json)
        .map_err(|e| format!("Invalid note meta payload: {}", e))?;
    upsert_note_meta(conn, &dto)
}

#[tauri::command]
pub fn db_migrate(state: tauri::State<Db>, work_dir: &str) -> Result<MigrateResult, String> {
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    let conn = guard
        .as_mut()
        .ok_or("Database not initialized, call db_init first")?;
    migrate_legacy(conn, work_dir)
}

#[tauri::command]
pub fn move_file(src: &str, dst: &str) -> Result<(), String> {
    if let Some(parent) = Path::new(dst).parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::rename(src, dst).map_err(|e| format!("Failed to move {} -> {}: {}", src, dst, e))
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
        let graphs2: Vec<GraphDto> =
            serde_json::from_str(&load_graphs(&conn).unwrap()).unwrap();
        assert_eq!(graphs2.len(), 1);
        assert_eq!(graphs2[0].nodes.len(), 3);

        delete_graph(&conn, "g1").unwrap();
        let graphs3: Vec<GraphDto> =
            serde_json::from_str(&load_graphs(&conn).unwrap()).unwrap();
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
        let graphs: Vec<GraphDto> =
            serde_json::from_str(&load_graphs(&conn).unwrap()).unwrap();
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
        fs::copy(Path::new(&dir).join("graphs.json"), work.join("graphs.json")).unwrap();
        fs::copy(Path::new(&dir).join("note-meta.json"), work.join("note-meta.json")).unwrap();

        // 期望值：直接解析旧文件统计
        let legacy_text = fs::read_to_string(work.join("graphs.json")).unwrap();
        let legacy_map: HashMap<String, LegacyGraph> =
            serde_json::from_str(&legacy_text).unwrap();
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

        let loaded: Vec<GraphDto> =
            serde_json::from_str(&load_graphs(&conn).unwrap()).unwrap();
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
