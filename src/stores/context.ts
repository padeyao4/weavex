import { useContextStorage } from "@/lib";
import { defineStore } from "pinia";

/**
 * application的状态，有3种：
 * 待初始化，初始化中，已经初始化
 */
type Status = "pending" | "initializing" | "initialized" | "error";

export interface ContextInfo {
  status: Status;
  workDir?: string;
}

export const useContextStore = defineStore("status", () => {
  const context = useContextStorage<ContextInfo>("context.bin", {
    status: "pending",
    workDir: undefined,
  });

  function setStatus(st: Status) {
    context.value.status = st;
  }

  return {
    context,
    setStatus,
  };
});
