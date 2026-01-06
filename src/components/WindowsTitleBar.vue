<template>
    <div
        class="windows-title-bar flex items-center justify-between px-4"
        data-tauri-drag-region
    >
        <div class="title-bar-buttons flex ml-auto">
            <button
                class="title-bar-button w-10 h-8 flex items-center justify-center hover:bg-gray-300"
                @click="minimizeWindow()"
                title="最小化"
            >
                <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M5 12H19"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                    />
                </svg>
            </button>
            <button
                class="title-bar-button w-10 h-8 flex items-center justify-center hover:bg-gray-300"
                @click="toggleMaximizeWindow()"
                :title="isMaximized ? '还原' : '最大化'"
            >
                <svg
                    v-if="!isMaximized"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <rect
                        x="4"
                        y="4"
                        width="16"
                        height="16"
                        rx="1"
                        stroke="currentColor"
                        stroke-width="2"
                    />
                </svg>
                <svg
                    v-else
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M4 10V4H10M20 14V20H14M14 14H16V16M8 8H10V10M14 8H16V10M8 14H10V16"
                        stroke="currentColor"
                        stroke-width="2"
                    />
                </svg>
            </button>
            <button
                class="title-bar-button w-10 h-8 flex items-center justify-center hover:bg-red-500 hover:text-white"
                @click="closeWindow()"
                title="关闭"
            >
                <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M6 18L18 6M6 6L18 18"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
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

.title-bar-button {
    -webkit-app-region: no-drag;
    cursor: pointer;
    border: none;
    background: transparent;
    color: #374151;
}

.title-bar-button:hover {
    color: #1f2937;
}

.title-bar-button:hover:last-child {
    background-color: rgba(239, 68, 68, 0.1);
}
</style>
