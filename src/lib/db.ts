// SQLite 数据层的前端封装：负责与 Rust 侧 db 命令通信，
// 以及 PGraph ↔ GraphDto 之间的序列化转换。
// 数据库文件 weavex.db 位于用户选择的工作目录中。

import { invoke } from "@tauri-apps/api/core";
import { resolve } from "@tauri-apps/api/path";
import { debug } from "@tauri-apps/plugin-log";
import type { PGraph, PNode, ViewportState } from "@/types";

export const DB_FILE = "weavex.db";

// ---------------- DTO 类型（与 Rust db.rs 中 serde 结构对应） ----------------

export interface GraphDto {
  id: string;
  name?: string;
  createdAt?: number;
  updatedAt?: number;
  rootNodeIds?: string[];
  showArchive?: boolean | null;
  priority?: number | null;
  viewport?: string | null; // 画布视口 JSON（{zoom,x,y}），与 Rust GraphDto.viewport 对应
  nodes?: NodeDto[];
  edges?: EdgeDto[];
}

export interface NodeDto {
  id: string;
  name?: string;
  description?: string;
  record?: string;
  createdAt?: number;
  updatedAt?: number;
  startAt?: number;
  endAt?: number;
  parent?: string | null;
  completedAt?: number;
  completed?: boolean;
  expanded?: boolean | null;
  priority?: number | null;
  isFollowed?: boolean | null;
  isArchive?: boolean | null;
}

export interface EdgeDto {
  source: string;
  target: string;
}

export interface NoteMetaDto {
  id: string;
  title?: string;
  path?: string | null;
  createdAt?: number;
  updatedAt?: number;
}

// ---------------- 连接 ----------------

/** 打开指定数据目录（appDataDir）下的 SQLite 数据库。
 *  参数名 workDir 与 Rust 侧 db_init(work_dir) 的 camelCase 映射耦合，勿改。 */
export async function initDb(workDir: string): Promise<void> {
  if (!workDir) throw new Error("data dir is not set");
  await invoke("db_init", { workDir });
}

// ---------------- 序列化转换 ----------------

export function graphToDto(graph: PGraph): GraphDto {
  const nodes: NodeDto[] = Object.values(graph.nodes).map((n) => ({
    id: n.id,
    name: n.name,
    description: n.description,
    record: n.record,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
    startAt: n.startAt,
    endAt: n.endAt,
    parent: n.parent ?? null,
    completedAt: n.completedAt,
    completed: n.completed,
    expanded: n.expanded ?? null,
    priority: n.priority ?? null,
    isFollowed: n.isFollowed ?? null,
    isArchive: n.isArchive ?? null,
  }));

  const seen = new Set<string>();
  const edges: EdgeDto[] = [];
  for (const n of Object.values(graph.nodes)) {
    for (const next of n.nexts) {
      const key = `${n.id}\u0000${next}`;
      if (!seen.has(key)) {
        seen.add(key);
        edges.push({ source: n.id, target: next });
      }
    }
  }

  return {
    id: graph.id,
    name: graph.name,
    createdAt: graph.createdAt,
    updatedAt: graph.updatedAt,
    rootNodeIds: graph.rootNodeIds ?? [],
    showArchive: graph.showArchive ?? null,
    priority: graph.priority ?? null,
    viewport: graph.viewport ? JSON.stringify(graph.viewport) : null,
    nodes,
    edges,
  };
}

export function dtoToGraph(dto: GraphDto): PGraph {
  const nodeList = dto.nodes ?? [];
  const nodes: Record<string, PNode> = {};
  for (const n of nodeList) {
    nodes[n.id] = {
      id: n.id,
      name: n.name ?? "",
      description: n.description ?? "",
      record: n.record ?? "",
      createdAt: n.createdAt ?? 0,
      updatedAt: n.updatedAt ?? 0,
      startAt: n.startAt ?? 0,
      endAt: n.endAt ?? 0,
      parent: n.parent ?? undefined,
      children: [],
      nexts: [],
      prevs: [],
      completedAt: n.completedAt ?? 0,
      completed: n.completed ?? false,
      expanded: n.expanded ?? undefined,
      priority: n.priority ?? undefined,
      isFollowed: n.isFollowed ?? undefined,
      isArchive: n.isArchive ?? undefined,
    };
  }

  // children 由 parent_id 推导
  for (const n of nodeList) {
    if (n.parent && nodes[n.parent]) {
      nodes[n.parent].children.push(n.id);
    }
  }
  // nexts / prevs 由 edges 推导
  for (const e of dto.edges ?? []) {
    if (nodes[e.source] && nodes[e.target]) {
      nodes[e.source].nexts.push(e.target);
      nodes[e.target].prevs.push(e.source);
    }
  }

  return {
    id: dto.id,
    name: dto.name ?? "",
    createdAt: dto.createdAt ?? 0,
    updatedAt: dto.updatedAt ?? 0,
    rootNodeIds: dto.rootNodeIds ?? [],
    showArchive: dto.showArchive ?? undefined,
    priority: dto.priority ?? undefined,
    viewport: dto.viewport ? (JSON.parse(dto.viewport) as ViewportState) : undefined,
    nodes,
  };
}

// ---------------- 图数据读写 ----------------

export async function saveGraphToDb(graph: PGraph): Promise<void> {
  await invoke("db_save_graph", {
    graphJson: JSON.stringify(graphToDto(graph)),
  });
}

export async function loadGraphsFromDb(): Promise<GraphDto[]> {
  const json = await invoke<string>("db_load_graphs");
  return JSON.parse(json || "[]");
}

