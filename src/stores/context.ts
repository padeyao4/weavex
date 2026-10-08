import { invoke } from "@tauri-apps/api/core";
import { debug } from "@tauri-apps/plugin-log";
import { Store } from "@tauri-apps/plugin-store";
import { defineStore } from "pinia";
import { reactive } from "vue";

type ContextOptions = {
  persist?: boolean;
};

const dev = import.meta.env.DEV;
const contextPath = dev ? "context.dev.bin" : "context.bin";

export interface ContextInfo {
  workDir?: string;
  [key: string]: any;
}

/**
 * 程序上下文配置中心,用于保存程序运行时状态.
 * 仅保留"最近使用的本地存储目录"（workDir）指针；
 * 应用设置（主题/测试模式等）存于存储目录下的 config.json。
 */
export const useContextStore = defineStore("status", () => {
  const context = reactive<ContextInfo>({});

  const load = async () => {
    const store = await Store.load(contextPath);
    const data = (await store.get<ContextInfo>("context")) ?? {};
    Object.keys(data).forEach((key) => {
      context[key] = data[key];
    });
    debug(`Loaded context: ${JSON.stringify(context)}`);
  };

  /**
   * 更新
   * @param d
   */
  const update = function (d: Partial<ContextInfo>, options?: ContextOptions) {
    Object.keys(d).forEach((key) => {
      context[key] = d[key];
    });
    if (options?.persist) {
      save();
    }
  };

  const save = async function () {
    const store = await Store.load(contextPath);
    await store.set("context", context);
  };

  const clear = function (options?: ContextOptions) {
    Object.keys(context).forEach((key) => {
      delete context[key];
    });
    if (options?.persist) {
      save();
    }
  };

  const check_work_dir = async function () {
    return await invoke<boolean>("check_directory_exists", {
      path: context.workDir ?? "",
    });
  };

  return {
    context,
    load,
    save,
    clear,
    update,
    check_work_dir,
  };
});
