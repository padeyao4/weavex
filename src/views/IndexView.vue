<template>
  <div class="h-screen w-screen flex flex-row">
    <po-navbar />
    <router-view />
  </div>
</template>
<script setup lang="ts">
import PoNavbar from "@/components/PoNavbar.vue";
</script>
