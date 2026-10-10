import { defineStore } from "pinia";
import { reactive } from "vue";
import { v4 } from "uuid";
import { resolve } from "@tauri-apps/api/path";
import { readFile, writeFile } from "@/utils";
import { debug, error } from "@tauri-apps/plugin-log";
import {
  initDb,
  loadNoteMetasFromDb,
  migrateLegacyIfNeeded,
  upsertNoteMetaToDb,
} from "@/lib/db";
import { getDataDir } from "@/lib/dataDir";

const NOTE_DIR = "notes";

export interface NoteMeta {
  id: string;
  path?: string; // 文件存储地址
  title: string; // 笔记标题
  createdAt: number; // 创建时间
  updatedAt: number; // 更新时间
}

export const useNodeStore = defineStore("notes", () => {
  const noteMeta = reactive<Record<string, NoteMeta>>({});
  let dbInitialized = false;

  /** 单条笔记元数据立即写库（filesystem-first：不防抖全量写回） */
  const saveMeta = async function (meta: NoteMeta) {
    try {
      const dataDir = await getDataDir();
      if (!dbInitialized) {
        await initDb(dataDir);
        dbInitialized = true;
      }
      await upsertNoteMetaToDb({
        id: meta.id,
        title: meta.title,
        path: meta.path ?? null,
        createdAt: meta.createdAt,
        updatedAt: meta.updatedAt,
      });
    } catch (e) {
      error(`save note meta failed, error is ${JSON.stringify(e)}`);
    }
  };

  const saveNote = async function (nodeId: string, content: string) {
    debug(`save note ${nodeId}`);
    const dataDir = await getDataDir();
    const meta = noteMeta[nodeId];
    meta.updatedAt = Date.now();
    if (!meta.path) {
      meta.path = `${meta.id}.md`;
    }
    await saveMeta(meta);
    const path = await resolve(dataDir, NOTE_DIR, meta.path);
    await writeFile(path, content);
  };

  const loadNote = async function (nodeId: string) {
    const dataDir = await getDataDir();
    const metaPath = noteMeta[nodeId].path;
    if (metaPath) {
      const path = await resolve(dataDir, NOTE_DIR, metaPath);
      const content = await readFile(path);
      return content;
    } else {
      return "";
    }
  };

  const loadNoteMeta = async function () {
    try {
      const dataDir = await getDataDir();
      if (!dbInitialized) {
        await initDb(dataDir);
        await migrateLegacyIfNeeded(dataDir);
        dbInitialized = true;
      }
      const metas = await loadNoteMetasFromDb();
      // 从存储重新投影：清空旧缓存，避免外部删除的笔记残留
      Object.keys(noteMeta).forEach((key) => {
        delete noteMeta[key];
      });
      metas.forEach((m) => {
        noteMeta[m.id] = {
          id: m.id,
          path: m.path ?? undefined,
          title: m.title ?? "",
          createdAt: m.createdAt ?? 0,
          updatedAt: m.updatedAt ?? 0,
        };
      });
    } catch (e) {
      error(`read note meta failed, error is ${JSON.stringify(e)}`);
    }
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
    saveMeta(meta);
  };

  return {
    noteMeta,
    saveMeta,
    loadNoteMeta,
    saveNote,
    loadNote,
    addNoteMeta,
    clear,
  };
});
