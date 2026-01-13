import { useContextStore, useGraphStore } from '@/stores'
import { invoke } from '@tauri-apps/api/core'
import { debug } from '@tauri-apps/plugin-log'
import { ref } from 'vue'

// 全局状态：是否已完成初始化
export const isInitialized = ref(false)
export const existWorkspace = ref(false)

export async function initializeApp() {
  debug("--- begin initialize App ---")
  if (isInitialized.value) return // 防止重复初始化
  const contextStore = useContextStore()
  const graphStore = useGraphStore()
  await contextStore.load()

  debug(`contextStore loaded path: ${JSON.stringify(contextStore.context)}`)
  existWorkspace.value = await invoke(
    "check_git_repository",
    { path: contextStore.context.workDir },
  );

  if (existWorkspace.value) {
    await graphStore.loadGraphs();
  }
  debug("--- App initialized ---")

  isInitialized.value = true
}
