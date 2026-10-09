// 主题管理：亮色 / 暗色 / 跟随系统。
// 通过切换 <html> 上的 .dark 类生效（Tailwind dark: 变体 + Element Plus 暗色变量共用）。

import type { ThemeMode } from "@/lib/config";
import { invoke } from "@tauri-apps/api/core";

const DARK_QUERY = "(prefers-color-scheme: dark)";

let mediaListener: MediaQueryList | null = null;
let mediaHandler: ((e: MediaQueryListEvent) => void) | null = null;

/** 同步 Windows 系统标题栏颜色到应用主题（非 Windows / 非 Tauri 环境自动忽略） */
function syncTitlebarTheme(effective: "light" | "dark"): void {
  invoke("set_titlebar_color", { theme: effective }).catch(() => {
    /* 浏览器预览或非 Windows 平台下忽略 */
  });
}

/** 解析"跟随系统"为实际明暗 */
export function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") {
    return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
  }
  return mode;
}

/** 应用主题：切换 html.dark 与 color-scheme，并维护系统主题监听 */
export function applyTheme(mode: ThemeMode): void {
  const effective = resolveTheme(mode);
  const root = document.documentElement;

  root.classList.toggle("dark", effective === "dark");
  root.style.colorScheme = effective;
  syncTitlebarTheme(effective);

  // 仅"跟随系统"时监听系统切换；其他模式下移除监听
  if (mode === "system") {
    if (!mediaListener) {
      mediaListener = window.matchMedia(DARK_QUERY);
      mediaHandler = () => applyTheme("system");
      mediaListener.addEventListener("change", mediaHandler);
    }
  } else if (mediaListener && mediaHandler) {
    mediaListener.removeEventListener("change", mediaHandler);
    mediaListener = null;
    mediaHandler = null;
  }
}

/** 启动时调用：在配置加载完成后应用主题 */
export function initTheme(mode: ThemeMode): void {
  applyTheme(mode);
}
