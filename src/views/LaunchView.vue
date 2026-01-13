<script setup lang="ts">
import FramePage from "@/components/FramePage.vue";
import router from "@/router";
import { info } from "@tauri-apps/plugin-log";

const handleGitWorkspace = () => {
  info("Launching cloud workspace");
  router.push({ name: "GitFromView" });
};
const handleLocalWorkspace = () => {
  info("Launching local workspace");
  router.push({ name: "LocalFromView" });
};
</script>

<template>
  <FramePage>
    <div class="flex h-full w-full items-center justify-center select-none">
      <div
        class="flex flex-col items-center justify-center gap-4 rounded-2xl border border-gray-200 p-8"
      >
        <div class="text-2xl font-bold text-gray-600">欢迎使用 Possible</div>
        <div class="w-min-0 text-md font-normal text-wrap text-gray-600">
          这是一个基于Git存储的桌面目标笔记应用, 支持本地和远程仓库同步。<br />
        </div>
        <div class="text-md mb-4 font-normal text-gray-600">
          请选择您想要使用的工作区。
        </div>
        <div class="flex flex-row gap-4">
          <div
            class="h-45 w-64 rounded-xl border border-gray-200 bg-red-200 p-6"
            @click="handleGitWorkspace"
          >
            <div class="mb-4 font-bold text-gray-600">使用Git仓库</div>
            <div class="text-md font-normal text-gray-600">
              连接到已有的Git远程仓库，支持多人协作和版本控制
            </div>
          </div>
          <div
            class="h-45 w-64 rounded-xl border border-gray-200 bg-blue-200 p-6"
            @click="handleLocalWorkspace"
          >
            <div class="mb-4 font-bold text-gray-600">使用本地仓库</div>
            <div class="text-md font-normal text-gray-600">
              在本地目录中创建或打开笔记，支持后续迁移到Git仓库
            </div>
          </div>
        </div>
      </div>
    </div>
  </FramePage>
</template>
