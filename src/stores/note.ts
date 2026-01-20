import { defineStore } from "pinia";
import { reactive } from "vue";

export interface Note {
  id: string;
  path: string; // 文件存储地址
  title: string; // 笔记标题
  createdAt: number; // 创建时间
  updatedAt: number; // 更新时间
}

export const useNodeStore = defineStore("notes", () => {
  const noteMeta = reactive<Record<string, Note>>({});

  const saveMeta = function () {
    // todo
  };

  const saveNote = function () {};

  const readNote = function () {};

  const readNoteMeta = function () {};

  return {
    noteMeta,
    saveMeta,
    readNoteMeta,
    saveNote,
    readNote,
  };
});
