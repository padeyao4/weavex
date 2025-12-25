import { PGraph } from "@/types";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
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
  const allGraphs = ref<Record<string, PGraph>>({});

  const currentGraphStore = useCurrentGraphStore();

  const currentGraph = computed(() => {
    if (!currentGraphStore.currentGraphId) return undefined;
    return allGraphs.value[currentGraphStore.currentGraphId];
  });

  /**
   * Generates random graphs and adds them to the allGraphs store.
   */
  function generateRandomGraph() {
    for (let i = 0; i < 1; i++) {
      const graph = GraphUtils.generateMackGraph();
      allGraphs.value[graph.id] = graph;
    }
  }

  const graphsMeta = computed(() => {
    return Object.values(allGraphs.value).map((graph) => ({
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
  };
});
