<template>
    <router-view v-if="contextStore.status === 'initialized'" />
    <load-view v-else />
</template>
<script setup lang="ts">
import LoadView from "@/views/LoadView.vue";
import { useContextStore } from "@/stores";
import { onMounted } from "vue";
const contextStore = useContextStore();
onMounted(async () => {
    try {
        await contextStore.initialize();
    } catch (error) {
        console.error("Error initializing:", error);
    }
});
</script>
