<script setup lang="ts">
import WindowsTitleBar from "@/components/WindowsTitleBar.vue";
</script>

<template>
    <div class="pt-7.5 h-screen w-screen">
        <WindowsTitleBar />
        <slot />
    </div>
</template>

<style scoped></style>
