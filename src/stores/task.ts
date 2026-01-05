import { defineStore } from "pinia";
import { computed, reactive } from "vue";
import { useGraphStore } from "./storage";
import { GraphUtils, debounce } from "@/utils";
import { PNode } from "@/types";
import { FsUtil } from "@/lib";

export const useTaskStore = defineStore("task", () => {
  const importantTaskIds = reactive<string[]>([]);

  const graphStore = useGraphStore();

  async function loadTasks(taskIds: string[]) {
    taskIds.forEach((id) => {
      importantTaskIds.push(id);
    });
  }

  /**
   * 任务ID到任务对象的映射表
   * 用于快速通过ID查找任务
   */
  const taskMap = computed(() => {
    const map: Record<string, PNode> = {};
    allList.value.forEach((task) => {
      map[task.id] = task;
    });
    return map;
  });

  const importantTasks = computed(() => {
    return importantTaskIds
      .map((id) => taskMap.value[id])
      .filter((task) => task && !task.completed);
  });

  const otherTasks = computed(() => {
    return Object.values(allList.value).filter(
      (task) => !importantTaskIds.includes(task.id),
    );
  });

  /**
   * 可用执行的任务列表,无须状态
   */
  const allList = computed(() => {
    return Object.values(graphStore.allGraph).flatMap((graph) => {
      return GraphUtils.traverseGraph(graph, (n, g) => {
        const prevsCompleted = n.prevs
          .map((pre) => g.nodes[pre].completed)
          .every((completed) => completed);
        const childrenCompleted = n.children
          .map((childId) => g.nodes[childId].completed)
          .every((completed) => completed);
        return prevsCompleted && childrenCompleted && !n.completed;
      });
    });
  });

  function toggleImportant(taskId: string) {
    if (importantTaskIds.includes(taskId)) {
      importantTaskIds.splice(importantTaskIds.indexOf(taskId), 1);
    } else {
      importantTaskIds.push(taskId);
    }
    debouncedSave();
  }

  function clearInvalidTasks() {
    // 当importantTaskIds不在allTasks中时，清除无效任务
    const allTaskIds = new Set(allList.value.map((task) => task.id));
    for (let i = importantTaskIds.length - 1; i >= 0; i--) {
      if (!allTaskIds.has(importantTaskIds[i])) {
        importantTaskIds.splice(i, 1);
      }
    }
  }

  async function saveTasks() {
    await FsUtil.saveTask(importantTaskIds);
  }

  const debouncedSave = debounce(saveTasks, 1000);

  return {
    importantTaskIds,
    importantTasks,
    otherTasks,
    allList,
    toggleImportant,
    clearInvalidTasks,
    loadTasks,
    saveTasks,
    debouncedSave,
  };
});
