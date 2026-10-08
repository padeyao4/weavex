import { defineStore } from "pinia";
import { reactive } from "vue";
import { AppConfig, DEFAULT_CONFIG, loadConfig, saveConfig } from "@/lib/config";
import { useContextStore } from "./context";

export const useConfigStore = defineStore("config", () => {
  const config = reactive<AppConfig>({ ...DEFAULT_CONFIG });

  /**
   * 启动时调用：从当前存储目录加载配置文件，
   * 不存在时自动生成默认配置并写回 config.json。
   */
  const load = async function () {
    const contextStore = useContextStore();
    const workDir = contextStore.context.workDir;
    if (!workDir) return;
    const loaded = await loadConfig(workDir);
    Object.assign(config, loaded);
  };

  /** 保存当前配置到存储目录 config.json */
  const save = async function () {
    const contextStore = useContextStore();
    const workDir = contextStore.context.workDir;
    if (!workDir) return;
    await saveConfig(workDir, { ...config });
  };

  return {
    config,
    load,
    save,
  };
});
