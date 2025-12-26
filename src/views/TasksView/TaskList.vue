<template>
    <div class="task-list-container">
        <div class="task-list-header">
            <div class="header-title">
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    class="header-icon"
                >
                    <rect
                        x="2"
                        y="2"
                        width="12"
                        height="12"
                        rx="2"
                        fill="var(--vscode-icon-foreground)"
                    />
                    <path
                        d="M5 5H11"
                        stroke="var(--vscode-sidebar-background)"
                        stroke-width="1.5"
                        stroke-linecap="round"
                    />
                    <path
                        d="M5 8H11"
                        stroke="var(--vscode-sidebar-background)"
                        stroke-width="1.5"
                        stroke-linecap="round"
                    />
                    <path
                        d="M5 11H8"
                        stroke="var(--vscode-sidebar-background)"
                        stroke-width="1.5"
                        stroke-linecap="round"
                    />
                </svg>
                <span class="title-text">任务列表</span>
            </div>
            <div class="header-actions">
                <button class="icon-button" title="刷新">
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M12.5 2.5V5.5H9.5"
                            stroke="var(--vscode-icon-foreground)"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                        <path
                            d="M1.5 11.5V8.5H4.5"
                            stroke="var(--vscode-icon-foreground)"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                        <path
                            d="M2.15 5C2.52 3.84 3.34 2.87 4.44 2.31C5.54 1.75 6.84 1.65 8.02 2.03C9.2 2.41 10.17 3.24 10.73 4.34C11.29 5.44 11.39 6.74 11.01 7.92M1.99 9C1.62 10.16 1.72 11.46 2.28 12.56C2.84 13.66 3.77 14.49 4.95 14.87C6.13 15.25 7.43 15.15 8.53 14.59C9.63 14.03 10.46 13.1 10.84 11.92"
                            stroke="var(--vscode-icon-foreground)"
                            stroke-width="1.5"
                            stroke-linecap="round"
                        />
                    </svg>
                </button>
                <button class="icon-button" title="搜索">
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <circle
                            cx="6"
                            cy="6"
                            r="4.5"
                            stroke="var(--vscode-icon-foreground)"
                            stroke-width="1.5"
                        />
                        <path
                            d="M10 10L13 13"
                            stroke="var(--vscode-icon-foreground)"
                            stroke-width="1.5"
                            stroke-linecap="round"
                        />
                    </svg>
                </button>
            </div>
        </div>

        <div class="task-list-content">
            <div class="quick-access">
                <router-link
                    :to="`/a/tasks/summery`"
                    class="quick-access-item"
                    :class="{ active: $route.name === 'tasksSummery' }"
                >
                    <div class="quick-access-icon">
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 14 14"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M7 2V12"
                                :stroke="
                                    $route.name === 'tasksSummery'
                                        ? 'var(--vscode-focus-border)'
                                        : 'var(--vscode-icon-foreground)'
                                "
                                stroke-width="1.5"
                                stroke-linecap="round"
                            />
                            <path
                                d="M2 7H12"
                                :stroke="
                                    $route.name === 'tasksSummery'
                                        ? 'var(--vscode-focus-border)'
                                        : 'var(--vscode-icon-foreground)'
                                "
                                stroke-width="1.5"
                                stroke-linecap="round"
                            />
                        </svg>
                    </div>
                    <span class="quick-access-text">我的一天</span>
                </router-link>
            </div>

            <div class="task-list-divider"></div>

            <div class="task-groups">
                <div class="task-group-header">
                    <span class="group-title">任务图</span>
                    <span class="group-count">{{
                        graphsStore.graphsMeta.length
                    }}</span>
                </div>

                <div class="task-items-container">
                    <el-scrollbar class="task-scrollbar">
                        <div class="task-items">
                            <div
                                v-for="meta in graphsStore.graphsMeta"
                                :key="meta.id"
                                class="task-item"
                                :class="{
                                    active: $route.params.id === meta.id,
                                }"
                            >
                                <router-link
                                    :to="`/a/tasks/graph/${meta.id}`"
                                    class="task-item-link"
                                >
                                    <div class="task-item-icon">
                                        <svg
                                            width="12"
                                            height="12"
                                            viewBox="0 0 12 12"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <circle
                                                cx="6"
                                                cy="6"
                                                r="5"
                                                :stroke="
                                                    $route.params.id === meta.id
                                                        ? 'var(--vscode-focus-border)'
                                                        : 'var(--vscode-icon-foreground)'
                                                "
                                                stroke-width="1.5"
                                            />
                                            <path
                                                d="M3 6H9"
                                                :stroke="
                                                    $route.params.id === meta.id
                                                        ? 'var(--vscode-focus-border)'
                                                        : 'var(--vscode-icon-foreground)'
                                                "
                                                stroke-width="1.5"
                                                stroke-linecap="round"
                                            />
                                            <path
                                                d="M6 3V9"
                                                :stroke="
                                                    $route.params.id === meta.id
                                                        ? 'var(--vscode-focus-border)'
                                                        : 'var(--vscode-icon-foreground)'
                                                "
                                                stroke-width="1.5"
                                                stroke-linecap="round"
                                            />
                                        </svg>
                                    </div>
                                    <div class="task-item-content">
                                        <div class="task-item-title">
                                            {{ meta.name }}
                                        </div>
                                        <div class="task-item-meta">
                                            <span class="task-item-date">
                                                {{ formatDate(meta.createdAt) }}
                                            </span>
                                        </div>
                                    </div>
                                </router-link>
                            </div>
                        </div>
                    </el-scrollbar>
                </div>
            </div>
        </div>

        <div class="task-list-footer">
            <create-task-button />
        </div>
    </div>
