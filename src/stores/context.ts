import { invoke } from "@tauri-apps/api/core";
import { debug } from "@tauri-apps/plugin-log";
import { Store } from "@tauri-apps/plugin-store";
import { defineStore } from "pinia";
import { reactive } from "vue";

type ContextOptions = {
  persist?: boolean;
};

export interface ContextInfo {
  workDir?: string;
  branch?: string;
  username?: string;
  email?: string;
  password?: string;
  autoCommit?: boolean;
  autoPush?: boolean;
  autoPull?: boolean;
  repositoryUrl?: string;
  [key: string]: any;
}

/**
 * 程序上下文配置中心,用于保存程序运行时状态.
 * 数据存储在数据目录和项目目录地址分开
 */
export const useContextStore = defineStore("status", () => {
  const context = reactive<ContextInfo>({});

  const load = async () => {
    const store = await Store.load("context.bin");
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
    const store = await Store.load("context.bin");
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

  /**
   * 切换工作目录
   */
  const switchWorkspace = function (
    param: Partial<ContextInfo> & Pick<ContextInfo, "workDir">,
    options?: ContextOptions,
  ) {
    clear();
    update(param);
    process(options);
  };

  const check_work_dir = async function () {
    return await invoke<boolean>("check_directory_exists", {
      path: context.workDir ?? "",
    });
  };

  const process = function (options?: ContextOptions) {
    if (options?.persist) {
      save();
    }
  };

  return {
    context,
    load,
    save,
    clear,
    update,
    switchWorkspace,
    check_work_dir,
  };
});
