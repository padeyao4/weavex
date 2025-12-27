<template>
    <div class="h-screen flex flex-row" style="width: calc(100% - 64px)">
        <task-list style="width: 256px" />
        <router-view :key="$route.fullPath" style="width: calc(100% - 256px)" />
    </div>
</template>
<script setup lang="ts">
import TaskList from "./TaskList.vue";
</script>
