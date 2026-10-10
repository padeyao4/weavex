// 应用数据目录（Tauri 默认地址）：
//   dev  → AppData\Roaming\dev.padeyao4.weavex
//   prod → AppData\Roaming\padeyao4.weavex
// identifier 分离后，dev/prod 天然使用不同目录，数据互不干扰。
// 所有业务数据（weavex.db / config.json / notes）统一存放于此。
import { appDataDir } from "@tauri-apps/api/path";

export async function getDataDir(): Promise<string> {
  return await appDataDir();
}
