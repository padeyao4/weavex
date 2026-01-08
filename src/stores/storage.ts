import { PGraph, PNode } from "@/types";
import { defineStore } from "pinia";
import { computed, reactive, ref } from "vue";
import { debounce, GraphUtils } from "@/utils";
import { FsUtil } from "@/lib";

export type PartialGraph = Partial<PGraph> & { id: string };
export type PartialNode = Partial<PNode> & { id: string };

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
    return GraphUtils.toGraphData(graph.value);
  });

  function buildRoots() {
    if (graph.value) {
      graph.value.rootNodeIds = GraphUtils.buildRootIds(graph.value?.nodes);
    }
  }

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

  function removeNode(ids?: string[] | string) {
    const param = typeof ids === "string" ? [ids] : ids;
    graphStore.removeNode(graph.value, param ?? []);
  }

  function addNode(node?: PNode) {
    graphStore.addNode(graph.value, node);
  }

  function removeEdge(ids?: string[] | { from: string; to: string }[]) {
    graphStore.removeEdge(graph.value, ids);
  }

  function updateNode(node?: PartialNode) {
    graphStore.updateNode(graph.value, node);
  }

  function updateGraph(partialGraph?: PartialGraph) {
    graphStore.updateGraph(graph.value?.id, partialGraph);
  }

  function addChild(parentId?: string, childId?: string) {
    graphStore.addChild(graph.value, parentId, childId);
  }

  function toggleNodeExpanded(nodeId: string) {
    graphStore.toggleNodeExpanded(graph.value?.id, nodeId);
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
    updateGraph,
    addChild,
    toggleNodeExpanded,
    buildRoots,
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
    await FsUtil.saveGraph(data);
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
    addChild,
    toggleNodeExpanded,
  };
});
