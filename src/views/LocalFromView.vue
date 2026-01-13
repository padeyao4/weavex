<script setup lang="ts">
import FramePage from "@/components/FramePage.vue";
import { existWorkspace } from "@/composables/useAppInit";
import router from "@/router";
import { useContextStore, useGraphStore } from "@/stores";
import { open } from "@tauri-apps/plugin-dialog";
import { ref } from "vue";

const directory = ref<string | null>();
const contextStore = useContextStore();
const graphStore = useGraphStore();

const openLocalDir = async () => {
  directory.value = await open({
    multiple: false,
    directory: true,
  });
  if (directory.value) {
    contextStore.update({ workDir: directory.value });
    contextStore.save();
    existWorkspace.value = true;
    graphStore.loadGraphs();
    setTimeout(() => {
      router.push({ name: "taskSummary" });
    }, 1000);
  }
};
</script>

<template>
  <FramePage>
    <div>local repository</div>
    <div>
      <div>{{ directory }}</div>
      <el-button @click="openLocalDir">Open Directory</el-button>
    </div>
  </FramePage>
</template>
<style scoped></style>
