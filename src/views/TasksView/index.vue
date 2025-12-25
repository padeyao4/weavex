<template>
    <div class="h-screen flex flex-row" style="width: calc(100% - 68px)">
        <task-list style="width: 250px" />
        <router-view :key="$route.fullPath" style="width: calc(100% - 250px)" />
    </div>
</template>
<script setup lang="ts">
import TaskList from "./TaskList.vue";
</script>
