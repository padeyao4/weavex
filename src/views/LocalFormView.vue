<script setup lang="ts">
import FramePage from "@/components/FramePage.vue";
import { useRepoStore } from "@/stores";
import { open } from "@tauri-apps/plugin-dialog";
import { ref } from "vue";
import { useRouter } from "vue-router";

const directory = ref<string | null>();
const repoStore = useRepoStore();
const router = useRouter();

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
      <!-- 滑动式返回按钮 -->
      <div class="absolute top-1/2 left-0 -translate-y-1/2">
        <button
          @click="router.back()"
          class="group flex items-center gap-2 rounded-r-full bg-gray-100 px-3 py-4 pr-6 shadow-md transition-all hover:bg-gray-200 hover:shadow-lg active:scale-95"
        >
          <div
            class="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm transition-transform group-hover:-translate-x-1"
          >
            <span class="text-lg text-gray-600">←</span>
          </div>
          <span
            class="text-sm font-medium text-gray-700 opacity-0 transition-all group-hover:opacity-100"
          >
            返回
          </span>
        </button>
      </div>

      <div
        class="relative flex flex-col items-center justify-center gap-6 rounded-2xl border border-gray-200 p-8"
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
