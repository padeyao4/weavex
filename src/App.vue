<template>
  <router-view />
</template>
<script setup lang="ts">
import { onMounted } from "vue";
import { useRepoStore } from "./stores/repo";
const repoStore = useRepoStore();

onMounted(() => {
  repoStore.init();
});
</script>
