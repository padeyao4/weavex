import { defineStore } from "pinia";
import { createNode, PNode } from "../utils";

export const useTaskStore = defineStore("tasks", {
  state: () => ({
    tasks: [] as PNode[],
  }),
  actions: {
    add(task: Partial<PNode>) {
      const node = createNode();
      const newNode = { ...node, ...task };
      this.tasks.push(newNode);
    },
    remove(id: string) {
      this.tasks = this.tasks.filter((task) => task.id !== id);
    },
    generateFakerTasks(count: number) {
      for (let i = 0; i < count; i++) {
        const task = createNode(`Task ${i + 1}`);
        this.add(task);
      }
    },
  },
  getters: {
    getTaskById: (state) => (id: string) =>
      state.tasks.find((task) => task.id === id),
  },
});
