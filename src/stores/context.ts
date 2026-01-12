import { useContextStorage } from "@/lib";
import { defineStore } from "pinia";

export interface ContextInfo {
  workDir?: string;
  branch?: string;
  username?: string;
  email?: string;
  password?: string;
  autoCommit?: boolean;
  autoPush?: boolean;
  autoPull?: boolean;
  repositoryUrl?: string,
  authMethod?: "password" | "ssh_key", // password 或 ssh_key
  sshKey?: string,
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
