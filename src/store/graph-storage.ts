import { PGraph } from "@/types";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useGraphListStore = defineStore(
  "graph-storage",
  () => {
    const allGraphs = ref<Record<string, PGraph>>({});

    return {
      allGraphs,
    };
  },
  {
    persist: {
      key: "graph-storage",
      storage: localStorage,
    },
  }
);
