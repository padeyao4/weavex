import { defineStore } from "pinia";

export const useCountStore = defineStore("count", {
  state: () => ({
    count: 0,
  }),
  actions: {
    increment() {
      this.count++;
    },
    decrement() {
      this.count--;
    },
  },
});

export const useUserStore = defineStore("user", {
  state: () => ({
    name: "",
    email: "",
  }),
  actions: {
    setName(name: string) {
      this.name = name;
    },
    setEmail(email: string) {
      this.email = email;
    },
  },
});
