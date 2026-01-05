import { join, resolve, documentDir } from "@tauri-apps/api/path";
import {
  exists,
  BaseDirectory,
  readTextFile,
  writeTextFile,
  mkdir,
} from "@tauri-apps/plugin-fs";
import { debug, error, info } from "@tauri-apps/plugin-log";

export class FsUtil {
  static DATA_PATH =
    import.meta.env.VITE_APP_ENV === "dev" ? "PossibleDataDev" : "PossibleData";
  static GRAPH_FILE_NAME = "graphs.json";
  static TASK_FILE_NAME = "tasks.json";
  static DEFAULT_GRAPHS = "{}";
  static DEFAULT_TASKS = "[]";

  static async exists(path: string): Promise<boolean> {
    return await exists(path, { baseDir: BaseDirectory.Document });
  }

  static async getLocalStoragePath(): Promise<string> {
    return await resolve(await documentDir(), this.DATA_PATH);
  }

  private static async ensureDataDirectory(): Promise<void> {
    if (!(await this.exists(this.DATA_PATH))) {
      debug("Data directory does not exist");
      await mkdir(this.DATA_PATH, {
        baseDir: BaseDirectory.Document,
        recursive: true,
      });
      debug("Data directory created");
    }
  }

  private static async getFilePath(fileName: string): Promise<string> {
    return await join(this.DATA_PATH, fileName);
  }

  private static async readFileWithInit(
    fileName: string,
    defaultValue: string,
  ): Promise<string> {
    await this.ensureDataDirectory();

    const path = await this.getFilePath(fileName);
    if (!(await this.exists(path))) {
      console.debug(`${fileName} does not exist`);
      try {
        await writeTextFile(path, defaultValue, {
          baseDir: BaseDirectory.Document,
        });
      } catch (e) {
        error(JSON.stringify(e));
      }
      debug(`${fileName} created`);
    }
    return await readTextFile(path, {
      baseDir: BaseDirectory.Document,
    });
  }

  private static async saveFile(fileName: string, data: string): Promise<void> {
    await this.ensureDataDirectory();

    const path = await this.getFilePath(fileName);
    try {
      info(`Saving ${fileName}...`);
      await writeTextFile(path, data, {
        baseDir: BaseDirectory.Document,
      });
      info(`Success,${fileName} saved.`);
    } catch (e) {
      error(JSON.stringify(e));
    }
  }

  static async readTaskWithInit(): Promise<string[]> {
    info("Reading task file");
    const json = await this.readFileWithInit(
      this.TASK_FILE_NAME,
      this.DEFAULT_TASKS,
    );
    return JSON.parse(json);
  }

  static async saveTask(tasks: string[]) {
    await this.saveFile(this.TASK_FILE_NAME, JSON.stringify(tasks));
  }

  static async readGraphsWithInit(): Promise<any> {
    info("Reading graph file");
    const json = await this.readFileWithInit(
      this.GRAPH_FILE_NAME,
      this.DEFAULT_GRAPHS,
    );
    return JSON.parse(json);
  }

  static async saveGraph(data: string) {
    await this.saveFile(this.GRAPH_FILE_NAME, data);
  }
}
