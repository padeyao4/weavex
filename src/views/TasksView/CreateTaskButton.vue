<template>
    <div class="create-task-container">
        <button class="create-task-button" @click="showTaskForm = true">
            <div class="button-content">
                <div class="button-icon">
                    <CreateProjectIcon />
                </div>
                <span class="button-text">新建项目</span>
            </div>
        </button>

        <el-dialog
            v-model="showTaskForm"
            title="创建项目"
            width="400px"
            class="task-dialog"
        >
            <div class="dialog-content">
                <div class="dialog-header">
                    <CreateProjectIcon :active="true" />
                    <h3 class="dialog-title">创建新项目</h3>
                </div>

                <el-form
                    :model="newTaskForm"
                    label-width="auto"
                    class="task-form"
                >
                    <el-form-item label="项目名称" required>
                        <el-input
                            v-model="newTaskForm.name"
                            placeholder="请输入项目名称"
                            class="task-input"
                            @keyup.enter="createTask"
                        />
                    </el-form-item>
                    <div class="form-hint">
                        输入一个描述性的名称来标识这个项目
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
import CreateProjectIcon from "@/components/icons/CreateProjectIcon.vue";

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
    height: 100%;
}

.create-task-button {
    width: 100%;
    height: 100%;
    background-color: var(--vscode-sidebar-background);
    color: var(--vscode-foreground);
    /*border: 1px solid var(--vscode-border);*/
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    text-align: left;
}

.create-task-button:hover {
    background-color: var(--vscode-hover-background);
}

.create-task-button:active {
    background-color: var(--vscode-active-background);
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
    font-size: 14px;
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
