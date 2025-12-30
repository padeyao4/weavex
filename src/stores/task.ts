import { defineStore } from "pinia";
import { computed, reactive } from "vue";
import { useGraphStore } from "./storage";
import { GraphUtils } from "@/utils";
import { PNode } from "@/types";

export const useTaskStore = defineStore("task", () => {
  const importantTaskIds = reactive<string[]>([]);

  const graphStore = useGraphStore();

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

  return {
    importantTaskIds,
    importantTasks,
    otherTasks,
    taskList: allList,
  };
});
