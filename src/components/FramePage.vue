<script setup lang="ts">
import WindowsTitleBar from "@/components/WindowsTitleBar.vue";
</script>

<template>
  <div class="h-screen w-screen pt-7.5">
    <WindowsTitleBar />
    <slot />
  </div>
</template>
