<template>
  <div
    class="windows-title-bar flex items-center justify-between"
    data-tauri-drag-region
  >
    <div class="ml-auto flex">
      <button
        class="flex h-8 w-10 items-center justify-center hover:bg-gray-300"
        id="min-button"
        @click="minimizeWindow()"
        title="最小化"
      />
      <button
        class="flex h-8 w-10 items-center justify-center hover:bg-gray-300"
        @click="toggleMaximizeWindow()"
        :id="isMaximized ? 'restore-button' : 'max-button'"
        :title="isMaximized ? '还原' : '最大化'"
      />
      <button
        class="flex h-8 w-10 items-center justify-center hover:bg-red-500 hover:text-white"
        @click="closeWindow()"
        title="关闭"
        id="close-button"
      />
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

#close-button::before {
  font-family: "Font Awesome 5 Free", "Symbols Nerd Font";
  content: "\f00d"; /* × 关闭 */
  font-size: 14px;
  font-weight: 600;
}

#min-button::before {
  font-family: "Font Awesome 5 Free", "Symbols Nerd Font";
  content: "\f068"; /* − 最小化 */
  font-size: 14px;
  font-weight: 600;
}

#max-button::before {
  font-family: "Font Awesome 5 Free", "Symbols Nerd Font";
  content: "\f065"; /* □ 最大化 */
  font-size: 14px;
  font-weight: 600;
}

#restore-button::before {
  font-family: "Font Awesome 5 Free", "Symbols Nerd Font";
  content: "\f2d2"; /* ◻ 还原 */
  font-size: 14px;
  font-weight: 600;
}
</style>
