import { join } from "@tauri-apps/api/path";
import { exists, BaseDirectory, readTextFile } from "@tauri-apps/plugin-fs";

export class LocalFs {
  static DATA_PATH = "PossibleData";
  static GRAPH_FILE_NAME = "graphs.json";

  static async exists(path: string): Promise<boolean> {
    return await exists(path, { baseDir: BaseDirectory.Document });
  }

  static async read(fileName: string): Promise<string | undefined> {
    const path = await join(this.DATA_PATH, fileName);
    try {
      return await readTextFile(path, { baseDir: BaseDirectory.Document });
    } catch (error) {
      console.error(`Error reading file ${path}:`, error);
    }
  }
  
  static async readGraphs(): Promise<any> {
    const path = await join(this.DATA_PATH, this.GRAPH_FILE_NAME);
    const json = await readTextFile(path, { baseDir: BaseDirectory.Document });
    return JSON.parse(json);
  }
}
