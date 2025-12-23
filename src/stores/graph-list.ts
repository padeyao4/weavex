import { PGraph } from "@/types";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useGraphListStore = defineStore("graph-list", () => {
  const graphsMeta = ref<
    Pick<PGraph, "id" | "name" | "rootNodeIds" | "createdAt">[]
  >([]);

  function loadGraphList(graphs: Record<string, PGraph>) {
    graphsMeta.value = Object.values(graphs).map((graph) => ({
      id: graph.id,
      name: graph.name,
      rootNodeIds: graph.rootNodeIds,
      createdAt: graph.createdAt,
    }));
  }

  return {
    graphsMeta,
    loadGraphList,
  };
});
