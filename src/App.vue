<template>
    <router-view />
</template>
<script setup lang="ts">
import { useContextStore, useGraphStore, useRuntimeStore } from "@/stores";
import { error } from "@tauri-apps/plugin-log";
import { onBeforeMount, watch } from "vue";
import { router } from "./router";

const runtimeStore = useRuntimeStore();
const contextStore = useContextStore();
const { context } = contextStore;
const graphStore = useGraphStore();

watch(
    () => context.existsWorkspace,
    async (newVal) => {
        if (newVal) {
            try {
                runtimeStore.status.graph.loading = true;
                await graphStore.loadGraphs();
            } catch (err) {
                error(JSON.stringify(err));
            } finally {
                runtimeStore.status.graph.loading = false;
            }
        }
    },
);

watch([graphStore.allGraph], () => {
    if (!runtimeStore.status.graph.loading) {
        graphStore.debouncedSave();
    }
});

onBeforeMount(() => {
    if (!context.existsWorkspace) {
        router.push({ name: "launch" });
    }
});
</script>
