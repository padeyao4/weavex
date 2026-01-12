import { defineStore } from "pinia";
import { reactive } from "vue";

export const useRuntimeStore = defineStore("runtime", () => {
  const status = reactive({
    application: {
      existWorkspace: false
    },
    graph: {
      loading: false,
    },
  });
  return {
    status,
  };
});
