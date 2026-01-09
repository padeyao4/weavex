import { FsUtil } from "@/lib";
import { defineStore } from "pinia";
import { ref } from "vue";
import { useGraphStore } from "./storage";

/**
 * application的状态，有3种：
 * 待初始化，初始化中，已经初始化
 */
type AppStatus = "pending" | "initializing" | "initialized" | "error";

export const useContextStore = defineStore("status", () => {
  const status = ref<AppStatus>("pending");
  const graphStore = useGraphStore();

  function setStatus(st: AppStatus) {
    status.value = st;
  }

  async function initialize() {
    if (status.value === "pending") {
      status.value = "initializing";
      console.log("Initializing...");
      // 读取graph json文件
      const obj = await FsUtil.readGraphsWithInit();
      // 加载graphsStore
      await graphStore.loadGraphs(obj);
      status.value = "initialized";
      console.log("Initialized");
    }
  }

  return {
    status,
    initialize,
    setStatus,
  };
});
