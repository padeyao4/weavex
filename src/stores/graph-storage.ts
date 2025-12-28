import { PGraph, PNode } from "@/types";
import { defineStore } from "pinia";
import { computed, reactive, ref } from "vue";
import { debounce, GraphUtils, Mock } from "@/utils";
import { LocalFs } from "@/lib";
/**
 * 当前选中的图谱存储
 * 用于管理当前正在查看或编辑的图谱ID
 */
export const useCurrentGraphStore = defineStore("graph-detail", () => {
  const graphId = ref<string | undefined>();
  const graphsStore = useGraphsStore();

  const graph = computed(() => {
    if (graphId.value) {
      return graphsStore.allGraphs[graphId.value];
    }
  });

  const graphData = computed(() => {
    return GraphUtils.toGraphData(graph.value ?? {});
  });

  /**
   * 设置当前图谱
   * @param graph - 图谱对象（可选），如果提供则使用其ID，否则清空当前选中
   */
  function setGraph(graph?: Partial<PGraph>) {
    graphId.value = graph?.id;
  }

  function addEdge(prevId?: string, nextId?: string) {
    graphsStore.addEdge(graph.value, prevId, nextId);
  }

  function removeNode(ids?: string[]) {
    graphsStore.removeNode(graph.value, ids);
  }

  function addNode(node?: PNode) {
    graphsStore.addNode(graph.value, node);
  }

  function removeEdge(ids?: string[] | { from: string; to: string }[]) {
    graphsStore.removeEdge(graph.value, ids);
  }

  function updateNode(node?: Partial<PNode>) {
    graphsStore.updateNode(graph.value, node);
  }

  return {
    graphId,
    graph,
    setGraph,
    graphData,
    addEdge,
    removeNode,
    addNode,
    removeEdge,
    updateNode,
  };
});

/**
 * application的状态，有3种：
 * 待初始化，初始化中，已经初始化
 */
type AppStatus = "pending" | "initializing" | "initialized" | "error";

export const useContextStore = defineStore("status", () => {
  const status = ref<AppStatus>("pending");
  const graphsStore = useGraphsStore();

  function setStatus(st: AppStatus) {
    status.value = st;
  }

  async function initialize() {
    if (status.value === "pending") {
      status.value = "initializing";
      console.log("Initializing...");
      // 读取graph json文件
      const obj = await LocalFs.readGraphsWithInit();
      console.log(obj);
      // 加载graphsStore
      await graphsStore.loadGraphs(obj);
      status.value = "initialized";
      console.log("Initialized");
    }
  }

  return {
    status,
    initialize,
    setStatus,
  };
});

export const useGraphsStore = defineStore("graph-storage", () => {
  const allGraphs = reactive<Record<string, PGraph>>({});

  // const currentGraphStore = useCurrentGraphStore();

  async function loadGraphs(obj: Record<string, PGraph>) {
    Object.keys(obj).forEach((key) => {
      allGraphs[key] = obj[key];
    });
  }

  // const currentGraph = computed(() => {
  //   if (!currentGraphStore.currentGraphId) return undefined;
  //   return allGraphs[currentGraphStore.currentGraphId];
  // });

  /**
   * Generates random graphs and adds them to the allGraphs store.
   */
  function generateRandomGraph() {
    for (let i = 0; i < 1; i++) {
      const graph = Mock.data01();
      allGraphs[graph.id] = graph;
    }
  }

  async function saveGraphs() {
    const data = JSON.stringify(allGraphs);
    await LocalFs.save(data);
  }

  const debouncedSave = debounce(saveGraphs, 1000);

  function addEdge(partialGraph?: Partial<PGraph>, from?: string, to?: string) {
    if (partialGraph?.id && from && to) {
      const graph = allGraphs[partialGraph.id];
      GraphUtils.addEdge(graph, from, to);
    }
  }

  function addNode(partialGraph?: Partial<PGraph>, node?: PNode) {
    if (partialGraph?.id && node) {
      const graph = allGraphs[partialGraph.id];
      graph.nodes[node.id] = node;
      if (!graph.rootNodeIds.includes(node.id)) {
        graph.rootNodeIds.push(node.id);
      }
    }
  }

  function removeNode(partialGraph?: Partial<PGraph>, ids?: string[]) {
    if (partialGraph?.id && ids?.length) {
      const graph = allGraphs[partialGraph.id];
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
      const graph = allGraphs[partialGraph.id];
      ids?.forEach((id) => {
        const [from, to] =
          typeof id === "string" ? id.split("_", 2) : [id.from, id.to];
        GraphUtils.removeEdge(graph, from, to);
      });
    }
  }

  function updateNode(partialGraph?: Partial<PGraph>, node?: Partial<PNode>) {
    if (partialGraph?.id && node?.id) {
      const graph = allGraphs[partialGraph.id];
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
    allGraphs[graph.id] = graph;
  }

  function updateGraph(graphId: string, updates: Partial<PGraph>) {
    if (allGraphs[graphId]) {
      allGraphs[graphId] = {
        ...allGraphs[graphId],
        ...updates,
        updatedAt: Date.now(),
      };
    }
  }

  function removeGraph(graphId: string) {
    if (allGraphs[graphId]) {
      delete allGraphs[graphId];
      // 如果删除的是当前选中的graph，清空当前选中
      // if (currentGraphStore.currentGraphId === graphId) {
      //   currentGraphStore.setGraph();
      // }
    }
  }

  const graphsMeta = computed(() => {
    return Object.values(allGraphs).map((graph) => ({
      id: graph.id,
      name: graph.name,
      createdAt: graph.createdAt,
      updatedAt: graph.updatedAt,
    }));
  });

  return {
    allGraphs,
    generateRandomGraph,
    graphsMeta,
    // currentGraph,
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
  };
});
