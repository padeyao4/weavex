import { PGraph, PNode } from "@/types";
import { computed, reactive } from "vue";
import {
  dtoToGraph,
  deleteGraphFromDb,
  initDb,
  loadGraphsFromDb,
  migrateLegacyIfNeeded,
  toGraphMetaPatch,
  upsertGraphMetaToDb,
} from "@/lib/db";
import { debug, error } from "@tauri-apps/plugin-log";
import { getDataDir } from "@/lib/dataDir";

export type Options = {
  persist?: boolean;
  update?: boolean;
  buildRoots?: boolean;
};

/** 异步写失败只记日志，不打断 UI 操作（存储是真相源，下次广播/操作会纠正）。 */
function quiet(p: Promise<unknown>, what: string) {
  p.catch((e) => error(`${what}: ${JSON.stringify(e)}`));
}

/**
 * Graph 状态（filesystem-first 下的只读缓存）：
 * 存储（weavex.db）= 唯一真相源；UI 操作仍先改内存（响应式即时反馈），
 * 同时按操作粒度立即写库（见 nodes.ts / composite.ts 的 persist 分支）；
 * 外部写者（MCP）改库后由 Rust watcher 广播 data-changed，本 store 重新加载投影。
 * 不再有防抖全量写回，避免覆盖外部写入。
 */
export function createGraphState() {
  const allGraph = reactive<Record<string, PGraph>>({});
  let dbInitialized = false;

  function clear() {
    Object.keys(allGraph).forEach((key) => {
      delete allGraph[key];
    });
  }

  async function loadGraphs() {
    const dataDir = await getDataDir();
    if (!dbInitialized) {
      await initDb(dataDir);
      await migrateLegacyIfNeeded(dataDir);
      dbInitialized = true;
    }
    const dtos = await loadGraphsFromDb();
    clear();
    dtos.forEach((dto) => {
      allGraph[dto.id] = dtoToGraph(dto);
      buildRoots(dto.id); // 从存储投影后重算派生根列表，避免写者口径漂移
    });
    debug(`Loaded ${dtos.length} graphs from SQLite`);
  }

  const addGraph = function (graph: PGraph, options?: Options) {
    allGraph[graph.id] = graph;
    extraProcess(allGraph[graph.id], options);
  };

  const updateGraph = function (
    updates: Partial<PGraph> & Pick<PGraph, "id">,
    options?: Options,
  ) {
    if (allGraph[updates.id]) {
      allGraph[updates.id] = {
        ...allGraph[updates.id],
        ...updates,
      };
      extraProcess(allGraph[updates.id], options);
    }
  };

  const removeGraph = function (graphId: string, options?: Options) {
    if (allGraph[graphId]) {
      delete allGraph[graphId];
      extraProcess(undefined, options);
      if (options?.persist) {
        quiet(deleteGraphFromDb(graphId), `Failed to delete graph ${graphId}`);
      }
    }
  };

  const buildRoots = function (graphId: string | PGraph) {
    const graph = typeof graphId === "string" ? allGraph[graphId] : graphId;
    if (!graph) return;
    const nodeMap = new Map<string | undefined, PNode>();
    const rootIds = new Set<string>();
    const nodes = Object.values(graph.nodes);
    nodes.forEach((node) => {
      nodeMap.set(node.id, node);
      rootIds.add(node.id);
    });
    for (const node of nodes) {
      if (node.parent && nodeMap.has(node.parent)) {
        rootIds.delete(node.id);
        continue;
      }
      if (node.prevs.find((prevId) => nodeMap.has(prevId))) {
        rootIds.delete(node.id);
      }
    }
    graph.rootNodeIds = Array.from(rootIds);
  };

  const extraProcess = function (graph?: PGraph, options?: Options) {
    if (options?.buildRoots && graph) {
      buildRoots(graph.id);
    }
    if (options?.update && graph) {
      graph.updatedAt = Date.now();
    }
    if (options?.persist) {
      if (graph) {
        // 图级字段细粒度写（含 buildRoots 后的 rootNodeIds / updatedAt）
        quiet(upsertGraphMetaToDb(toGraphMetaPatch(graph)), `Failed to save graph meta ${graph.id}`);
      }
    }
  };

  const getGraph = function (graphId: string) {
    return allGraph[graphId];
  };

  const graphsMeta = computed(() => {
    return Object.values(allGraph).sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
    );
  });

  return {
    allGraph,
    clear,
    loadGraphs,
    addGraph,
    updateGraph,
    removeGraph,
    buildRoots,
    extraProcess,
    getGraph,
    graphsMeta,
  };
}
