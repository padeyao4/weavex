<script setup lang="ts"></script>

<template>
  <div
    class="h-full w-64 rounded-tl-lg border-r border-border bg-sidebar"
    @contextmenu.prevent
  >
    <slot></slot>
  </div>
</template>

<style lang="css" scoped></style>
