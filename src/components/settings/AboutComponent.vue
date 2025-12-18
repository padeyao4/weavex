<script setup lang="ts">
import { onMounted, ref } from "vue";
import SettingsItem from "./SettingsItem.vue";

const version = import.meta.env.VITE_APP_VERSION;
const author = import.meta.env.VITE_APP_AUTHOR;

const backendVersion = ref("");

onMounted(() => {});
</script>
<template>
  <SettingsItem>
    <template #title>关于</template>
    <template #description>
      <div>当前版本: {{ version }}-{{ backendVersion }}</div>
      <div>联系方式: {{ author }}</div>
    </template>
  </SettingsItem>
</template>
