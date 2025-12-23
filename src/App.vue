<template>
    <router-view />
</template>
<script setup lang="ts">
import { useGraphsStore } from "@/stores";

const graphsStore = useGraphsStore();
graphsStore.generateRandomGraph();
</script>
