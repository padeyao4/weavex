<template>
  <div class="h-screen flex flex-row" style="width: calc(100% - 68px)">
    <po-task-list style="width: 250px" />
    <router-view :key="$route.fullPath" style="width: calc(100% - 250px)" />
  </div>
</template>
<script setup lang="ts">
import { useTaskStore } from "@/store/task";
import PoTaskList from "@/components/PoTaskList.vue";
const taskStore = useTaskStore();
taskStore.generateFakerTasks(20);
</script>
