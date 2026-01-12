<template>
  <router-view />
</template>
<script setup lang="ts">
import { useGraphStore, useRuntimeStore } from "@/stores";
import { error } from "@tauri-apps/plugin-log";
import { onBeforeMount, watch } from "vue";
import { router } from "./router";

const runtimeStore = useRuntimeStore();
const { status } = runtimeStore;
const graphStore = useGraphStore();

watch(
  () => status.application.existWorkspace,
  async (newVal) => {
    if (newVal) {
      try {
        runtimeStore.status.graph.loading = true;
        await graphStore.loadGraphs();
      } catch (err) {
        error(JSON.stringify(err));
      } finally {
        runtimeStore.status.graph.loading = false;
      }
    }
  },
);

watch([graphStore.allGraph], () => {
  if (!runtimeStore.status.graph.loading) {
    graphStore.debouncedSave();
  }
});

onBeforeMount(() => {
  // todo 判断是否存在workspace
  if (!status.application.existWorkspace) {
    router.push({ name: "launch" });
  }
});
</script>