export async function deleteGraphFromDb(id: string): Promise<void> {
  await invoke("db_delete_graph", { id });
}

// ---------------- 细粒度写入（filesystem-first：单条命令，不整图覆盖） ----------------
// 与 Rust db.rs 的 GraphMetaPatch / NodePatch（serde camelCase）一一对应。
// 语义：只更新"调用方显式传入"的字段；parent 传 null 表示脱离父级。

export interface GraphMetaPatch {
  id: string;
  name?: string;
  priority?: number | null;
  showArchive?: boolean | null;
  viewport?: string | null; // JSON 字符串（与 GraphDto.viewport 一致）
  rootNodeIds?: string[];
  updatedAt?: number;
}

export interface NodePatch {
  id: string;
  graphId: string;
  name?: string;
  description?: string;
  record?: string;
  startAt?: number;
  endAt?: number;
  parent?: string | null; // null = 置空（脱离父级变根）；缺失 = 不更新
  completedAt?: number;
  completed?: boolean;
  expanded?: boolean;
  priority?: number | null;
  isFollowed?: boolean;
  isArchive?: boolean;
  updatedAt?: number;
}

/** 从 PGraph 提取图级补丁（filesystem-first：图行细粒度更新用）。 */
export function toGraphMetaPatch(graph: PGraph): GraphMetaPatch {
  const patch: GraphMetaPatch = {
    id: graph.id,
    name: graph.name ?? "",
    updatedAt: graph.updatedAt ?? Date.now(),
    rootNodeIds: graph.rootNodeIds ?? [],
  };
  if (graph.priority !== undefined) patch.priority = graph.priority ?? null;
  if (graph.showArchive !== undefined)
    patch.showArchive = graph.showArchive ?? null;
  if (graph.viewport !== undefined)
    patch.viewport = graph.viewport ? JSON.stringify(graph.viewport) : null;
  return patch;
}

/** 从 Partial<PNode> 提取节点补丁：仅包含调用方显式传入的字段。 */
export function toNodePatch(
  graphId: string,
  node: Omit<Partial<PNode>, "parent"> &
    Pick<PNode, "id"> & { parent?: string | null },
  updatedAt: number = Date.now(),
): NodePatch {
  const patch: NodePatch = { id: node.id, graphId, updatedAt };
  if ("name" in node) patch.name = node.name ?? "";
  if ("description" in node) patch.description = node.description ?? "";
  if ("record" in node) patch.record = node.record ?? "";
  if ("startAt" in node) patch.startAt = node.startAt ?? 0;
  if ("endAt" in node) patch.endAt = node.endAt ?? 0;
  if ("parent" in node) patch.parent = node.parent ?? null;
  if ("completedAt" in node) patch.completedAt = node.completedAt ?? 0;
  if ("completed" in node) patch.completed = node.completed ?? false;
  if ("expanded" in node) patch.expanded = node.expanded ?? false;
  if ("priority" in node) patch.priority = node.priority ?? null;
  if ("isFollowed" in node) patch.isFollowed = node.isFollowed ?? false;
  if ("isArchive" in node) patch.isArchive = node.isArchive ?? false;
  return patch;
}

export async function upsertGraphMetaToDb(patch: GraphMetaPatch): Promise<void> {
  await invoke("db_upsert_graph_meta", {
    metaJson: JSON.stringify(patch),
  });
}

export async function createNodeToDb(graphId: string, node: PNode): Promise<void> {
  await invoke("db_create_node", {
    graphId,
    nodeJson: JSON.stringify(node),
  });
}

export async function updateNodeToDb(patch: NodePatch): Promise<void> {
  await invoke("db_update_node", {
    nodeJson: JSON.stringify(patch),
  });
}

export async function deleteNodeFromDb(graphId: string, nodeId: string): Promise<number> {
  return await invoke("db_delete_node", { graphId, nodeId });
}

export async function addEdgeToDb(
  graphId: string,
  sourceId: string,
  targetId: string,
): Promise<void> {
  await invoke("db_add_edge", { graphId, sourceId, targetId });
}

export async function removeEdgeFromDb(
  graphId: string,
  sourceId: string,
  targetId: string,
): Promise<void> {
  await invoke("db_remove_edge", { graphId, sourceId, targetId });
}

// ---------------- 笔记元数据读写（正文仍是 notes/*.md 文件） ----------------

export async function loadNoteMetasFromDb(): Promise<NoteMetaDto[]> {
  const json = await invoke<string>("db_load_note_metas");
  return JSON.parse(json || "[]");
}

export async function upsertNoteMetaToDb(meta: NoteMetaDto): Promise<void> {
  await invoke("db_upsert_note_meta", {
    metaJson: JSON.stringify(meta),
  });
}

// ---------------- 旧数据迁移 ----------------

/**
 * 若工作目录存在旧版 graphs.json / note-meta.json 且尚未备份（*.bak），
 * 调用 Rust 侧 db_migrate 一次性迁入 SQLite。迁移成功后旧文件被重命名，
 * 因此该函数可安全重复调用。
 */
export async function migrateLegacyIfNeeded(workDir: string): Promise<void> {
  const legacyPath = await resolve(workDir, "graphs.json");
  const bakPath = await resolve(workDir, "graphs.json.bak");
  const legacyExists = await invoke<boolean>("file_exists", {
    path: legacyPath,
  });
  const bakExists = await invoke<boolean>("file_exists", { path: bakPath });
  if (legacyExists && !bakExists) {
    const result = await invoke<{ graphs: number; notes: number }>(
      "db_migrate",
      { workDir },
    );
    debug(`Legacy JSON data migrated to SQLite: ${JSON.stringify(result)}`);
  }
}
