<template>
    <router-view v-if="contextStore.status === 'initialized'" />
    <error-view v-else-if="contextStore.status === 'error'" />
    <load-view v-else />
</template>
<script setup lang="ts">
import LoadView from "@/views/LoadView.vue";
import ErrorView from "@/views/ErrorView.vue";
import { useContextStore, useGraphStore } from "@/stores";
import { onMounted, watch } from "vue";
import { error } from "@tauri-apps/plugin-log";
const contextStore = useContextStore();
const graphStore = useGraphStore();
onMounted(async () => {
    try {
        await contextStore.initialize();
        watch([graphStore.allGraph], () => {
            graphStore.debouncedSave();
        });
    } catch (e) {
        error("Error initializing:" + JSON.stringify(e));
        contextStore.setStatus("error");
    }
});
</script>
