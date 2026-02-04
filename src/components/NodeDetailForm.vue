<template>
  <div class="flex flex-col">
    <header class="flex flex-col px-6 pt-7.5">
      <el-input
        v-model="localNode.name"
        placeholder="输入节点名称"
        class="simple-input"
      />
    </header>
    <main class="flex-1 overflow-y-auto p-6">
      <el-form
        :model="localNode"
        label-position="top"
        class="space-y-5"
        @submit.prevent
      >
        <el-input
          v-model="localNode.description"
          type="textarea"
          :rows="2"
          placeholder="简要描述"
          class="simple-textarea"
        />

        <el-input
          v-model="localNode.record"
          type="textarea"
          :rows="3"
          placeholder="详细记录"
          class="simple-textarea"
        />

        <div class="flex items-center space-x-2">
          <div class="mr-auto text-sm text-gray-500">当前任务状态</div>
          <el-switch v-model="localNode.completed" class="simple-switch" />
        </div>
        <div class="flex items-center space-x-2">
          <div class="mr-auto text-sm text-gray-500">关注状态</div>
          <el-switch v-model="localNode.isFollowed" class="simple-switch" />
        </div>
        <div class="flex items-center space-x-2">
          <div class="mr-auto text-sm text-gray-500">归档</div>
          <el-switch
            v-model="localNode.isArchive"
            class="simple-switch"
            :disabled="!enableArchive"
          />
        </div>
      </el-form>
    </main>
    <footer
      class="flex h-12 shrink-0 items-center justify-center border-t border-gray-200"
    >
      <div class="flex space-x-3">
        <el-button
          type="primary"
          @click="handleSave"
          class="simple-button flex-1"
        >
          保存
        </el-button>
        <el-button @click="handleCancel" class="simple-button secondary flex-1">
          取消
        </el-button>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { PNode } from "@/types";

interface Props {
  node: PNode;
  graphId: string;
  enableArchive?: boolean;
}

interface Emits {
  (e: "save", node: PNode): void;
  (e: "cancel"): void;
}

const props = withDefaults(defineProps<Props>(), {
  enableArchive: true,
});
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
};

const handleCancel = () => {
  localNode.value = { ...props.node };
  emit("cancel");
};
</script>

<style scoped>
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
