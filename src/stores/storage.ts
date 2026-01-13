import { PartialNode, PGraph, PNode } from "@/types";
import { defineStore } from "pinia";
import { computed, reactive } from "vue";
import { debounce, GraphUtils } from "@/utils";
import { useContextStore } from "./context";
import { readFile, writeFile } from "@/utils";
import { resolve } from "@tauri-apps/api/path";
import { debug } from "@tauri-apps/plugin-log";

const GRAPH_FILE_NAME = "graphs.json"

export const useGraphStore = defineStore("graph-storage", () => {
  const allGraph = reactive<Record<string, PGraph>>({});

  const contextStore = useContextStore();

  function clear() {
    Object.keys(allGraph).forEach((key) => {
      delete allGraph[key];
    });
  }

  async function loadGraphs() {
    const path = await resolve(contextStore.context.workDir ?? "", GRAPH_FILE_NAME)
    debug(`Loading graphs from ${path}`)
    let jsonStr = (await readFile(path)).trim()
    jsonStr = jsonStr === "" ? "{}" : jsonStr
    const obj = JSON.parse(jsonStr)
    Object.keys(obj).forEach((key) => {
      allGraph[key] = obj[key];
    });
  }

  async function saveGraphs() {
    const data = JSON.stringify(allGraph);
    if (contextStore.context.workDir) {
      await writeFile(await resolve(contextStore.context.workDir, GRAPH_FILE_NAME), data);
    }
  }

  const debouncedSave = debounce(saveGraphs, 1000);

  function addEdge(partialGraph?: Partial<PGraph>, from?: string, to?: string) {
    if (partialGraph?.id && from && to) {
      const graph = allGraph[partialGraph.id];
      GraphUtils.addEdge(graph, from, to);
    }
  }

  function addChild(
    partialGraph?: Partial<PGraph>,
    parent?: string,
    child?: string,
  ) {
    if (partialGraph?.id && parent && child) {
      const graph = allGraph[partialGraph.id];
      GraphUtils.addChild(graph, parent, child);
    }
  }

  function addNode(partialGraph?: Partial<PGraph>, node?: PNode) {
    if (partialGraph?.id && node) {
      const graph = allGraph[partialGraph.id];
      graph.nodes[node.id] = node;
      graph.rootNodeIds.push(node.id);
    }
  }

  function removeNode(partialGraph?: Partial<PGraph>, ids?: string[]) {
    if (partialGraph?.id && ids?.length) {
      const graph = allGraph[partialGraph.id];
      ids?.forEach((id) => {
        GraphUtils.removeNode(graph, id);
      });
    }
  }

  function removeEdge(
    partialGraph?: Partial<PGraph>,
    ids?: string[] | { from: string; to: string }[],
  ) {
    if (partialGraph?.id && ids?.length) {
      const graph = allGraph[partialGraph.id];
      ids?.forEach((id) => {
        const [from, to] =
          typeof id === "string" ? id.split("_", 2) : [id.from, id.to];
        GraphUtils.removeEdge(graph, from, to);
      });
    }
  }

  function updateNode(partialGraph?: Partial<PGraph>, node?: PartialNode) {
    if (partialGraph?.id && node?.id) {
      const graph = allGraph[partialGraph.id];
      if (graph.nodes[node.id]) {
        graph.nodes[node.id] = {
          ...graph.nodes[node.id],
          ...node,
          updatedAt: Date.now(),
        };
        graph.updatedAt = Date.now();
      }
    }
  }

  function addGraph(graph: PGraph) {
    allGraph[graph.id] = graph;
  }

  function updateGraph(graphId?: string, updates?: Partial<PGraph>) {
    if (graphId && updates) {
      if (allGraph[graphId]) {
        allGraph[graphId] = {
          ...allGraph[graphId],
          ...updates,
          updatedAt: Date.now(),
        };
      }
    }
  }

  function removeGraph(graphId: string) {
    if (allGraph[graphId]) {
      delete allGraph[graphId];
    }
  }

  function toggleNodeExpanded(graphId?: string, nodeId?: string) {
    if (graphId && nodeId && allGraph[graphId]) {
      const graph = allGraph[graphId];
      if (graph.nodes[nodeId]) {
        graph.nodes[nodeId].expanded = !graph.nodes[nodeId].expanded;
        graph.updatedAt = Date.now();
      }
    }
  }

  const graphsMeta = computed(() => {
    return Object.values(allGraph).sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
    );
  });

  return {
    allGraph,
    graphsMeta,
    addNode,
    addEdge,
    removeNode,
    removeEdge,
    updateNode,
    updateGraph,
    addGraph,
    removeGraph,
    loadGraphs,
    debouncedSave,
    addChild,
    toggleNodeExpanded,
    clear
  };
});
