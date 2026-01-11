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

/**
 * 程序上下文配置中心,用于保存程序运行时状态.
 * 数据存储在数据目录和项目目录地址分开
 */
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
