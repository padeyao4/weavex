import { PGraph } from "@/types";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useGraphListStore = defineStore("graph-list", () => {
  const graphsMeta = ref<
    Pick<PGraph, "id" | "name" | "rootNodeIds" | "createdAt">[]
  >([]);

  return {
    graphsMeta,
  };
});
