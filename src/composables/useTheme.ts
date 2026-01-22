// composables/useTheme.ts
import { ref } from "vue";

type ThemeName = "zen" | "ink" | "dawn" | "deep";
type ColorScheme = "light" | "dark";

const THEME_KEY = "note-app-theme";
const SCHEME_KEY = "note-app-color-scheme";

export function useTheme() {
  const currentTheme = ref<ThemeName>("zen");
  const colorScheme = ref<ColorScheme>("light");

  // 初始化
  const init = () => {
    const savedTheme = (localStorage.getItem(THEME_KEY) as ThemeName) || "zen";
    const savedScheme =
      (localStorage.getItem(SCHEME_KEY) as ColorScheme) || "light";

    // deep 主题强制 dark
    if (savedTheme === "deep") {
      colorScheme.value = "dark";
    } else {
      colorScheme.value = savedScheme;
    }

    currentTheme.value = savedTheme;
    applyTheme(savedTheme, colorScheme.value);
  };

  const setTheme = (theme: ThemeName) => {
    currentTheme.value = theme;
    // deep 主题自动设为 dark
    if (theme === "deep") {
      colorScheme.value = "dark";
    }
    applyTheme(theme, colorScheme.value);
    localStorage.setItem(THEME_KEY, theme);
  };

  const toggleColorScheme = () => {
    if (currentTheme.value === "deep") return; // deep 不可切换

    colorScheme.value = colorScheme.value === "light" ? "dark" : "light";
    applyTheme(currentTheme.value, colorScheme.value);
    localStorage.setItem(SCHEME_KEY, colorScheme.value);
  };

  const applyTheme = (theme: ThemeName, scheme: ColorScheme) => {
    const root = document.documentElement;
    // 清除旧主题
    root.className = "";
    // 添加新主题
    root.classList.add(`theme-${theme}`);
    if (scheme === "dark" && theme !== "deep") {
      root.classList.add("dark");
    }
  };

  init();

  return {
    currentTheme,
    colorScheme,
    setTheme,
    toggleColorScheme,
  };
}
