import { PGraph, PNode } from "@/types";
import { defineStore } from "pinia";
import { computed, reactive, ref } from "vue";
import { GraphUtils } from "@/utils";

export const useCurrentGraphStore = defineStore("graph-detail", () => {
  const currentGraphId = ref<string | undefined>();

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
      const graph = GraphUtils.generateMackGraph4();
      allGraphs[graph.id] = graph;
    }
  }

  function addNode(graph?: Partial<PGraph>, node?: PNode) {
    if (graph?.id && node) {
      const item = allGraphs[graph.id];
      item.updatedAt = Date.now();
      item.nodes[node.id] = node;
      if (!item.rootNodeIds.includes(node.id)) {
        item.rootNodeIds.push(node.id);
      }
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
    addGraph,
  };
});
