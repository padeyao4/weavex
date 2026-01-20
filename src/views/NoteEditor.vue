<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import Vditor from "vditor";
import { debug } from "@tauri-apps/plugin-log";
import { useNodeStore } from "@/stores";

const route = useRoute();
const noteId = route.params.noteId as string;
const noteStore = useNodeStore();

const noteTitle = computed(() => {
  return noteStore.noteMeta[noteId].title;
});

const vditorRef = ref();

let vditor: Vditor;

onMounted(() => {
  vditor = new Vditor(vditorRef.value, {
    height: "100%",
    width: "100%",
    after: () => {
      debug("vditor loaded");
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
  <div class="flex h-full min-h-0 w-full min-w-0 flex-col px-2 pt-7.5 pb-2">
    <div
      class="flex h-12 shrink-0 items-center justify-start font-sans text-xl"
    >
      {{ noteTitle }}
    </div>
    <div id="vditor" ref="vditorRef" class="min-h-0 min-w-0 flex-1"></div>
  </div>
</template>

<style lang="css" scoped></style>
