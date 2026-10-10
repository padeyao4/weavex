import { defineStore } from "pinia";
import { reactive } from "vue";
import { useConfigStore } from "./config";
import router from "@/router";
import { debug } from "@tauri-apps/plugin-log";
import { useGraphStore } from "./graph";
import { useNodeStore } from "./note";
import { initTheme } from "@/lib/theme";
import { getDataDir } from "@/lib/dataDir";

export type State = "idle" | "loading" | "has_repo";

type RepoProps = {
  state: State;
  error?: Error;
};

export const useRepoStore = defineStore("repo", () => {
  const repo = reactive<RepoProps>({
    state: "idle",
  });

  const validateStates: Record<State, State[]> = {
    idle: ["loading"],
    loading: ["has_repo", "loading"],
    has_repo: [],
  };

  const setState = (state: State, error?: Error) => {
    if (validateStates[repo.state].includes(state)) {
      debug(`Setting current state from (${repo.state}) to (${state})`);
      repo.state = state;
      repo.error = error;
      switch (state) {
        case "has_repo":
          router.replace({ name: "taskSummary" });
          break;
        case "loading":
          router.replace({ name: "loading" });
          break;
        default:
          break;
      }
    }
  };

  /**
   * 启动逻辑（本地存储）：
   * 数据固定存放于 Tauri 默认数据目录（appDataDir，按 identifier 隔离），
   * 目录下无 config.json 则自动生成默认配置。
   */
  const init = async function () {
    setState("loading");
    // 确认数据目录（appDataDir 为异步获取，先解析一次确保可用）
    const dataDir = await getDataDir();
    debug(`Using data dir: ${dataDir}`);

    // 加载（或生成）数据目录下的配置文件，并应用主题
    const configStore = useConfigStore();
    await configStore.load();
    initTheme(configStore.config.theme);

    // 加载图与笔记数据
    const graphStore = useGraphStore();
    await graphStore.loadGraphs();
    const noteStore = useNodeStore();
    await noteStore.loadNoteMeta();

    setState("has_repo");
  };

  return {
    repo,
    setState,
    init,
  };
});
