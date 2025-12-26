<template>
    <div class="settings-item" :class="{ 'has-divider': divider }">
        <div class="item-left">
            <div class="item-content">
                <div class="item-title">
                    <slot name="title"> 标题 </slot>
                </div>
                <div class="item-description">
                    <slot name="description"> 描述 </slot>
                </div>
            </div>
        </div>
        <div class="item-right">
            <slot name="option"> </slot>
        </div>
    </div>
</template>

<script setup lang="ts">
interface Props {
    divider?: boolean;
}

withDefaults(defineProps<Props>(), {
    divider: true,
});
</script>

<style scoped>
.settings-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    transition: background-color 0.2s ease;
    position: relative;
}

.settings-item:hover {
    background-color: var(--vscode-hover-background);
}

.settings-item.has-divider::after {
    content: "";
    position: absolute;
    left: 20px;
    right: 20px;
    bottom: 0;
    height: 1px;
    background-color: var(--vscode-border);
}

.settings-item:last-child::after {
    display: none;
}

.item-left {
    flex: 1;
    min-width: 0;
    padding-right: 16px;
}

.item-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.item-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--vscode-foreground);
    line-height: 1.4;
}

.item-description {
    font-size: 12px;
    color: var(--vscode-secondary-foreground);
    line-height: 1.4;
}

.item-description :deep(i) {
    font-style: italic;
    color: var(--vscode-focus-border);
}

.item-description :deep(code) {
    font-family:
        "SF Mono", Monaco, "Cascadia Mono", "Segoe UI Mono", "Roboto Mono",
        "Ubuntu Mono", monospace;
    font-size: 11px;
    background-color: var(--vscode-active-background);
    padding: 2px 4px;
    border-radius: 3px;
    color: var(--vscode-foreground);
}

.item-right {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: flex-end;
}

.item-right :deep(.el-button) {
    background-color: transparent;
    border: 1px solid var(--vscode-border);
    color: var(--vscode-foreground);
    font-size: 12px;
    padding: 6px 12px;
    height: auto;
    transition: all 0.2s ease;
}

.item-right :deep(.el-button:hover) {
    background-color: var(--vscode-hover-background);
    border-color: var(--vscode-focus-border);
    color: var(--vscode-focus-border);
}

.item-right :deep(.el-button:active) {
    background-color: var(--vscode-active-background);
}

.item-right :deep(.el-button--primary) {
    background-color: var(--vscode-button-background);
    border-color: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
}

.item-right :deep(.el-button--primary:hover) {
    background-color: var(--vscode-focus-border);
    border-color: var(--vscode-focus-border);
}

.item-right :deep(.el-button--primary:active) {
    background-color: var(--vscode-selection-background);
}
</style>
