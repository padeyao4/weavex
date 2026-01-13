<template>
  <router-view v-if="isInitialized" />
  <FramePage v-else>
    <div>loading...</div>
  </FramePage>
</template>
<script setup lang="ts">
import FramePage from "./components/FramePage.vue";
import { isInitialized } from "@/composables/useAppInit";
</script>
