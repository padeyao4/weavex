<template>
    <div
        class="fixed inset-0 z-50 flex items-center justify-center border border-gray-200"
        :class="{
            'pointer-events-none opacity-0': !visible,
            'opacity-100': visible,
        }"
        @click.self="handleClose"
    >
        <!-- 简洁背景 -->
        <div
            class="absolute inset-0 bg-black/20"
            :class="{
                'opacity-0': !visible,
                'opacity-100': visible,
            }"
        ></div>

        <!-- 极简风格对话框 -->
        <div
            class="relative w-96 max-w-[90vw] bg-white rounded-lg shadow-sm transition-all duration-300"
            :class="{
                'scale-95 opacity-0': !visible,
                'scale-100 opacity-100': visible,
            }"
        >
            <!-- 标题栏 -->
            <div class="flex items-center justify-between px-4 py-3">
                <h3 class="text-base font-medium text-gray-900">重命名项目</h3>
                <div
                    @click="handleClose"
                    class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
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
                </div>
            </div>

            <!-- 内容区域 -->
            <div class="px-4 py-3">
                <div class="space-y-4">
                    <div>
                        <input
                            v-model="localName"
                            @keydown.enter="handleConfirm"
                            :maxlength="50"
                            type="text"
                            placeholder="请输入项目名称"
                            class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            :class="{
                                'border-red-300 focus:ring-red-500':
                                    showError && !localName.trim(),
                            }"
                            autofocus
                        />
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
            <div class="px-4 py-3">
                <div class="flex justify-end space-x-2">
                    <div
                        @click="handleClose"
                        class="px-4 py-1.5 border border-gray-200 text-sm font-normal select-none text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        取消
                    </div>
                    <div
                        @click="handleConfirmButton"
                        class="px-4 py-1.5 text-sm font-normal border border-gray-200 select-none rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        :disabled="!localName.trim()"
                    >
                        确定
                    </div>
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
/* 极简风格滚动条 */
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

/* 极简字体配置 */
* {
    font-family:
        -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
        Arial, sans-serif;
    font-weight: 400;
}

h3 {
    font-weight: 500;
}
</style>
