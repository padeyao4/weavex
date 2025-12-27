<template>
    <router-view v-if="contextStore.status === 'initialized'" />
    <error-view v-else-if="contextStore.status === 'error'" />
    <load-view v-else />
</template>
<script setup lang="ts">
import LoadView from "@/views/LoadView.vue";
import ErrorView from "@/views/ErrorView.vue";
import { useContextStore, useGraphsStore } from "@/stores";
import { onMounted, watch } from "vue";
const contextStore = useContextStore();
const graphsStore = useGraphsStore();
onMounted(async () => {
    try {
        await contextStore.initialize();
        watch([graphsStore.allGraphs], () => {
            graphsStore.debouncedSave();
        });
    } catch (error) {
        console.error("Error initializing:", error);
        contextStore.setStatus("error");
    }
});
</script>
