import { defineStore } from "pinia";
import { computed } from "vue";
import { useGraphStore } from "./storage";
import { GraphUtils } from "@/utils";
import { PNode } from "@/types";

export const useTaskStore = defineStore("task", () => {
  const graphStore = useGraphStore();

  const importantTasks = computed(() =>
    Object.values(graphStore.allGraph)
      .flatMap((graph) => Object.values(graph.nodes))
      .filter((node) => !node.completed && node.priority),
  );

  const lowPriorityTasks = computed(() => {
    const importantTaskIds = importantTasks.value.map((node) => node.id);
    const set = new Set<string>(importantTaskIds);
    return recommendationTasks.value.filter((node) => !set.has(node.id));
  });

  /**
   * 推荐任务列表.
   */
  const recommendationTasks = computed(() => {
    return Object.values(graphStore.allGraph).flatMap((graph) => {
      return GraphUtils.traverseGraph(graph, (n, g) => {
        const prevsCompleted = n.prevs
          .map((pre) => g.nodes[pre]?.completed)
          .every((completed) => completed);
        const childrenCompleted = n.children
          .map((childId) => g.nodes[childId].completed)
          .every((completed) => completed);
        return prevsCompleted && childrenCompleted && !n.completed;
      });
    });
  });

  const allTaskMap = computed(() => {
    return Object.values(graphStore.allGraph)
      .flatMap((graph) => Object.values(graph.nodes))
      .reduce((acc, node) => {
        acc.set(node.id, node);
        return acc;
      }, new Map<string, PNode>());
  });

  function toggleTaskPriority(id: string) {
    const task = allTaskMap.value.get(id);
    if (!task) return;
    task.priority = task.priority ? 0 : 1;
  }

  function toggleTaskCompletion(id: string) {
    const task = allTaskMap.value.get(id);
    if (!task) return;
    task.completed = !task.completed;
  }

  return {
    importantTasks,
    lowPriorityTasks,
    toggleTaskPriority,
    toggleTaskCompletion,
  };
});
