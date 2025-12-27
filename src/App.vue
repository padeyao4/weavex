<template>
    <router-view />
</template>
<script setup lang="ts">
import { useContextStore } from "@/stores";

const contextStore = useContextStore();
await contextStore.initialize();
</script>
