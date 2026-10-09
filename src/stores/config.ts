import { defineStore } from "pinia";
import { reactive } from "vue";
import { AppConfig, DEFAULT_CONFIG, loadConfig, saveConfig, ThemeMode } from "@/lib/config";
import { useContextStore } from "./context";
import { initTheme } from "@/lib/theme";

/** 主题镜像键：index.html 内联脚本在 JS 执行前同步读取，
    保证首帧（骨架屏）颜色与用户设置一致，避免启动亮暗跳变 */
export const THEME_STORAGE_KEY = "weavex:theme";

export const useConfigStore = defineStore("config", () => {
  const config = reactive<AppConfig>({ ...DEFAULT_CONFIG });

  /**
   * 启动时调用：从当前存储目录加载配置文件，
   * 不存在时自动生成默认配置并写回 config.json。
   * 先同步用 localStorage 镜像预应用主题（避免 async 读 config.json 期间颜色跳变），
   * 再以 config.json 为权威最终应用。
   */
  const load = async function () {
    const contextStore = useContextStore();
    const workDir = contextStore.context.workDir;
    if (!workDir) return;
    // ① 同步预应用：index.html 内联脚本可能未覆盖的路径（如缓存清理后）也兜底
    const cached = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    if (cached === "light" || cached === "dark" || cached === "system") {
      initTheme(cached);
    }
    // ② config.json 权威加载
    const loaded = await loadConfig(workDir);
    Object.assign(config, loaded);
    // ③ 同步主题镜像，供下次启动首帧（骨架屏）读取；即使未修改设置也保持镜像新鲜
    localStorage.setItem(THEME_STORAGE_KEY, config.theme);
    // ④ 最终应用（幂等；config.json 的 theme 为准）
    initTheme(config.theme);
  };

  /** 保存当前配置到存储目录 config.json，并同步写主题镜像供下次启动首帧使用 */
  const save = async function () {
    const contextStore = useContextStore();
    const workDir = contextStore.context.workDir;
    if (!workDir) return;
    localStorage.setItem(THEME_STORAGE_KEY, config.theme);
    await saveConfig(workDir, { ...config });
  };

  return {
    config,
    load,
    save,
  };
});
