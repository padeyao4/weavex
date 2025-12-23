<template>
    <router-view />
</template>
<script setup lang="ts">
import { useGraphsStore } from "@/store";

const graphsStore = useGraphsStore();
graphsStore.generateRandomGraph();
</script>
