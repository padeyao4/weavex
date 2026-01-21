<script setup lang="ts">
import WindowsTitleBar from "@/components/WindowsTitleBar.vue";
const props = defineProps({
  class: { type: String, default: "" },
});
</script>

<template>
  <div class="h-screen w-screen" :class="props.class">
    <slot />
  </div>
  <teleport to="body">
    <WindowsTitleBar />
  </teleport>
</template>
