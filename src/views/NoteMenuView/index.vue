<script setup lang="ts">
import MenuFrame from "@/components/MenuFrame.vue";
import router from "@/router";
import { useNodeStore } from "@/stores";
import { computed, ref } from "vue";
import CreateNoteDialog from "./CreateNoteDialog.vue";

const noteStore = useNodeStore();

const metaList = computed(() => {
  return Object.values(noteStore.noteMeta);
});

// 控制弹窗显示
const showCreateDialog = ref(false);

const handleAddNote = function () {
  // 改为显示弹窗
  showCreateDialog.value = true;
};

const handleCreateNoteConfirm = function (title: string) {
  // 使用用户输入的标题创建笔记
  noteStore.addNoteMeta(title);
};

const clickNoteItem = function (noteId: string) {
  router.push({ name: "noteEditor", params: { noteId } });
};
</script>

<template>
  <div class="flex flex-row">
    <menu-frame class="flex shrink-0 flex-col pt-7.5 pb-2">
      <div class="my-2 flex flex-row gap-1 px-1">
        <el-input />
        <el-button icon="Plus" @click="handleAddNote"></el-button>
      </div>
      <div
        class="flex min-w-0 flex-1 flex-col gap-1 overflow-y-auto border-t border-gray-200 bg-red-200 px-1 pt-1 select-none"
      >
        <div
          v-for="item in metaList"
          class="flex h-10 items-center justify-start overflow-hidden rounded-lg bg-amber-100 text-ellipsis whitespace-nowrap"
          @click="clickNoteItem(item.id)"
        >
          {{ item.title }}
        </div>
      </div>
    </menu-frame>
    <router-view :key="$route.fullPath"></router-view>

    <!-- 创建笔记弹窗 -->
    <CreateNoteDialog
      v-model:visible="showCreateDialog"
      @confirm="handleCreateNoteConfirm"
    />
  </div>
</template>
