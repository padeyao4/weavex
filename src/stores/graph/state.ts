import { PGraph, PNode } from "@/types";
import { computed, reactive } from "vue";
import {
  dtoToGraph,
  deleteGraphFromDb,
  initDb,
  loadGraphsFromDb,
  migrateLegacyIfNeeded,
  saveGraphToDb,
} from "@/lib/db";
import { debug, error } from "@tauri-apps/plugin-log";
import { debounce } from "lodash-es";
import { getDataDir } from "@/lib/dataDir";

export type Options = {
  persist?: boolean;
  update?: boolean;
  buildRoots?: boolean;
};

/**
 * Graph 状态与数据层：allGraph 内存态 + 图级 CRUD + SQLite 持久化。
 * 不包含节点/边的具体业务操作（见 nodes.ts / composite.ts）。
 */
export function createGraphState() {
  const allGraph = reactive<Record<string, PGraph>>({});

  function clear() {
    Object.keys(allGraph).forEach((key) => {
      delete allGraph[key];
    });
  }

  async function loadGraphs() {
    const dataDir = await getDataDir();
    await initDb(dataDir);
    await migrateLegacyIfNeeded(dataDir);
    const dtos = await loadGraphsFromDb();
    dtos.forEach((dto) => {
      allGraph[dto.id] = dtoToGraph(dto);
    });
    debug(`Loaded ${dtos.length} graphs from SQLite`);
  }

  async function saveGraphs() {
    try {
      for (const graph of Object.values(allGraph)) {
        await saveGraphToDb(graph);
      }
      debug(`Saved ${Object.keys(allGraph).length} graphs to SQLite`);
    } catch (e) {
      error(`Failed to save graphs to SQLite: ${JSON.stringify(e)}`);
    }
  }

  const debouncedSave = debounce(saveGraphs, 1000);

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
        deleteGraphFromDb(graphId).catch((e) => {
          error(
            `Failed to delete graph ${graphId} from SQLite: ${JSON.stringify(e)}`,
          );
        });
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
      saveGraphs();
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
    saveGraphs,
    debouncedSave,
    addGraph,
    updateGraph,
    removeGraph,
    buildRoots,
    extraProcess,
    getGraph,
    graphsMeta,
  };
}
