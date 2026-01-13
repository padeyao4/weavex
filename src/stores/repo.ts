import { defineStore } from "pinia";
import { reactive } from "vue";
import { ContextInfo, useContextStore } from "./context";
import router from "@/router";
import { debug } from "@tauri-apps/plugin-log";
import { useGraphStore } from "./storage";
import { invoke } from "@tauri-apps/api/core";

export type State = "idle" | "loading" | "no_repo" | "has_repo";

type RepoProps = {
  state: State;
  error?: Error;
};

export type GitCloneOptions = {
  repo_url: string | undefined;
  target_dir: string | undefined;
  branch: string | undefined;
  auth_method: string | undefined;
  username: string | null;
  password: string | null;
  ssh_key: string | undefined;
  commit_message: null;
  files: null;
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
   * 使用git clone repository
   */
  const cloneRepo = async function (gitOptions: GitCloneOptions) {
    await invoke<string>("git_clone", { options: gitOptions });
    // todo
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
