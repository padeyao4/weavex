// Weavex MCP Server
// 让豆包等 MCP 客户端直接读写 Weavex 的任务图与笔记数据。
//
// 数据定位（优先级从高到低）：
//   1. 环境变量 WEAVEX_DATA_DIR（显式指定）
//   2. 生产版：%APPDATA%\padeyao4.weavex（Tauri appDataDir，按 identifier 隔离）
//      开发版（--dev 或 WEAVEX_DEV=1）：%APPDATA%\dev.padeyao4.weavex
//   3. 兜底兼容旧版：~\Documents\WeavexData
//
// 存储口径与前端一致：
//   - SQLite weavex.db：graphs / nodes / edges / notes 四表（时间戳为毫秒）
//   - 笔记正文：<dataDir>/notes/<id>.md
//
// 端口：--dev 或 WEAVEX_DEV=1 时默认 8913（开发版），否则默认 8912（生产版）；
//      均可被环境变量 WEAVEX_MCP_PORT 覆盖（Weavex 应用自动拉起时总是显式传入）。

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

// ---------------- 数据目录解析 ----------------

function isDevMode() {
  return process.env.WEAVEX_DEV === "1" || process.argv.includes("--dev");
}

function resolveDataDir() {
  if (process.env.WEAVEX_DATA_DIR) {
    return process.env.WEAVEX_DATA_DIR;
  }
  const appData =
    process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
  // Tauri appDataDir：dev/prod 使用不同 identifier → 目录天然隔离
  const dir = path.join(
    appData,
    isDevMode() ? "dev.padeyao4.weavex" : "padeyao4.weavex",
  );
  if (fs.existsSync(path.join(dir, "weavex.db"))) {
    return dir;
  }
  // 兜底兼容旧版数据位置（文档目录/WeavexData）
  return path.join(os.homedir(), "Documents", "WeavexData");
}

let dataDirCache = null;
function dataDir() {
  if (!dataDirCache) dataDirCache = resolveDataDir();
  return dataDirCache;
}

let dbCache = null;
function openDb() {
  if (dbCache) return dbCache;
  const dbPath = path.join(dataDir(), "weavex.db");
  if (!fs.existsSync(dbPath)) {
    throw new Error(
      `未找到 Weavex 数据库: ${dbPath}\n请先启动一次 Weavex 应用生成数据目录，或设置环境变量 WEAVEX_DATA_DIR 指向正确目录。`,
    );
  }
  const db = new DatabaseSync(dbPath);
  // 与 Weavex 应用并发读写时等待锁
  db.exec("PRAGMA busy_timeout=5000;");
  dbCache = db;
  return db;
}

// ---------------- 小工具 ----------------

const now = () => Date.now();

