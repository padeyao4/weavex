<template>
  <div
    class="windows-title-bar flex items-center justify-between"
    data-tauri-drag-region
  >
    <div class="ml-auto flex">
      <!-- 最小化按钮 -->
      <button
        class="flex h-8 w-10 items-center justify-center hover:bg-gray-300"
        id="min-button"
        @click="minimizeWindow()"
        title="最小化"
      >
        <svg viewBox="0 0 16 16" width="12" height="12">
          <path
            d="M3 8a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 8Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <!-- 最大化/还原按钮 -->
      <button
        v-if="!isMaximized"
        class="flex h-8 w-10 items-center justify-center hover:bg-gray-300"
        @click="toggleMaximizeWindow()"
        id="max-button"
        title="最大化"
      >
        <svg viewBox="0 0 16 16" width="12" height="12">
          <path
            d="M4.5 3A1.5 1.5 0 0 0 3 4.5v7A1.5 1.5 0 0 0 4.5 13h7a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 11.5 3h-7Zm0 1h7a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5v-7a.5.5 0 0 1 .5-.5Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <button
        v-else
        class="flex h-8 w-10 items-center justify-center hover:bg-gray-300"
        @click="toggleMaximizeWindow()"
        id="restore-button"
        title="还原"
      >
        <svg viewBox="0 0 16 16" width="12" height="12">
          <path
            d="M5.5 4A1.5 1.5 0 0 0 4 5.5v5A1.5 1.5 0 0 0 5.5 12h5a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 10.5 4h-5Zm0 1h5a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-.5.5h-5a.5.5 0 0 1-.5-.5v-5a.5.5 0 0 1 .5-.5Z"
            fill="currentColor"
          />
          <path
            d="M3 5.5A1.5 1.5 0 0 1 4.5 4h5A1.5 1.5 0 0 1 11 5.5v5a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 3 10.5v-5Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <!-- 关闭按钮 -->
      <button
        class="flex h-8 w-10 items-center justify-center hover:bg-red-500 hover:text-white"
        @click="closeWindow()"
        title="关闭"
        id="close-button"
      >
        <svg viewBox="0 0 16 16" width="12" height="12">
          <path
            d="M4.22 4.22a.75.75 0 0 0-1.06 1.06L6.94 9l-3.72 3.72a.75.75 0 1 0 1.06 1.06L8 10.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L9.06 9l3.72-3.72a.75.75 0 0 0-1.06-1.06L8 7.94 4.22 4.22Z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Window } from "@tauri-apps/api/window";

const isMaximized = ref(false);
const appWindow = new Window("main");

// 初始化窗口状态
onMounted(async () => {
  try {
    isMaximized.value = await appWindow.isMaximized();

    // 监听窗口状态变化
    const unlisten = await appWindow.onResized(async () => {
      try {
        isMaximized.value = await appWindow.isMaximized();
      } catch (error) {
        console.error("更新窗口最大化状态失败:", error);
      }
    });

    // 组件卸载时清理监听器
    return () => {
      unlisten();
    };
  } catch (error) {
    console.error("初始化窗口状态失败:", error);
  }
});

const minimizeWindow = () => {
  appWindow.minimize();
};

const toggleMaximizeWindow = async () => {
  try {
    await appWindow.toggleMaximize();
  } catch (error) {
    console.error("切换窗口最大化状态失败:", error);
  }
};

const closeWindow = () => {
  appWindow.close();
};
</script>

<style scoped>
.windows-title-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  height: 30px;
  -webkit-app-region: drag;
  user-select: none;
  background-color: transparent;
}
</style>
