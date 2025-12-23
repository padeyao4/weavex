import { PGraph } from "@/types";
import { defineStore } from "pinia";
import { ref } from "vue";
import { GraphUtils } from "@/utils";

export const useGraphsStore = defineStore("graph-storage", () => {
  const allGraphs = ref<Record<string, PGraph>>({});

  /**
   * Generates random graphs and adds them to the allGraphs store.
   */
  function generateRandomGraph() {
    for (let i = 0; i < 10; i++) {
      const graph = GraphUtils.randomSampleGraph();
      allGraphs.value[graph.id] = graph;
    }
  }

  return {
    allGraphs,
    generateRandomGraph,
  };
});
