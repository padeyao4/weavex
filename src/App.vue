<template>
    <template v-if="context.workDir">
        <router-view v-if="context.status === 'initialized'" />
        <error-view v-else-if="context.status === 'error'" />
        <load-view v-else />
    </template>
    <selection-view v-else />
</template>
<script setup lang="ts">
import LoadView from "@/views/LoadView.vue";
import ErrorView from "@/views/ErrorView.vue";
import { useContextStore, useGraphStore } from "@/stores";
import { onMounted, watch } from "vue";
import { error, info } from "@tauri-apps/plugin-log";
import { FsUtil } from "./lib";
import { measureTime } from "./utils";
import SelectionView from "./views/SelectionView.vue";

const contextStore = useContextStore();
const { context } = contextStore;
const graphStore = useGraphStore();

async function initialize() {
    if (context.status === "pending") {
        context.status = "initializing";
        info("Initializing...");
        // 读取graph json文件
        const obj = await FsUtil.readGraphsWithInit();
        // 加载graphsStore
        await graphStore.loadGraphs(obj);
        context.status = "initialized";
        info("Initialized");
    }
}

onMounted(async () => {
    try {
        measureTime(async () => {
            await initialize();
        });
        watch([graphStore.allGraph], () => {
            graphStore.debouncedSave();
        });
    } catch (e) {
        error("Error initializing:" + JSON.stringify(e));
        contextStore.setStatus("error");
    }
});
</script>
