import { defineStore } from "pinia";
import { CNode } from "../utils";

export const useTaskStore = defineStore("tasks", {
  state: () => ({
    tasks: [] as CNode[],
  }),
  actions: {
    add(task: CNode) {
      this.tasks.push(task);
    },
    remove(id: string) {
      this.tasks = this.tasks.filter((task) => task.id !== id);
    },
  },
  getters: {
    getTaskById: (state) => (id: string) =>
      state.tasks.find((task) => task.id === id),
  },
});
