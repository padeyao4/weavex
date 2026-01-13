import { useContextStore, useGraphStore } from "@/stores";
import { invoke } from "@tauri-apps/api/core";
import { debug } from "@tauri-apps/plugin-log";
import { ref } from "vue";

// 全局状态：是否已完成初始化
export const isInitialized = ref(false);
export const existWorkspace = ref(false);

export const enum AppStatus {
  load_context,
  check_workspace,
  load_graphs,
}

/**
 * 1.加载context store
 * 2.检测work dir 是否存在
 * 3.加载graphs
 * @returns
 */
export async function initializeApp() {
  debug("--- begin initialize App ---");
  if (isInitialized.value) return; // 防止重复初始化
  const contextStore = useContextStore();
  await contextStore.load();

  debug(
    `contextStore loaded path: ${JSON.stringify({ ...contextStore.context, password: "***", ssh_key: "***" })}`,
  );
  existWorkspace.value = await invoke("check_directory_exists", {
    path: contextStore.context.workDir,
  });

  if (existWorkspace.value) {
    const graphStore = useGraphStore();
    await graphStore.loadGraphs();
  }
  debug("--- App initialized ---");
  isInitialized.value = true;
}
