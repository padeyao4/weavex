import { defineStore } from "pinia";
import { reactive } from "vue";

export type Config = {
  theme: string;
  testMode: boolean;
  graphAnimation: boolean;
};

export const useConfigStore = defineStore("config", () => {
  const config = reactive<Config>({
    theme: "light",
    testMode: false,
    graphAnimation: true,
  });

  return {
    config,
  };
});
