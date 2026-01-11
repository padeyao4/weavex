<template>
    <el-drawer
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        :with-header="false"
        size="380px"
        class="minimalist-drawer"
    >
        <div class="p-6">
            <div class="mb-6">
                <h3 class="text-lg text-gray-900">节点详情</h3>
                <p class="text-sm text-gray-400 mt-1">编辑节点信息</p>
            </div>

            <el-form
                :model="localNode"
                label-position="top"
                class="space-y-5"
                @submit.prevent
            >
                <el-form-item label="节点名称" required>
                    <el-input
                        v-model="localNode.name"
                        placeholder="输入节点名称"
                        class="simple-input"
                    />
                </el-form-item>

                <el-form-item label="描述">
                    <el-input
                        v-model="localNode.description"
                        type="textarea"
                        :rows="2"
                        placeholder="简要描述"
                        class="simple-textarea"
                    />
                </el-form-item>

                <el-form-item label="详细记录">
                    <el-input
                        v-model="localNode.record"
                        type="textarea"
                        :rows="3"
                        placeholder="详细记录"
                        class="simple-textarea"
                    />
                </el-form-item>

                <el-form-item label="完成状态">
                    <div class="flex items-center space-x-2">
                        <el-switch
                            v-model="localNode.completed"
                            class="simple-switch"
                        />
                        <span class="text-sm text-gray-500">
                            {{ localNode.completed ? "已完成" : "未完成" }}
                        </span>
                    </div>
                </el-form-item>
                <el-form-item label="关注状态">
                    <div class="flex items-center space-x-2">
                        <el-switch
                            v-model="localNode.isFollowed"
                            class="simple-switch"
                        />
                        <span class="text-sm text-gray-500">
                            {{ localNode.isFollowed ? "已关注" : "未关注" }}
                        </span>
                    </div>
                </el-form-item>

                <div class="pt-4 border-t border-gray-100">
                    <div class="flex space-x-3">
                        <el-button
                            type="primary"
                            @click="handleSave"
                            class="flex-1 simple-button"
                        >
                            保存
                        </el-button>
                        <el-button
                            @click="handleCancel"
                            class="flex-1 simple-button secondary"
                        >
                            取消
                        </el-button>
                    </div>
                </div>
            </el-form>
        </div>
    </el-drawer>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { PNode } from "@/types";

interface Props {
    modelValue: boolean;
    node: PNode;
}

interface Emits {
    (e: "update:modelValue", value: boolean): void;
    (e: "save", node: PNode): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const localNode = ref<PNode>({ ...props.node });

watch(
    () => props.node,
    (newNode) => {
        localNode.value = { ...newNode };
    },
    { deep: true },
);

const handleSave = () => {
    emit("save", localNode.value);
    emit("update:modelValue", false);
};

const handleCancel = () => {
    localNode.value = { ...props.node };
    emit("update:modelValue", false);
};
</script>

<style scoped>
.minimalist-drawer :deep(.el-drawer__body) {
    padding: 0;
}

.simple-input :deep(.el-input__wrapper),
.simple-textarea :deep(.el-textarea__inner) {
    background-color: transparent;
    border: none;
    border-bottom: 1px solid #e5e7eb;
    border-radius: 0;
    box-shadow: none;
    padding-left: 0;
    padding-right: 0;
}

.simple-input :deep(.el-input__wrapper):hover,
.simple-textarea :deep(.el-textarea__inner):hover {
    border-bottom-color: #9ca3af;
    background-color: transparent;
}

.simple-input :deep(.el-input__wrapper:focus-within),
.simple-textarea :deep(.el-textarea__inner:focus) {
    border-bottom-color: #3b82f6;
    box-shadow: none;
}

:deep(.el-form-item__label) {
    font-weight: 300;
    color: #6b7280;
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
}

.simple-button {
    border-radius: 6px;
    border: 1px solid #e5e7eb;
    background-color: white;
    color: #374151;
    font-weight: 300;
    transition: all 0.2s;
}

.simple-button:hover {
    border-color: #d1d5db;
    background-color: #f9fafb;
}

.simple-button:deep(.el-button) {
    border: 1px solid #e5e7eb;
    background-color: white;
}

.simple-button:deep(.el-button):hover {
    border-color: #d1d5db;
    background-color: #f9fafb;
}

.simple-button.secondary:deep(.el-button) {
    border-color: #e5e7eb;
    background-color: white;
}

.simple-button:deep(.el-button--primary) {
    background-color: #3b82f6;
    border-color: #3b82f6;
    color: white;
}

.simple-button:deep(.el-button--primary):hover {
    background-color: #2563eb;
    border-color: #2563eb;
}

.simple-switch:deep(.el-switch__core) {
    border-color: #d1d5db;
    background-color: #f3f4f6;
}

.simple-switch:deep(.el-switch.is-checked .el-switch__core) {
    border-color: #3b82f6;
    background-color: #3b82f6;
}
.minimalist-drawer {
    font-family:
        -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.simple-input :deep(.el-input__inner),
.simple-textarea :deep(.el-textarea__inner) {
    font-weight: 300;
    color: #374151;
}

.simple-input :deep(.el-input__inner::placeholder),
.simple-textarea :deep(.el-textarea__inner::placeholder) {
    color: #9ca3af;
    font-weight: 300;
}
</style>
