<script setup lang="ts">
import FramePage from "@/components/FramePage.vue";
import { useRepoStore } from "@/stores";
import { open } from "@tauri-apps/plugin-dialog";
import { ref } from "vue";

const directory = ref<string | null>();
const repoStore = useRepoStore();

const openLocalDir = async () => {
  directory.value = await open({
    multiple: false,
    directory: true,
  });
  if (directory.value) {
    repoStore.loadRepo({ workDir: directory.value }, { persist: true });
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
