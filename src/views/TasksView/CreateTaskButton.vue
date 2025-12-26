<template>
    <div class="create-task-container">
        <button class="create-task-button" @click="showTaskForm = true">
            <div class="button-content">
                <div class="button-icon">
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <rect
                            x="2"
                            y="2"
                            width="12"
                            height="12"
                            rx="2"
                            fill="var(--vscode-button-background)"
                        />
                        <path
                            d="M8 5V11"
                            stroke="var(--vscode-button-foreground)"
                            stroke-width="1.5"
                            stroke-linecap="round"
                        />
                        <path
                            d="M5 8H11"
                            stroke="var(--vscode-button-foreground)"
                            stroke-width="1.5"
                            stroke-linecap="round"
                        />
                    </svg>
                </div>
                <span class="button-text">新建任务图</span>
            </div>
        </button>

        <el-dialog
            v-model="showTaskForm"
            title="创建任务图"
            width="400px"
            class="task-dialog"
        >
            <div class="dialog-content">
                <div class="dialog-header">
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        class="dialog-icon"
                    >
                        <rect
                            x="3"
                            y="3"
                            width="14"
                            height="14"
                            rx="2"
                            fill="var(--vscode-active-background)"
                            stroke="var(--vscode-focus-border)"
                            stroke-width="1.5"
                        />
                        <path
                            d="M7 7H13"
                            stroke="var(--vscode-focus-border)"
                            stroke-width="1.5"
                            stroke-linecap="round"
                        />
                        <path
                            d="M7 10H13"
                            stroke="var(--vscode-focus-border)"
                            stroke-width="1.5"
                            stroke-linecap="round"
                        />
                        <path
                            d="M7 13H10"
                            stroke="var(--vscode-focus-border)"
                            stroke-width="1.5"
                            stroke-linecap="round"
                        />
                    </svg>
                    <h3 class="dialog-title">创建新任务图</h3>
                </div>

                <el-form
                    :model="newTaskForm"
                    label-width="auto"
                    class="task-form"
                >
                    <el-form-item label="任务图名称" required>
                        <el-input
                            v-model="newTaskForm.name"
                            placeholder="请输入任务图名称"
                            class="task-input"
                            @keyup.enter="createTask"
                        />
                    </el-form-item>
                    <div class="form-hint">
                        输入一个描述性的名称来标识这个任务图
                    </div>
                </el-form>
            </div>

            <template #footer>
                <div class="dialog-footer">
                    <button
                        class="dialog-button secondary"
                        @click="showTaskForm = false"
                    >
                        取消
                    </button>
                    <button
                        class="dialog-button primary"
                        @click="createTask"
                        :disabled="!newTaskForm.name?.trim()"
                    >
                        创建
                    </button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { PGraph } from "@/types";
import { useGraphsStore } from "@/stores";
import { GraphUtils } from "@/utils";

const showTaskForm = ref(false);
const newTaskForm = ref<Partial<PGraph>>({});
const graphsStore = useGraphsStore();

const createTask = () => {
    if (!newTaskForm.value.name?.trim()) return;

    const graph = GraphUtils.createGraph(newTaskForm.value);
    graphsStore.addGraph(graph);
    showTaskForm.value = false;
    newTaskForm.value = {};
};
</script>

<style scoped>
.create-task-container {
    width: 100%;
}

.create-task-button {
    width: 100%;
    padding: 12px 16px;
    background-color: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 13px;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
}

.create-task-button:hover {
    background-color: var(--vscode-focus-border);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 122, 204, 0.2);
}

.create-task-button:active {
    transform: translateY(0);
    box-shadow: 0 1px 4px rgba(0, 122, 204, 0.15);
}

.button-content {
    display: flex;
    align-items: center;
    gap: 8px;
}

.button-icon {
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.button-text {
    font-size: 13px;
    font-weight: 500;
}

.task-dialog :deep(.el-dialog) {
    background-color: var(--vscode-background);
    border: 1px solid var(--vscode-border);
    border-radius: 6px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.task-dialog :deep(.el-dialog__header) {
    padding: 0;
    margin: 0;
}

.task-dialog :deep(.el-dialog__headerbtn) {
    top: 16px;
    right: 16px;
}

.task-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
    color: var(--vscode-secondary-foreground);
    font-size: 16px;
}

.task-dialog :deep(.el-dialog__headerbtn:hover .el-dialog__close) {
    color: var(--vscode-foreground);
}

.task-dialog :deep(.el-dialog__body) {
    padding: 0;
}

.dialog-content {
    padding: 20px 24px 0;
}

.dialog-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
}

.dialog-icon {
    flex-shrink: 0;
}

.dialog-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--vscode-foreground);
}

.task-form :deep(.el-form-item) {
    margin-bottom: 16px;
}

.task-form :deep(.el-form-item__label) {
    color: var(--vscode-secondary-foreground);
    font-size: 13px;
    font-weight: 500;
    padding-right: 12px;
}

.task-input :deep(.el-input__wrapper) {
    background-color: var(--vscode-input-background);
    border: 1px solid var(--vscode-border);
    background-color: var(--vscode-input-background);
    border-radius: 4px;
    box-shadow: none;
    padding: 8px 12px;
}

.task-input :deep(.el-input__wrapper:hover) {
    border-color: var(--vscode-focus-border);
    background-color: var(--vscode-background);
}

.task-input :deep(.el-input__wrapper.is-focus) {
    border-color: var(--vscode-focus-border);
    box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.1);
    border-color: var(--vscode-focus-border);
}

.task-input :deep(.el-input__inner) {
    color: var(--vscode-input-foreground);
    font-size: 13px;
    background: transparent;
    border: none;
}

.task-input :deep(.el-input__inner::placeholder) {
    color: var(--vscode-secondary-foreground);
}

.form-hint {
    font-size: 12px;
    color: var(--vscode-secondary-foreground);
    margin-top: -8px;
    margin-bottom: 16px;
    line-height: 1.4;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 16px 24px 20px;
    border-top: 1px solid var(--vscode-border);
}

.dialog-button {
    padding: 8px 16px;
    border: 1px solid transparent;
    border-radius: 4px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 80px;
}

.dialog-button.secondary {
    background-color: var(--vscode-sidebar-background);
    color: var(--vscode-secondary-foreground);
    border-color: var(--vscode-border);
}

.dialog-button.secondary:hover {
    background-color: var(--vscode-hover-background);
    color: var(--vscode-foreground);
    border-color: var(--vscode-focus-border);
}

.dialog-button.primary {
    background-color: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border-color: var(--vscode-button-background);
}

.dialog-button.primary:hover {
    background-color: var(--vscode-focus-border);
    border-color: var(--vscode-focus-border);
}

.dialog-button.primary:disabled {
    background-color: var(--vscode-sidebar-background);
    color: var(--vscode-secondary-foreground);
    border-color: var(--vscode-border);
    cursor: not-allowed;
    opacity: 0.6;
}

.dialog-button.primary:disabled:hover {
    background-color: var(--vscode-sidebar-background);
    border-color: var(--vscode-border);
}
</style>