function tx(db, fn) {
  db.exec("BEGIN");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

function getGraphRow(db, graphId) {
  const row = db
    .prepare(
      "SELECT id, name, created_at, updated_at, root_node_ids, show_archive, priority FROM graphs WHERE id = ?",
    )
    .get(graphId);
  if (!row) throw new Error(`项目不存在: ${graphId}`);
  return row;
}

function parseRootIds(graphRow) {
  try {
    return JSON.parse(graphRow.root_node_ids || "[]");
  } catch {
    return [];
  }
}

/** 组装带 children 的节点树（与前端口径一致：parent 指向父节点，无 parent 为根） */
function buildGraphDetail(graphId) {
  const db = openDb();
  const graphRow = getGraphRow(db, graphId);
  const nodes = db
    .prepare("SELECT * FROM nodes WHERE graph_id = ? ORDER BY priority, created_at")
    .all(graphId)
    .map(normalizeNode);
  const edges = db
    .prepare("SELECT source_id, target_id FROM edges WHERE graph_id = ?")
    .all(graphId);

  const map = new Map();
  for (const n of nodes) map.set(n.id, { ...n, children: [] });
  const roots = [];
  for (const n of nodes) {
    const node = map.get(n.id);
    if (n.parent && map.has(n.parent)) map.get(n.parent).children.push(node);
    else roots.push(node);
  }

  const graph = {
    id: graphRow.id,
    name: graphRow.name,
    createdAt: graphRow.created_at,
    updatedAt: graphRow.updated_at,
    showArchive: graphRow.show_archive === 1,
    priority: graphRow.priority ?? null,
    rootNodeIds: parseRootIds(graphRow),
  };
  return { graph, nodes: nodes.map((n) => map.get(n.id)), roots, edges };
}

function normalizeNode(n) {
  return {
    id: n.id,
    graphId: n.graph_id,
    name: n.name,
    description: n.description ?? "",
    record: n.record ?? "",
    createdAt: n.created_at,
    updatedAt: n.updated_at,
    startAt: n.start_at || 0,
    endAt: n.end_at || 0,
    parent: n.parent_id ?? null,
    completedAt: n.completed_at || 0,
    completed: n.completed === 1,
    expanded: n.expanded === 1,
    priority: n.priority ?? null,
    isFollowed: n.is_followed === 1,
    isArchive: n.is_archive === 1,
  };
}

function collectSubtreeIds(db, graphId, nodeId) {
  const ids = new Set([nodeId]);
  const queue = [nodeId];
  while (queue.length) {
    const cur = queue.shift();
    const children = db
      .prepare("SELECT id FROM nodes WHERE graph_id = ? AND parent_id = ?")
      .all(graphId, cur);
    for (const c of children) {
      if (!ids.has(c.id)) {
        ids.add(c.id);
        queue.push(c.id);
      }
    }
  }
  return [...ids];
}

function notesDir() {
  return path.join(dataDir(), "notes");
}

function noteFilePath(metaPath) {
  return path.join(notesDir(), metaPath);
}

// ---------------- 服务器与工具注册 ----------------
// 每个连接/session 需要独立的 McpServer 实例（SDK 限制：一个 server 只能连一个 transport），
// 因此工具注册抽成工厂函数，stdio 与 HTTP 模式各自创建实例。

function createServer() {
  const server = new McpServer({
    name: "weavex",
    version: "0.1.0",
  });

// ----- 项目（图） -----

server.registerTool(
  "list_graphs",
  {
    description:
      "列出 Weavex 中的所有项目（任务图）概要，包含名称、创建/更新时间、根节点数等。",
    inputSchema: {},
  },
  async () => {
    const db = openDb();
    const rows = db
      .prepare(
        "SELECT id, name, created_at, updated_at, root_node_ids FROM graphs ORDER BY priority, created_at",
      )
      .all();
    const items = rows.map((r) => ({
      id: r.id,
      name: r.name,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      rootNodeCount: parseRootIds(r).length,
    }));
    return jsonText({ count: items.length, items });
  },
);

server.registerTool(
  "get_graph",
  {
    description:
      "获取单个项目的完整结构：项目信息、节点列表（含父子关系与完成/关注状态）、根节点树、边（前置/后置依赖）。",
    inputSchema: { graphId: z.string().describe("项目 ID，来自 list_graphs") },
  },
  async ({ graphId }) => {
    const detail = buildGraphDetail(graphId);
    return jsonText(detail);
  },
);

server.registerTool(
  "create_graph",
  {
    description: "创建一个新的项目（任务图），并返回项目详情。",
    inputSchema: { name: z.string().describe("项目名称") },
  },
  async ({ name }) => {
    const db = openDb();
    const id = randomUUID();
    const t = now();
    tx(db, () => {
      db.prepare(
        "INSERT INTO graphs (id, name, created_at, updated_at, root_node_ids, priority) VALUES (?, ?, ?, ?, ?, ?)",
      ).run(id, name, t, t, "[]", t);
    });
    return jsonText(buildGraphDetail(id));
  },
);

server.registerTool(
  "rename_graph",
  {
    description: "重命名一个项目（任务图）。",
    inputSchema: {
      graphId: z.string(),
      name: z.string().describe("新的项目名称"),
    },
  },
  async ({ graphId, name }) => {
    const db = openDb();
    db.prepare("UPDATE graphs SET name = ?, updated_at = ? WHERE id = ?").run(
      name,
      now(),
      graphId,
    );
    return jsonText({ ok: true, graphId, name });
  },
);

server.registerTool(
  "delete_graph",
  {
    description:
      "删除一个项目（任务图）及其全部节点与边。注意：该操作不可恢复，会连带删除所有任务数据。",
    inputSchema: { graphId: z.string() },
  },
  async ({ graphId }) => {
    const db = openDb();
    tx(db, () => {
      db.prepare("DELETE FROM edges WHERE graph_id = ?").run(graphId);
      db.prepare("DELETE FROM nodes WHERE graph_id = ?").run(graphId);
      db.prepare("DELETE FROM graphs WHERE id = ?").run(graphId);
    });
    return jsonText({ ok: true, graphId });
  },
);

// ----- 任务节点 -----

server.registerTool(
  "list_nodes",
  {
    description:
      "列出某个项目下的全部任务节点（扁平的完整列表），含完成、关注、归档、优先级等状态。",
    inputSchema: { graphId: z.string() },
  },
  async ({ graphId }) => {
    getGraphRow(openDb(), graphId);
    const db = openDb();
    const nodes = db
      .prepare("SELECT * FROM nodes WHERE graph_id = ? ORDER BY priority, created_at")
      .all(graphId)
      .map(normalizeNode);
    return jsonText({ graphId, count: nodes.length, nodes });
  },
);

server.registerTool(
  "get_node",
  {
    description: "获取单个任务节点的完整字段。",
    inputSchema: { graphId: z.string(), nodeId: z.string() },
  },
  async ({ graphId, nodeId }) => {
    const db = openDb();
    const row = db
      .prepare("SELECT * FROM nodes WHERE graph_id = ? AND id = ?")
      .get(graphId, nodeId);
    if (!row) throw new Error(`节点不存在: ${nodeId}`);
    return jsonText(normalizeNode(row));
  },
);

server.registerTool(
  "create_node",
  {
    description:
      "在项目中创建一个任务节点。不传 parentId 时创建为根任务；传 parentId 时创建为其子任务。",
    inputSchema: {
      graphId: z.string(),
      name: z.string().describe("任务名称"),
      description: z.string().optional().describe("任务描述"),
      record: z.string().optional().describe("备注/记录文本"),
      parentId: z.string().optional().describe("父任务节点 ID（可选，传则创建为子任务）"),
      startAt: z.number().optional().describe("开始时间（毫秒时间戳，可选）"),
      endAt: z.number().optional().describe("截止时间（毫秒时间戳，可选）"),
    },
  },
  async ({ graphId, name, description, record, parentId, startAt, endAt }) => {
    const db = openDb();
    getGraphRow(db, graphId);
    const id = randomUUID();
    const t = now();
    tx(db, () => {
      db.prepare(
        `INSERT INTO nodes (id, graph_id, name, description, record, created_at, updated_at,
          start_at, end_at, parent_id, completed_at, completed, expanded, priority, is_followed, is_archive)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, NULL, ?, 0, 0)`,
      ).run(id, graphId, name, description ?? "", record ?? "", t, t, startAt ?? 0, endAt ?? 0, parentId ?? null, t);
      if (!parentId) {
        const graphRow = getGraphRow(db, graphId);
        const ids = parseRootIds(graphRow);
        ids.push(id);
        db.prepare("UPDATE graphs SET root_node_ids = ?, updated_at = ? WHERE id = ?").run(
          JSON.stringify(ids),
          t,
          graphId,
        );
      }
    });
    return jsonText(buildGraphDetail(graphId));
  },
);

server.registerTool(
  "update_node",
  {
    description: "更新任务节点的字段（只更新传入的字段）：名称、描述、备注、开始/截止时间。",
    inputSchema: {
      graphId: z.string(),
      nodeId: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      record: z.string().optional(),
      startAt: z.number().optional(),
      endAt: z.number().optional(),
    },
  },
  async ({ graphId, nodeId, name, description, record, startAt, endAt }) => {
    const db = openDb();
    const exists = db
      .prepare("SELECT id FROM nodes WHERE graph_id = ? AND id = ?")
      .get(graphId, nodeId);
    if (!exists) throw new Error(`节点不存在: ${nodeId}`);
    const sets = [];
    const params = [];
    if (name !== undefined) { sets.push("name = ?"); params.push(name); }
    if (description !== undefined) { sets.push("description = ?"); params.push(description); }
    if (record !== undefined) { sets.push("record = ?"); params.push(record); }
    if (startAt !== undefined) { sets.push("start_at = ?"); params.push(startAt); }
    if (endAt !== undefined) { sets.push("end_at = ?"); params.push(endAt); }
    sets.push("updated_at = ?");
    params.push(now());
    params.push(graphId, nodeId);
    db.prepare(`UPDATE nodes SET ${sets.join(", ")} WHERE graph_id = ? AND id = ?`).run(...params);
    return jsonText({ ok: true, graphId, nodeId });
  },
);

server.registerTool(
  "delete_node",
  {
    description:
      "删除一个任务节点及其所有后代子节点（连带删除相关依赖边）。注意：不可恢复。",
    inputSchema: { graphId: z.string(), nodeId: z.string() },
  },
  async ({ graphId, nodeId }) => {
    const db = openDb();
    let deleted = 0;
    tx(db, () => {
      const ids = collectSubtreeIds(db, graphId, nodeId);
      deleted = ids.length;
      const placeholders = ids.map(() => "?").join(",");
      db.prepare(
        `DELETE FROM edges WHERE graph_id = ? AND (source_id IN (${placeholders}) OR target_id IN (${placeholders}))`,
      ).run(graphId, ...ids, ...ids);
      db.prepare(`DELETE FROM nodes WHERE graph_id = ? AND id IN (${placeholders})`).run(
        graphId,
        ...ids,
      );
      // 从根节点列表移除
      const graphRow = getGraphRow(db, graphId);
      const rootIds = parseRootIds(graphRow).filter((i) => !ids.includes(i));
      db.prepare("UPDATE graphs SET root_node_ids = ?, updated_at = ? WHERE id = ?").run(
        JSON.stringify(rootIds),
        now(),
        graphId,
      );
    });
    return jsonText({ ok: true, graphId, nodeId, deletedNodeCount: deleted });
  },
);

server.registerTool(
  "toggle_node_completed",
  {
    description: "切换任务节点的完成状态（完成 ↔ 未完成）。",
    inputSchema: { graphId: z.string(), nodeId: z.string() },
  },
  async ({ graphId, nodeId }) => {
    const db = openDb();
    const row = db
      .prepare("SELECT completed FROM nodes WHERE graph_id = ? AND id = ?")
      .get(graphId, nodeId);
    if (!row) throw new Error(`节点不存在: ${nodeId}`);
    const completed = row.completed === 1 ? 0 : 1;
    const t = now();
    db.prepare(
      "UPDATE nodes SET completed = ?, completed_at = ?, updated_at = ? WHERE graph_id = ? AND id = ?",
    ).run(completed, completed ? t : 0, t, graphId, nodeId);
    return jsonText({ ok: true, graphId, nodeId, completed: completed === 1 });
  },
);

server.registerTool(
  "toggle_node_followed",
  {
    description: "切换任务节点的关注状态（关注 ↔ 取消关注）。",
    inputSchema: { graphId: z.string(), nodeId: z.string() },
  },
  async ({ graphId, nodeId }) => {
    const db = openDb();
    const row = db
      .prepare("SELECT is_followed FROM nodes WHERE graph_id = ? AND id = ?")
      .get(graphId, nodeId);
    if (!row) throw new Error(`节点不存在: ${nodeId}`);
    const followed = row.is_followed === 1 ? 0 : 1;
    const t = now();
    db.prepare(
      "UPDATE nodes SET is_followed = ?, priority = ?, updated_at = ? WHERE graph_id = ? AND id = ?",
    ).run(followed, followed ? t : row.priority ?? null, t, graphId, nodeId);
    return jsonText({ ok: true, graphId, nodeId, isFollowed: followed === 1 });
  },
);

// ----- 依赖边 -----

server.registerTool(
  "add_edge",
  {
    description:
      "在两个任务节点之间建立前置/依赖关系：sourceId 是 targetId 的前置节点（target 依赖 source 完成）。",
    inputSchema: {
      graphId: z.string(),
      sourceId: z.string().describe("前置节点 ID"),
      targetId: z.string().describe("后续节点 ID"),
    },
  },
  async ({ graphId, sourceId, targetId }) => {
    const db = openDb();
    db.prepare(
      "INSERT OR IGNORE INTO edges (graph_id, source_id, target_id) VALUES (?, ?, ?)",
    ).run(graphId, sourceId, targetId);
    return jsonText({ ok: true, graphId, sourceId, targetId });
  },
);

server.registerTool(
  "remove_edge",
  {
    description: "删除两个任务节点之间的前置/依赖关系。",
    inputSchema: {
      graphId: z.string(),
      sourceId: z.string(),
      targetId: z.string(),
    },
  },
  async ({ graphId, sourceId, targetId }) => {
    const db = openDb();
    db.prepare(
      "DELETE FROM edges WHERE graph_id = ? AND source_id = ? AND target_id = ?",
    ).run(graphId, sourceId, targetId);
    return jsonText({ ok: true, graphId, sourceId, targetId });
  },
);

// ----- 笔记 -----

server.registerTool(
  "list_notes",
  {
    description: "列出 Weavex 中的所有笔记元信息（标题、创建/更新时间）。",
    inputSchema: {},
  },
  async () => {
    const db = openDb();
    const rows = db
      .prepare("SELECT id, title, created_at, updated_at FROM notes ORDER BY updated_at DESC")
      .all();
    const items = rows.map((r) => ({
      id: r.id,
      title: r.title,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
    return jsonText({ count: items.length, items });
  },
);

server.registerTool(
  "read_note",
  {
    description: "读取一篇笔记的正文内容（Markdown 文本）。",
    inputSchema: { noteId: z.string().describe("笔记 ID，来自 list_notes") },
  },
  async ({ noteId }) => {
    const db = openDb();
    const row = db
      .prepare("SELECT id, title, path, created_at, updated_at FROM notes WHERE id = ?")
      .get(noteId);
    if (!row) throw new Error(`笔记不存在: ${noteId}`);
    let content = "";
    if (row.path) {
      const file = noteFilePath(row.path);
      content = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
    }
    return jsonText({
      id: row.id,
      title: row.title,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      content,
    });
  },
);

server.registerTool(
  "create_note",
  {
    description: "创建一篇新笔记。可传 content 直接写入正文（Markdown）。",
    inputSchema: {
      title: z.string().describe("笔记标题"),
      content: z.string().optional().describe("笔记正文（Markdown），可选"),
    },
  },
  async ({ title, content }) => {
    const db = openDb();
    const id = randomUUID();
    const t = now();
    const metaPath = content !== undefined ? `${id}.md` : null;
    tx(db, () => {
      db.prepare(
        "INSERT INTO notes (id, title, path, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      ).run(id, title, metaPath, t, t);
    });
    if (content !== undefined) {
      fs.mkdirSync(notesDir(), { recursive: true });
      fs.writeFileSync(noteFilePath(metaPath), content, "utf8");
    }
    return jsonText({ id, title, createdAt: t, updatedAt: t });
  },
);

server.registerTool(
  "update_note",
  {
    description: "更新一篇笔记的标题和/或正文。只更新传入的字段。",
    inputSchema: {
      noteId: z.string(),
      title: z.string().optional(),
      content: z.string().optional().describe("新的正文（Markdown）"),
    },
  },
  async ({ noteId, title, content }) => {
    const db = openDb();
    const row = db
      .prepare("SELECT path FROM notes WHERE id = ?")
      .get(noteId);
    if (!row) throw new Error(`笔记不存在: ${noteId}`);
    const t = now();
    tx(db, () => {
      let newPath = row.path;
      if (content !== undefined) {
        if (!newPath) {
          newPath = `${noteId}.md`;
          db.prepare("UPDATE notes SET path = ? WHERE id = ?").run(newPath, noteId);
        }
        fs.mkdirSync(notesDir(), { recursive: true });
        fs.writeFileSync(noteFilePath(newPath), content, "utf8");
      }
      if (title !== undefined) {
        db.prepare("UPDATE notes SET title = ?, updated_at = ? WHERE id = ?").run(title, t, noteId);
      } else if (content !== undefined) {
        db.prepare("UPDATE notes SET updated_at = ? WHERE id = ?").run(t, noteId);
      }
    });
    return jsonText({ ok: true, noteId });
  },
);

server.registerTool(
  "delete_note",
  {
    description: "删除一篇笔记（连同其正文文件）。注意：不可恢复。",
    inputSchema: { noteId: z.string() },
  },
  async ({ noteId }) => {
    const db = openDb();
    const row = db.prepare("SELECT path FROM notes WHERE id = ?").get(noteId);
    if (!row) throw new Error(`笔记不存在: ${noteId}`);
    tx(db, () => {
      db.prepare("DELETE FROM notes WHERE id = ?").run(noteId);
    });
    if (row.path) {
      const file = noteFilePath(row.path);
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
    return jsonText({ ok: true, noteId });
  },
);

  return server;
}

// ---------------- 输出辅助 ----------------

function jsonText(obj) {
  return {
    content: [{ type: "text", text: JSON.stringify(obj, null, 2) }],
  };
}

// ---------------- 父进程看护 ----------------
// 当 WEAVEX_PARENT_PID 被设置（由 Weavex 应用拉起）时，定期检查父进程是否存活；
// 父进程退出（正常关闭 / 崩溃 / 被强杀）后本服务自动退出，避免留下孤儿进程占用端口。

function watchParent() {
  const parentPid = process.env.WEAVEX_PARENT_PID;
  if (!parentPid) return;
  const pid = Number(parentPid);
  if (!Number.isInteger(pid) || pid <= 0) return;
  const interval = setInterval(() => {
    try {
      // process.kill(pid, 0) 在 Windows 上仅探测进程是否存在，不发送信号
      process.kill(pid, 0);
    } catch {
      clearInterval(interval);
      console.error(
        `[weavex-mcp] 父进程(pid ${pid})已退出，本服务自动关闭。`,
      );
      process.exit(0);
    }
  }, 5000);
  // 不阻塞事件循环退出
  if (typeof interval.unref === "function") interval.unref();
}

// ---------------- 启动 ----------------
// 默认 stdio 模式（供 Claude Desktop / Cursor 等支持 stdio 的客户端）；
// 传 --http 或设 WEAVEX_MCP_HTTP=1 时以 HTTP 模式监听本地端口（供豆包等仅支持 HTTP 连接器的客户端）。

const useHttp = process.argv.includes("--http") || process.env.WEAVEX_MCP_HTTP === "1";

watchParent();

if (useHttp) {
  const { StreamableHTTPServerTransport } = await import(
    "@modelcontextprotocol/sdk/server/streamableHttp.js"
  );
  const { default: express } = await import("express");
  const port = Number(
    process.env.WEAVEX_MCP_PORT || (isDevMode() ? 8913 : 8912),
  );
  const app = express();
  // 宽容 Accept：豆包连接器等客户端可能只声明 application/json 而未声明 text/event-stream，
  // 而 MCP SDK 对 GET/POST 都校验 Accept 必须包含 text/event-stream，会直接返回 406。
  // 这里在进入 transport 前补全缺失的媒体类型声明。
  app.use("/mcp", (req, _res, next) => {
    const accept = req.headers["accept"] || "";
    const parts = [];
    if (!accept.includes("application/json")) parts.push("application/json");
    if (!accept.includes("text/event-stream")) parts.push("text/event-stream");
    if (parts.length > 0) {
      req.headers["accept"] = (accept ? accept + ", " : "") + parts.join(", ");
    }
    next();
  });
  app.use(express.json({ limit: "10mb" }));

  // 有状态模式：每个 session 独立 transport + 独立 server 实例（SDK 要求，见 streamableHttp.js 源码注释）
  const sessions = new Map(); // sessionId -> { transport }
  const getOrCreateSession = async (sessionId) => {
    if (sessionId && sessions.has(sessionId)) return sessions.get(sessionId);
    const id = sessionId || randomUUID();
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => id,
      // POST 统一返回纯 JSON 响应（而非 SSE 流），对豆包等只按 JSON 解析的客户端最兼容
      enableJsonResponse: true,
    });
    transport.onclose = () => sessions.delete(id);
    await server.connect(transport);
    sessions.set(id, { transport });
    return sessions.get(id);
  };

  app.post("/mcp", async (req, res) => {
    try {
      const sessionId = req.headers["mcp-session-id"];
      const entry = await getOrCreateSession(sessionId);
      // express.json() 已预解析 body，必须作为第三参数传入（见 SDK 文档）
      await entry.transport.handleRequest(req, res, req.body);
    } catch (e) {
      console.error("[mcp-http] POST /mcp error:", e?.message || e);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: String(e?.message || e) },
          id: null,
        });
      }
    }
  });

  app.get("/mcp", async (req, res) => {
    try {
      const sessionId = req.headers["mcp-session-id"];
      const entry = await getOrCreateSession(sessionId);
      await entry.transport.handleRequest(req, res);
    } catch (e) {
      if (!res.headersSent) res.status(500).end();
    }
  });

  app.listen(port, "127.0.0.1", () => {
    console.log(
      `[weavex-mcp] HTTP 模式已启动，供豆包等客户端连接:\n  http://127.0.0.1:${port}/mcp`,
    );
  });
} else {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
