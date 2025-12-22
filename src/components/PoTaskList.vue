<template>
  <div class="bg-blue-50 flex flex-col h-screen">
    <div class="m-4 bg-amber-300">
      <router-link :to="`/a/tasks/summery`">我的一天</router-link>
    </div>
    <hr />
    <el-scrollbar class="overflow-auto">
      <div
        v-for="meta in graphListStore.graphsMeta"
        :key="meta.id"
        class="m-4 p-2 bg-amber-500"
      >
        <router-link :to="`/a/tasks/graph/${meta.id}`">
          {{ meta.name }}
        </router-link>
      </div>
    </el-scrollbar>
    <div class="bg-blue-500 shrink-0">
      <po-create-task-button />
    </div>
  </div>
</template>

<script setup lang="ts">
import PoCreateTaskButton from "@/components/PoCreateTaskButton.vue";
import { useGraphListStore } from "@/store";
import { ElScrollbar } from "element-plus";

const graphListStore = useGraphListStore();
</script>
