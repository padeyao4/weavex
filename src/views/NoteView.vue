<script setup lang="ts">
import MenuFrame from "@/components/MenuFrame.vue";
import { useNodeStore } from "@/stores";
import { computed } from "vue";

const noteStore = useNodeStore();

const metaList = computed(() => {
  return Object.values(noteStore.noteMeta);
});

const handleAddNote = function () {
  console.info("hello");
};
</script>

<template>
  <div class="h-full w-full">
    <menu-frame class="flex flex-col px-1 pt-7.5">
      <div class="my-2 flex flex-row gap-0.5 bg-red-100">
        <el-input />
        <el-button icon="Plus" @click="handleAddNote"></el-button>
      </div>
      <div class="h-full bg-amber-200">
        <div v-for="item in metaList">
          {{ item.title }}
        </div>
      </div>
    </menu-frame>
    <router-view></router-view>
  </div>
</template>
