import { defineStore } from "pinia";
import { ref } from "vue";

export const useGraphStatusStore = defineStore("graph-status", () => {
  const playing = ref(false);

  function setPlaying(value: boolean) {
    playing.value = value;
  }

  return {
    playing,
    setPlaying,
  };
});
