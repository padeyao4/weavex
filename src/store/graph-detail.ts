import { PGraph } from "@/types";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useListStore = defineStore("graph-detail", () => {
  const currentGraphId = ref<string | null>(null);
  const currentGraph = ref<PGraph | null>(null);

  return {
    currentGraphId,
    currentGraph,
  };
});
