<template>
    <div class="h-screen w-screen flex flex-row">
        <nav-list />
        <router-view />
    </div>
</template>
<script setup lang="ts">
import NavList from "./NavList.vue";
</script>
