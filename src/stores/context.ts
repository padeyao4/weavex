import { useContextStorage } from "@/lib";
import { defineStore } from "pinia";

export interface ContextInfo {
  workDir?: string;
  repository?: string; // git远程地址
  branch?: string;
  username?: string;
  email?: string;
  password?: string;
  token?: string;
  authMethod?: "token" | "password";
  autoCommit?: boolean;
  autoPush?: boolean;
  autoPull?: boolean;
  existsWorkspace?: boolean; // 是否存在工作目录,通过该参数决定git地址配置
}

/**
 * 程序上下文配置中心,用于保存程序运行时状态.
 * 数据存储在数据目录和项目目录地址分开
 */
export const useContextStore = defineStore("status", () => {
  const context = useContextStorage<ContextInfo>("context.bin", {});

  return {
    context,
  };
});
