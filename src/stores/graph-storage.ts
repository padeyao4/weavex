import { PGraph, PNode } from "@/types";
import { defineStore } from "pinia";
import { computed, reactive, ref } from "vue";
import { GraphUtils, Mock } from "@/utils";

/**
 * 当前选中的图谱存储
 * 用于管理当前正在查看或编辑的图谱ID
 */
export const useCurrentGraphStore = defineStore("graph-detail", () => {
  const currentGraphId = ref<string | undefined>();

  /**
   * 设置当前图谱
   * @param graph - 图谱对象（可选），如果提供则使用其ID，否则清空当前选中
   */
  function setGraph(graph?: Partial<PGraph>) {
    currentGraphId.value = graph?.id;
  }

  return {
    currentGraphId,
    setGraph,
  };
});

export const useGraphsStore = defineStore("graph-storage", () => {
  const allGraphs = reactive<Record<string, PGraph>>({});

  const currentGraphStore = useCurrentGraphStore();

  const currentGraph = computed(() => {
    if (!currentGraphStore.currentGraphId) return undefined;
    return allGraphs[currentGraphStore.currentGraphId];
  });

  /**
   * Generates random graphs and adds them to the allGraphs store.
   */
  function generateRandomGraph() {
    for (let i = 0; i < 1; i++) {
      const graph = Mock.data01();
      allGraphs[graph.id] = graph;
    }
  }

  function addNode(partialGraph?: Partial<PGraph>, node?: PNode) {
    if (partialGraph?.id && node) {
      const graph = allGraphs[partialGraph.id];
      graph.updatedAt = Date.now();
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

  function removeEdge(partialGraph?: Partial<PGraph>, ids?: string[]) {
    if (partialGraph?.id && ids?.length) {
      const graph = allGraphs[partialGraph.id];
      ids?.forEach((id) => {
        const [from, to] = id.split("_", 2);
        GraphUtils.removeEdge(graph, from, to);
      });
    }
  }

  function addGraph(graph: PGraph) {
    allGraphs[graph.id] = graph;
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
    currentGraph,
    addNode,
    removeNode,
    removeEdge,
    addGraph,
  };
});
