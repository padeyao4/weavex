<template>
  <div class="bg-amber-100 h-screen w-full">
    <el-button @click="createTestTask">创建随机测试任务</el-button>
  </div>
</template>
<script setup lang="ts">
import { useTaskStore } from "@/store/task";
import { CNode } from "@/utils";

const taskStore = useTaskStore();

const createTestTask = () => {
  const task = CNode.generateRandomCompoundDAG();
  taskStore.add(task);
};
</script>
