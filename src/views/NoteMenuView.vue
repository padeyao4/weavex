<script setup lang="ts">
import MenuFrame from "@/components/MenuFrame.vue";
import router from "@/router";
import { useNodeStore } from "@/stores";
import { faker } from "@faker-js/faker";
import { computed } from "vue";

const noteStore = useNodeStore();

const metaList = computed(() => {
  return Object.values(noteStore.noteMeta);
});

const handleAddNote = function () {
  noteStore.addNoteMeta(faker.book.title());
};

const clickNoteItem = function (noteId: string) {
  router.push({ name: "noteEditor", params: { noteId } });
};
</script>

<template>
  <div class="flex h-full w-full flex-row">
    <menu-frame class="flex shrink-0 flex-col pt-7.5 pb-2">
      <div class="my-2 flex flex-row gap-1 px-1">
        <el-input />
        <el-button icon="Plus" @click="handleAddNote"></el-button>
      </div>
      <div
        class="flex h-full flex-col gap-1 overflow-y-auto border-t border-gray-200 px-1 pt-1 select-none"
      >
        <div
          v-for="item in metaList"
          class="flex h-10 shrink-0 items-center justify-center rounded-lg bg-amber-100"
          @click="clickNoteItem(item.id)"
        >
          {{ item.title }}
        </div>
      </div>
    </menu-frame>
    <router-view :key="$route.fullPath"></router-view>
  </div>
</template>
