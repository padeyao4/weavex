import { defineStore } from "pinia";
import { reactive } from "vue";
import { useContextStore } from "./context";
import { useConfigStore } from "./config";
import router from "@/router";
import { debug } from "@tauri-apps/plugin-log";
import { useGraphStore } from "./graph";
import { useNodeStore } from "./note";
import { documentDir, resolve } from "@tauri-apps/api/path";
import { initTheme } from "@/lib/theme";

export type State = "idle" | "loading" | "has_repo";

type RepoProps = {
  state: State;
  error?: Error;
};

/** 首次启动自动创建的默认存储目录名（位于用户文档目录下） */
export const DEFAULT_WORK_DIR_NAME = "WeavexData";

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
   * 启动逻辑（仅本地存储）：
   * 1. 有指针且存储目录存在 → 加载该目录；目录下无 config.json 则自动生成默认配置。
   * 2. 无指针或目录已失效 → 视为首次启动：自动创建默认存储目录
   *    （文档目录/WeavexData）并生成默认配置文件。
   */
  const init = async function () {
    setState("loading");
    const contextStore = useContextStore();
    await contextStore.load();

    let workDir = contextStore.context.workDir;
    if (workDir) {
      const exists = await contextStore.check_work_dir();
      if (!exists) {
        debug(`workDir no longer exists, treating as first launch: ${workDir}`);
        workDir = undefined;
      }
    }

    if (!workDir) {
      const docDir = await documentDir();
      workDir = await resolve(docDir, DEFAULT_WORK_DIR_NAME);
      contextStore.update({ workDir }, { persist: true });
      debug(`First launch, using default storage dir: ${workDir}`);
    }

    // 加载（或生成）存储目录下的配置文件，并应用主题
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
