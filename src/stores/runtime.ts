import { defineStore } from "pinia";
import { reactive } from "vue";

export const useRuntimeStore = defineStore("runtime", () => {
  const status = reactive({
    graph: {
      loading: false,
    },
  });
  return {
    status,
  };
});
