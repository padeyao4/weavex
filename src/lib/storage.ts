import { join } from "@tauri-apps/api/path";
import {
  exists,
  BaseDirectory,
  readTextFile,
  writeTextFile,
  mkdir,
} from "@tauri-apps/plugin-fs";

export class LocalFs {
  static DATA_PATH = "PossibleData";
  static GRAPH_FILE_NAME = "graphs.json";
  static DEFAULT_GRAPHS = "{}";

  static async exists(path: string): Promise<boolean> {
    return await exists(path, { baseDir: BaseDirectory.Document });
  }

  static async readGraphsWithInit(): Promise<any> {
    console.info("Reading graph file");
    if (!(await this.exists(this.DATA_PATH))) {
      console.debug("Data directory does not exist");
      await mkdir(this.DATA_PATH, {
        baseDir: BaseDirectory.Document,
        recursive: true,
      });
      console.debug("Data directory created");
    }

    const path = await join(this.DATA_PATH, this.GRAPH_FILE_NAME);
    if (!(await this.exists(path))) {
      // 当文件不存在时,写入默认配置
      console.debug("Graph file does not exist");
      try {
        await writeTextFile(path, this.DEFAULT_GRAPHS, {
          baseDir: BaseDirectory.Document,
        });
      } catch (e) {
        console.error(e);
      }
      console.debug("Graph file created");
    }
    const json = await readTextFile(path, {
      baseDir: BaseDirectory.Document,
    });
    console.debug("Graph file read: " + json);
    return JSON.parse(json);
  }

  static async save(data: string) {
    if (!(await this.exists(this.DATA_PATH))) {
      console.debug("Data directory does not exist");
      await mkdir(this.DATA_PATH, {
        baseDir: BaseDirectory.Document,
        recursive: true,
      });
      console.debug("Data directory created");
    }

    const path = await join(this.DATA_PATH, this.GRAPH_FILE_NAME);
    try {
      console.info("Saving graph file...");
      await writeTextFile(path, data, {
        baseDir: BaseDirectory.Document,
      });
      console.info("Success,Graph file saved.");
    } catch (e) {
      console.error(e);
    }
  }
}
