<script setup lang="ts">
import FramePage from "@/components/FramePage.vue";
import { useRepoStore } from "@/stores";
import { open } from "@tauri-apps/plugin-dialog";
import { ref } from "vue";

const directory = ref<string | null>();
const repoStore = useRepoStore();

const openLocalDir = async () => {
  directory.value = await open({
    multiple: false,
    directory: true,
  });
  if (directory.value) {
    repoStore.loadRepo({ workDir: directory.value }, { persist: true });
  }
};
</script>

<template>
  <FramePage>
    <div class="flex h-full w-full items-center justify-center select-none">
      <div
        class="flex flex-col items-center justify-center gap-6 rounded-2xl border border-gray-200 p-8"
      >
        <div class="text-2xl font-bold text-gray-600">打开本地仓库</div>
        <div class="text-md text-center font-normal text-gray-600">
          选择一个本地目录作为笔记仓库<br />
          支持后续迁移到Git远程仓库
        </div>

        <div class="flex flex-col items-center gap-4">
          <div
            class="flex h-32 w-96 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 transition-all hover:border-blue-400 hover:bg-blue-50"
            @click="openLocalDir"
          >
            <div class="text-4xl text-gray-400">📁</div>
            <div class="text-lg font-medium text-gray-600">选择文件夹</div>
            <div class="text-sm text-gray-500">点击或拖放文件夹到此区域</div>
          </div>

          <div v-if="directory" class="mt-4 w-full">
            <div class="mb-2 text-sm font-medium text-gray-600">
              已选择的目录：
            </div>
            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div class="font-mono text-sm break-all text-gray-700">
                {{ directory }}
              </div>
            </div>
          </div>

          <div v-else class="mt-4 text-sm text-gray-500">尚未选择任何目录</div>
        </div>

        <div class="mt-6 flex flex-col items-center gap-2">
          <div class="text-xs text-gray-400">支持本地目录和Git仓库</div>
          <div class="text-xs text-gray-400">数据将保存在您选择的目录中</div>
        </div>
      </div>
    </div>
  </FramePage>
</template>

<style scoped></style>
