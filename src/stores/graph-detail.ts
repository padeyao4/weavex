import { PGraph } from "@/types";
import { GraphUtils } from "@/utils";
import { GraphData } from "@antv/g6";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useGraphDetailStore = defineStore("graph-detail", () => {
  const currentGraphId = ref<string | null>(null);
  const currentGraph = ref<PGraph | null>(null);

  function setGraph(graph: PGraph | undefined) {
    if (graph) {
      currentGraph.value = graph;
      currentGraphId.value = graph.id;
    }
  }

  function toGraphData(): GraphData {
    if (!currentGraph.value) return {};
    else {
      return GraphUtils.toGraphData(currentGraph.value);
    }
  }

  return {
    currentGraphId,
    currentGraph,
    setGraph,
    toGraphData,
  };
});
