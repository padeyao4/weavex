import { PGraph, PNode } from "@/types";
import { defineStore } from "pinia";
import { computed, reactive, ref } from "vue";
import { debounce, GraphUtils } from "@/utils";
import { LocalFs } from "@/lib";
/**
 * 当前选中的图谱存储
 * 用于管理当前正在查看或编辑的图谱ID
 */
export const useCurrentGraphStore = defineStore("graph-detail", () => {
  const graphId = ref<string | undefined>();
  const graphStore = useGraphStore();

  const graph = computed(() => {
    if (graphId.value) {
      return graphStore.allGraph[graphId.value];
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
    graphStore.addEdge(graph.value, prevId, nextId);
  }

  function removeNode(ids?: string[]) {
    graphStore.removeNode(graph.value, ids);
  }

  function addNode(node?: PNode) {
    graphStore.addNode(graph.value, node);
  }

  function removeEdge(ids?: string[] | { from: string; to: string }[]) {
    graphStore.removeEdge(graph.value, ids);
  }

  function updateNode(node?: Partial<PNode>) {
    graphStore.updateNode(graph.value, node);
  }

  function setChildWithTravel(
    partialParent?: Partial<PNode>,
    partialChild?: Partial<PNode>,
  ) {
    graphStore.setChildWithTravel(graph.value, partialParent, partialChild);
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
    setChildWithTravel,
  };
});

/**
 * application的状态，有3种：
 * 待初始化，初始化中，已经初始化
 */
type AppStatus = "pending" | "initializing" | "initialized" | "error";

export const useContextStore = defineStore("status", () => {
  const status = ref<AppStatus>("pending");
  const graphStore = useGraphStore();

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
      await graphStore.loadGraphs(obj);
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

export const useGraphStore = defineStore("graph-storage", () => {
  const allGraph = reactive<Record<string, PGraph>>({});

  async function loadGraphs(obj: Record<string, PGraph>) {
    Object.keys(obj).forEach((key) => {
      allGraph[key] = obj[key];
    });
  }

  async function saveGraphs() {
    const data = JSON.stringify(allGraph);
    await LocalFs.save(data);
  }

  const debouncedSave = debounce(saveGraphs, 1000);

  function addEdge(partialGraph?: Partial<PGraph>, from?: string, to?: string) {
    if (partialGraph?.id && from && to) {
      const graph = allGraph[partialGraph.id];
      GraphUtils.addEdge(graph, from, to);
    }
  }

  function setChildWithTravel(
    partialGraph?: Partial<PGraph>,
    partialParent?: Partial<PNode>,
    partialChild?: Partial<PNode>,
  ) {
    if (partialGraph?.id && partialParent?.id && partialChild?.id) {
      const graph = allGraph[partialGraph.id];
      graph.rootNodeIds = graph.rootNodeIds.filter(
        (id) => id !== partialChild.id,
      );
      const parent = graph.nodes[partialParent.id];
      const child = graph.nodes[partialChild.id];
      GraphUtils.addChildWidthTravel(graph, parent, child);
    }
  }

  function addNode(partialGraph?: Partial<PGraph>, node?: PNode) {
    if (partialGraph?.id && node) {
      const graph = allGraph[partialGraph.id];
      graph.nodes[node.id] = node;
      if (!graph.rootNodeIds.includes(node.id)) {
        graph.rootNodeIds.push(node.id);
      }
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

  function updateNode(partialGraph?: Partial<PGraph>, node?: Partial<PNode>) {
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

  function updateGraph(graphId: string, updates: Partial<PGraph>) {
    if (allGraph[graphId]) {
      allGraph[graphId] = {
        ...allGraph[graphId],
        ...updates,
        updatedAt: Date.now(),
      };
    }
  }

  function removeGraph(graphId: string) {
    if (allGraph[graphId]) {
      delete allGraph[graphId];
    }
  }

  const graphsMeta = computed(() => {
    return Object.values(allGraph).map((graph) => ({
      id: graph.id,
      name: graph.name,
      createdAt: graph.createdAt,
      updatedAt: graph.updatedAt,
    }));
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
    setChildWithTravel,
  };
});
