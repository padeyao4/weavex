<script setup lang="ts">
import WindowsTitleBar from "@/components/WindowsTitleBar.vue";
</script>

<template>
  <div class="h-screen w-screen">
    <slot />
  </div>
  <teleport to="body">
    <WindowsTitleBar />
  </teleport>
</template>
