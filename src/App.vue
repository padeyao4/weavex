<template>
  <router-view />
</template>
<script setup lang="ts">
import { useGraphsStore } from "@/store";

const graphsStore = useGraphsStore();
console.log("当前存储数据量: " + graphsStore.allGraphs.length);
</script>
