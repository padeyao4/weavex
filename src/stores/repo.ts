import { defineStore } from "pinia";
import { reactive } from "vue";
import { ContextInfo, useContextStore } from "./context";
import router from "@/router";
import { debug, info } from "@tauri-apps/plugin-log";
import { useGraphStore } from "./storage";
import { invoke } from "@tauri-apps/api/core";

export type State = "idle" | "loading" | "no_repo" | "has_repo";

type RepoProps = {
  state: State;
  error?: Error;
};

export type GitCloneOptions = {
  repo_url: string;
  target_dir: string;
  branch: string;
};

export const useRepoStore = defineStore("repo", () => {
  const repo = reactive<RepoProps>({
    state: "idle",
  });

  const validateStates = {
    idle: ["loading"],
    loading: ["no_repo", "has_repo", "loading"],
    no_repo: ["has_repo"],
    has_repo: ["no_repo"],
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
        case "no_repo":
          router.replace({ name: "LaunchView" });
          break;
        case "loading":
          router.replace({ name: "loading" });
          break;
        default:
          break;
      }
    }
  };

  const init = async function () {
    setState("loading");
    const contextStore = useContextStore();
    await contextStore.load();
    const workDirExists = await contextStore.check_work_dir();
    setState(workDirExists ? "has_repo" : "no_repo");
    if (repo.state === "has_repo") {
      const graphStore = useGraphStore();
      await graphStore.loadGraphs();
    }
  };

  const switchRepo = function () {
    const contextStore = useContextStore();
    contextStore.clear();
    const graphStore = useGraphStore();
    graphStore.clear();
    setState("no_repo");
  };

  const loadRepo = function (
    params: Partial<ContextInfo> & Pick<ContextInfo, "workDir">,
    options?: { persist?: boolean },
  ) {
    const contextStore = useContextStore();
    contextStore.switchWorkspace(params, options);
    const graphStore = useGraphStore();
    graphStore.loadGraphs();
    setState("has_repo");
  };

  /**
   * 使用git clone repository,并处理后续逻辑
   */
  const cloneRepo = async function (gitOptions: GitCloneOptions) {
    debug("开始克隆仓库: " + gitOptions.repo_url);
    debug("分支: " + gitOptions.branch);
    debug("工作目录: " + gitOptions.target_dir);

    debug("调用git_clone命令");
    const result = await invoke<string>("git_clone", {
      options: gitOptions,
    });

    info("clone success: " + result);

    // 克隆成功后，设置状态为has_repo
    const contextStore = useContextStore();
    contextStore.update(
      {
        workDir: gitOptions.target_dir,
        repositoryUrl: gitOptions.repo_url,
        branch: gitOptions.branch,
      },
      { persist: true },
    );
    setState("has_repo");
  };

  return {
    repo,
    setState,
    init,
    switchRepo,
    loadRepo,
    cloneRepo,
  };
});
