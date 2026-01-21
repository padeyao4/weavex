<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import Vditor from "vditor";
import { debug } from "@tauri-apps/plugin-log";
import { useNodeStore } from "@/stores";

const route = useRoute();
const noteId = route.params.noteId as string;
const noteStore = useNodeStore();

const noteTitle = computed(() => noteStore.noteMeta[noteId].title);

const vditorRef = ref();
const vditorContent = ref();

watch(vditorContent, () => {
  noteStore.saveNote(noteId, vditorContent.value);
});

let vditor: Vditor;

onMounted(async () => {
  vditor = new Vditor(vditorRef.value, {
    height: "100%",
    width: "100%",
    after: () => {
      debug("vditor loaded");
    },
    value: await noteStore.loadNote(noteId),
    input: (value) => {
      vditorContent.value = value;
    },
    cache: {
      enable: false,
    },
  });
});

onBeforeUnmount(() => {
  vditor?.destroy();
});
</script>

<template>
  <div class="flex h-full min-h-0 w-full min-w-0 flex-col px-4 pt-7.5 pb-2">
    <div
      class="flex h-12 min-w-0 shrink-0 items-center justify-start font-sans text-xl"
    >
      <div class="overflow-hidden text-ellipsis whitespace-nowrap">
        {{ noteTitle }}
      </div>
    </div>
    <div id="vditor" ref="vditorRef" class="min-h-0 min-w-0 flex-1"></div>
  </div>
</template>

<style lang="css" scoped>
/* 修改编辑区域的圆角 */
.vditor {
  border-radius: 6px !important;
  overflow: hidden; /* 防止内部元素溢出破坏圆角效果 */
}
</style>
