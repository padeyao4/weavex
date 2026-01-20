<script setup lang="ts">
import FramePage from "@/components/FramePage.vue";
import MenuFrame from "@/components/MenuFrame.vue";
</script>

<template>
  <FramePage>
    <div class="h-full w-full">
      <menu-frame class="pt-7.5">
        <div>search</div>
      </menu-frame>
      <router-view></router-view>
    </div>
  </FramePage>
</template>
