import { defineStore } from "pinia";
import { computed } from "vue";
import { useGraphStore } from "./storage";
import { GraphUtils } from "@/utils";
import { PNode } from "@/types";

export type TaskNode = PNode & { graphId: string };

export const useTaskStore = defineStore("task", () => {
  const graphStore = useGraphStore();

  const importantTasks = computed<TaskNode[]>(() =>
    Object.values(graphStore.allGraph)
      .flatMap((graph) =>
        Object.values(graph.nodes).map((node) => ({
          ...node,
          graphId: graph.id,
        })),
      )
      .filter((node) => !node.completed && node.isFollowed)
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0)),
  );

  const lowPriorityTasks = computed<TaskNode[]>(() => {
    const importantTaskIds = importantTasks.value.map((node) => node.id);
    const set = new Set<string>(importantTaskIds);
    return recommendationTasks.value
      .filter((node) => !set.has(node.id))
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  });

  /**
   * 推荐任务列表.
   */
  const recommendationTasks = computed<TaskNode[]>(() => {
    return Object.values(graphStore.allGraph).flatMap((graph) => {
      return GraphUtils.traverseGraph(graph, (n, g) => {
        const prevsCompleted = n.prevs
          .map((pre) => g.nodes[pre]?.completed)
          .every((completed) => completed);
        const childrenCompleted = n.children
          .map((childId) => g.nodes[childId].completed)
          .every((completed) => completed);
        return prevsCompleted && childrenCompleted && !n.completed;
      }).map((n) => ({
        ...n,
        graphId: graph.id,
      }));
    });
  });

  return {
    importantTasks,
    lowPriorityTasks,
  };
});
