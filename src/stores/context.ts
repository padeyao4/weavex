import { Store } from "@tauri-apps/plugin-store";
import { defineStore } from "pinia";
import { reactive } from "vue";

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
  [key: string]: any;
}

/**
 * 程序上下文配置中心,用于保存程序运行时状态.
 * 数据存储在数据目录和项目目录地址分开
 */
export const useContextStore = defineStore("status", () => {
  const context = reactive<ContextInfo>({})

  const load = async () => {
    const store = await Store.load("context.bin")
    const data = (await store.get<ContextInfo>("context")) ?? {}
    Object.keys(data).forEach((key) => {
      context[key] = data[key];
    });
  }

  const save = async () => {
    const store = await Store.load("context.bin")
    await store.set("context", context)
  }

  return {
    context,
    load,
    save
  };
});
