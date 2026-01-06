<template>
    <div
        class="fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ease-out"
        :class="{
            'pointer-events-none opacity-0': !visible,
            'opacity-100': visible,
        }"
        @click.self="handleClose"
    >
        <!-- macOS风格半透明模糊背景 -->
        <div
            class="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300"
            :class="{
                'opacity-0': !visible,
                'opacity-100': visible,
            }"
        ></div>

        <!-- macOS风格对话框 -->
        <div
            class="relative w-120 max-w-[90vw] bg-white rounded-2xl shadow-2xl transition-all duration-300 ease-out transform-gpu macos-dialog"
            :class="{
                'scale-95 opacity-0 translate-y-4': !visible,
                'scale-100 opacity-100 translate-y-0': visible,
            }"
        >
            <!-- 标题栏 -->
            <div
                class="flex items-center justify-between px-6 py-4 border-b border-gray-200/80"
            >
                <h3 class="text-lg font-semibold text-gray-900 tracking-tight">
                    重命名项目
                </h3>
                <button
                    @click="handleClose"
                    class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors duration-150"
                    aria-label="关闭"
                >
                    <svg
                        class="w-4 h-4 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>

            <!-- 内容区域 -->
            <div class="px-6 py-5">
                <div class="space-y-4">
                    <div>
                        <label
                            class="block text-sm font-medium text-gray-700 mb-2"
                        >
                            项目名称
                            <span class="text-red-500 ml-1">*</span>
                        </label>
                        <div class="relative">
                            <input
                                v-model="localName"
                                @keydown.enter="handleConfirm"
                                :maxlength="50"
                                type="text"
                                placeholder="请输入项目名称"
                                class="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                :class="{
                                    'border-red-300 focus:ring-red-500':
                                        showError && !localName.trim(),
                                }"
                                autofocus
                            />
                            <!-- 字符计数 -->
                            <div
                                class="absolute right-3 top-1/2 transform -translate-y-1/2"
                            >
                                <span class="text-xs text-gray-400">
                                    {{ localName.length }}/50
                                </span>
                            </div>
                        </div>
                        <!-- 错误提示 -->
                        <div
                            v-if="showError && !localName.trim()"
                            class="mt-2 flex items-center text-sm text-red-600"
                        >
                            <svg
                                class="w-4 h-4 mr-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fill-rule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                    clip-rule="evenodd"
                                />
                            </svg>
                            请输入项目名称
                        </div>
                    </div>
                </div>
            </div>

            <!-- 底部按钮区域 -->
            <div
                class="px-6 py-4 border-t border-gray-200/80 bg-gray-50/50 rounded-b-2xl"
            >
                <div class="flex justify-end space-x-3">
                    <button
                        @click="handleClose"
                        class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1"
                    >
                        取消
                    </button>
                    <button
                        @click="handleConfirmButton"
                        class="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        :disabled="!localName.trim()"
                    >
                        确定
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

interface Props {
    visible: boolean;
    name: string;
    graphId: string;
}

interface Emits {
    (e: "update:visible", value: boolean): void;
    (e: "update:name", value: string): void;
    (e: "confirm", graphId: string, name: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 使用本地 ref 来存储输入值
const localName = ref(props.name);
const showError = ref(false);

// 当 props.name 变化时更新本地值
watch(
    () => props.name,
    (newValue) => {
        localName.value = newValue;
        showError.value = false;
    },
);

// 监听本地值的变化并触发更新事件
watch(localName, (newValue) => {
    emit("update:name", newValue);
    showError.value = false;
});

const handleClose = () => {
    showError.value = false;
    emit("update:visible", false);
};

const handleConfirm = (e?: KeyboardEvent) => {
    if (!localName.value.trim()) {
        showError.value = true;
        return;
    }

    emit("confirm", props.graphId, localName.value.trim());
    emit("update:visible", false);
    showError.value = false;
    e?.preventDefault();
};

const handleConfirmButton = (e: MouseEvent) => {
    if (!localName.value.trim()) {
        showError.value = true;
        return;
    }

    emit("confirm", props.graphId, localName.value.trim());
    emit("update:visible", false);
    showError.value = false;
    e.preventDefault();
};
</script>

<style scoped>
/* macOS风格滚动条 */
::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

::-webkit-scrollbar-track {
    background-color: transparent;
    border-radius: 4px;
}

::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background-color: rgba(0, 0, 0, 0.3);
}

/* 平滑过渡效果 */
* {
    transition-property:
        background-color, border-color, color, fill, stroke, opacity,
        box-shadow, transform;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
}

/* 输入框焦点效果 */
input:focus {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 按钮按压效果 */
button:active {
    transform: scale(0.98);
}

/* macOS对话框字体 */
.macos-dialog {
    font-family:
        -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display",
        "Helvetica Neue", Arial, sans-serif;
}
</style>
