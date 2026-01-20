import { defineStore } from "pinia";
import { reactive } from "vue";
import { v4 } from "uuid";

export interface NoteMeta {
  id: string;
  path?: string; // 文件存储地址
  title: string; // 笔记标题
  createdAt: number; // 创建时间
  updatedAt: number; // 更新时间
}

export const useNodeStore = defineStore("notes", () => {
  const noteMeta = reactive<Record<string, NoteMeta>>({});

  const saveMeta = function () {
    // todo
  };

  const saveNote = function () {};

  const readNote = function () {};

  const readNoteMeta = function () {};

  const addNoteMeta = function (title: string) {
    const meta: NoteMeta = {
      id: v4(),
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    noteMeta[meta.id] = meta;
  };

  return {
    noteMeta,
    saveMeta,
    readNoteMeta,
    saveNote,
    readNote,
    addNoteMeta,
  };
});
