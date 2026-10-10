import { onMounted, onUnmounted } from "vue";
import { listen } from "@tauri-apps/api/event";
import { useGraphStore, useNodeStore } from "@/stores";
import { debug } from "@tauri-apps/plugin-log";

/**
 * 数据同步（filesystem-first）：
 * Rust watcher 检测到外部写者（MCP 等）直写存储（weavex.db / notes/*.md）后
 * 广播 "data-changed"，这里把 store（只读缓存）重新投影到最新存储状态。
 * 窗口隐藏（托盘常驻）期间监听照跑；事件丢失时由"窗口唤回可见"兜底刷新。
 * 应用自身写库被 Rust 侧抑制（不广播），不会造成自刷新抖动。
 */
export function useDataSync() {
  const graphStore = useGraphStore();
  const noteStore = useNodeStore();
  let unlisten: (() => void) | undefined;

  const reloadAll = async () => {
    debug("[data-sync] storage changed, reloading caches");
    try {
      await graphStore.loadGraphs();
    } catch (e) {
      debug(`[data-sync] reload graphs failed: ${JSON.stringify(e)}`);
    }
    try {
      await noteStore.loadNoteMeta();
    } catch (e) {
      debug(`[data-sync] reload notes failed: ${JSON.stringify(e)}`);
    }
  };

  const onVisibility = () => {
    if (document.visibilityState === "visible") {
      reloadAll();
    }
  };

  onMounted(async () => {
    unlisten = await listen("data-changed", reloadAll);
    window.addEventListener("visibilitychange", onVisibility);
  });

  onUnmounted(() => {
    unlisten?.();
    window.removeEventListener("visibilitychange", onVisibility);
  });
}
