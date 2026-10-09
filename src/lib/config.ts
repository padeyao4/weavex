// 应用配置（config.json）读写：配置文件位于存储目录下。
// 启动时若存在则加载，不存在则自动生成默认配置并写回。
import { invoke } from "@tauri-apps/api/core";
import { resolve } from "@tauri-apps/api/path";
import { debug } from "@tauri-apps/plugin-log";

export interface AppConfig {
  version: number;
  theme: ThemeMode;
  testMode: boolean;
  graphAnimation: boolean;
}

/** 主题模式：亮色 / 暗色 / 跟随系统 */
export type ThemeMode = "light" | "dark" | "system";

export const CONFIG_FILE = "config.json";

export const DEFAULT_CONFIG: AppConfig = {
  version: 1,
  theme: "system",
  testMode: false,
  graphAnimation: true,
};

/**
 * 加载存储目录下的配置文件；不存在或解析失败时生成（写回）默认配置。
 */
export async function loadConfig(workDir: string): Promise<AppConfig> {
  const configPath = await resolve(workDir, CONFIG_FILE);
  const exists = await invoke<boolean>("file_exists", { path: configPath });
  if (!exists) {
    await saveConfig(workDir, DEFAULT_CONFIG);
    return { ...DEFAULT_CONFIG };
  }
  try {
    const raw = await invoke<string>("read_file", { path: configPath });
    // 容错：外部编辑器可能以带 BOM 的 UTF-8 保存，strip 掉 BOM 防止 JSON.parse 失败
    const parsed = JSON.parse((raw || "{}").replace(/^\uFEFF/, ""));
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch (e) {
    debug(`config.json parse failed, fallback to default: ${e}`);
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * 保存配置到存储目录 config.json（write_file 会自动创建缺失目录）。
 */
export async function saveConfig(
  workDir: string,
  config: AppConfig,
): Promise<void> {
  const configPath = await resolve(workDir, CONFIG_FILE);
  await invoke("write_file", {
    path: configPath,
    content: JSON.stringify(config, null, 2),
  });
}
