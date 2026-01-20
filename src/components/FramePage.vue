<script setup lang="ts">
import WindowsTitleBar from "@/components/WindowsTitleBar.vue";
defineProps({
  class: { type: String, default: "" },
});
</script>

<template>
  <div class="h-screen w-screen" :class="class">
    <slot />
  </div>
  <teleport to="body">
    <WindowsTitleBar />
  </teleport>
</template>
