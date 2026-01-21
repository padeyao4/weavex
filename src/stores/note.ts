import { defineStore } from "pinia";
import { reactive } from "vue";
import { v4 } from "uuid";
import { useContextStore } from "./context";
import { resolve } from "@tauri-apps/api/path";
import { readFile, writeFile } from "@/utils";
import { debounce } from "lodash-es";
import { debug } from "@tauri-apps/plugin-log";

const NOTE_DIR = "notes";
const NOTE_META_FILE = "note-meta.json";

export interface NoteMeta {
  id: string;
  path?: string; // 文件存储地址
  title: string; // 笔记标题
  createdAt: number; // 创建时间
  updatedAt: number; // 更新时间
}

export const useNodeStore = defineStore("notes", () => {
  const noteMeta = reactive<Record<string, NoteMeta>>({});

  const saveMeta = async function () {
    const contextStore = useContextStore();
    const path = await resolve(contextStore.context.workDir!, NOTE_META_FILE);
    await writeFile(path, JSON.stringify(noteMeta));
  };

  const saveNote = async function (nodeId: string, content: string) {
    debug(`save note ${nodeId}`);
    const contextStore = useContextStore();
    const meta = noteMeta[nodeId];
    meta.updatedAt = Date.now();
    if (!meta.path) {
      meta.path = `${meta.id}.md`;
      saveMeta();
    }
    const path = await resolve(
      contextStore.context.workDir!,
      NOTE_DIR,
      meta.path,
    );
    await writeFile(path, content);
  };

  const debounceSaveNote = debounce(saveMeta, 5000);

  const loadNote = async function (nodeId: string) {
    const contextStore = useContextStore();
    const metaPath = noteMeta[nodeId].path;
    if (metaPath) {
      const path = await resolve(
        contextStore.context.workDir!,
        NOTE_DIR,
        metaPath,
      );
      const content = await readFile(path);
      return content;
    } else {
      return "";
    }
  };

  const loadNoteMeta = async function () {
    const contextStore = useContextStore();
    const path = await resolve(contextStore.context.workDir!, NOTE_META_FILE);
    const content = await readFile(path);
    const obj = JSON.parse(content) ?? {};
    Object.keys(obj).forEach((key) => {
      noteMeta[key] = obj[key];
    });
  };

  const clear = function () {
    Object.keys(noteMeta).forEach((key) => {
      delete noteMeta[key];
    });
  };

  const addNoteMeta = function (title: string) {
    const meta: NoteMeta = {
      id: v4(),
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    noteMeta[meta.id] = meta;
    saveMeta();
  };

  return {
    noteMeta,
    saveMeta,
    loadNoteMeta,
    saveNote,
    loadNote,
    addNoteMeta,
    debounceSaveNote,
    clear,
  };
});
