import { join, resolve, documentDir } from "@tauri-apps/api/path";
import {
  exists,
  BaseDirectory,
  readTextFile,
  writeTextFile,
  mkdir,
} from "@tauri-apps/plugin-fs";

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
      console.debug("Data directory does not exist");
      await mkdir(this.DATA_PATH, {
        baseDir: BaseDirectory.Document,
        recursive: true,
      });
      console.debug("Data directory created");
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
        console.error(e);
      }
      console.debug(`${fileName} created`);
    }
    return await readTextFile(path, {
      baseDir: BaseDirectory.Document,
    });
  }

  private static async saveFile(fileName: string, data: string): Promise<void> {
    await this.ensureDataDirectory();

    const path = await this.getFilePath(fileName);
    try {
      console.info(`Saving ${fileName}...`);
      await writeTextFile(path, data, {
        baseDir: BaseDirectory.Document,
      });
      console.info(`Success,${fileName} saved.`);
    } catch (e) {
      console.error(e);
    }
  }

  static async readTaskWithInit(): Promise<string[]> {
    console.info("Reading task file");
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
    console.info("Reading graph file");
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