</template>

<script setup lang="ts">
import CreateTaskButton from "./CreateTaskButton.vue";
import { useGraphsStore } from "@/stores";
import { ElScrollbar } from "element-plus";

const graphsStore = useGraphsStore();

const formatDate = (dateString: string | number | Date) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return "今天";
    } else if (diffDays === 1) {
        return "昨天";
    } else if (diffDays < 7) {
        return `${diffDays}天前`;
    } else {
        return date.toLocaleDateString("zh-CN", {
            month: "short",
            day: "numeric",
        });
    }
};
</script>

<style scoped>
.task-list-container {
    width: 250px;
    height: 100vh;
    background-color: var(--vscode-sidebar-background);
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--vscode-border);
    user-select: none;
}

.task-list-header {
    padding: 12px 16px;
    border-bottom: 1px solid var(--vscode-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.header-title {
    display: flex;
    align-items: center;
    gap: 8px;
}

.header-icon {
    flex-shrink: 0;
}

.title-text {
    font-size: 13px;
    font-weight: 600;
    color: var(--vscode-foreground);
}

.header-actions {
    display: flex;
    gap: 4px;
}

.icon-button {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: var(--vscode-icon-foreground);
    cursor: pointer;
    padding: 0;
    transition: all 0.2s ease;
}

.icon-button:hover {
    background-color: var(--vscode-hover-background);
    color: var(--vscode-icon-hover-foreground);
}

.task-list-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.quick-access {
    padding: 12px 16px;
}

.quick-access-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    text-decoration: none;
    color: var(--vscode-secondary-foreground);
    border-radius: 4px;
    transition: all 0.2s ease;
    cursor: pointer;
}

.quick-access-item:hover {
    background-color: var(--vscode-hover-background);
    color: var(--vscode-foreground);
}

.quick-access-item.active {
    background-color: var(--vscode-active-background);
    color: var(--vscode-foreground);
}

.quick-access-icon {
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.quick-access-text {
    font-size: 13px;
    font-weight: 500;
}

.task-list-divider {
    height: 1px;
    background-color: var(--vscode-border);
    margin: 0 16px;
}

.task-groups {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.task-group-header {
    padding: 12px 16px 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.group-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--vscode-secondary-foreground);
}

.group-count {
    font-size: 11px;
    font-weight: 500;
    color: var(--vscode-secondary-foreground);
    background-color: var(--vscode-active-background);
    padding: 2px 6px;
    border-radius: 10px;
    min-width: 20px;
    text-align: center;
}

.task-items-container {
    flex: 1;
    overflow: hidden;
}

.task-scrollbar {
    height: 100%;
}

.task-scrollbar :deep(.el-scrollbar__wrap) {
    overflow-x: hidden;
}

.task-items {
    padding: 0 16px 16px;
}

.task-item {
    margin-bottom: 4px;
    border-radius: 4px;
    transition: all 0.2s ease;
}

.task-item:hover {
    background-color: var(--vscode-hover-background);
}

.task-item.active {
    background-color: var(--vscode-active-background);
}

.task-item-link {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    text-decoration: none;
    color: var(--vscode-foreground);
    cursor: pointer;
}

.task-item-icon {
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.task-item-content {
    flex: 1;
    min-width: 0;
}

.task-item-title {
    font-size: 13px;
    font-weight: 500;
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.task-item.active .task-item-title {
    font-weight: 600;
}

.task-item-meta {
    margin-top: 2px;
}

.task-item-date {
    font-size: 11px;
    color: var(--vscode-secondary-foreground);
}

.task-item.active .task-item-date {
    color: var(--vscode-focus-border);
}

.task-list-footer {
    padding: 12px 16px;
    border-top: 1px solid var(--vscode-border);
    background-color: var(--vscode-sidebar-background);
}
</style>
