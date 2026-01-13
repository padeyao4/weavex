<template>
  <router-view v-if="isInitialized" />
  <FramePage v-else>
    <div>loading...</div>
  </FramePage>
</template>
<script setup lang="ts">
import FramePage from "./components/FramePage.vue";
import { isInitialized } from "@/composables/useAppInit";
import { watch } from "vue";
import { useGraphStore } from "@/stores";
import { debug } from "@tauri-apps/plugin-log";
const graphStore = useGraphStore();

watch([graphStore.allGraph], () => {
  debug("save graphs, allGraph has changed");
  graphStore.debouncedSave();
});
</script>
