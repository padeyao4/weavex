<template>
    <div class="notes-container">
        <div class="notes-header">
            <div class="header-content">
                <div class="header-icon">
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <rect
                            x="4"
                            y="4"
                            width="16"
                            height="16"
                            rx="3"
                            fill="var(--vscode-sidebar-background)"
                            stroke="var(--vscode-focus-border)"
                            stroke-width="1.5"
                        />
                        <path
                            d="M8 8H16"
                            stroke="var(--vscode-focus-border)"
                            stroke-width="1.5"
                            stroke-linecap="round"
                        />
                        <path
                            d="M8 12H16"
                            stroke="var(--vscode-focus-border)"
                            stroke-width="1.5"
                            stroke-linecap="round"
                        />
                        <path
                            d="M8 16H16"
                            stroke="var(--vscode-focus-border)"
                            stroke-width="1.5"
                            stroke-linecap="round"
                        />
                        <path
                            d="M18 8V16"
                            stroke="var(--vscode-focus-border)"
                            stroke-width="1.5"
                            stroke-linecap="round"
                        />
                    </svg>
                </div>
                <div class="header-text">
                    <h1 class="header-title">笔记</h1>
                    <p class="header-subtitle">记录你的想法和灵感</p>
                </div>
            </div>
            <div class="header-actions">
                <button class="action-button primary" @click="createNote">
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
                                fill="var(--vscode-button-foreground)"
                            />
                            <path
                                d="M8 5V11"
                                stroke="var(--vscode-button-background)"
                                stroke-width="1.5"
                                stroke-linecap="round"
                            />
                            <path
                                d="M5 8H11"
                                stroke="var(--vscode-button-background)"
                                stroke-width="1.5"
                                stroke-linecap="round"
                            />
                        </svg>
                    </div>
                    <span class="button-text">新建笔记</span>
                </button>
            </div>
        </div>

        <div class="notes-content">
            <div class="empty-state">
                <div class="empty-icon">
                    <svg
                        width="64"
                        height="64"
                        viewBox="0 0 64 64"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <rect
                            x="12"
                            y="12"
                            width="40"
                            height="40"
                            rx="6"
                            fill="var(--vscode-background)"
                            stroke="var(--vscode-border)"
                            stroke-width="2"
                        />
                        <path
                            d="M20 20H44"
                            stroke="var(--vscode-secondary-foreground)"
                            stroke-width="2"
                            stroke-linecap="round"
                        />
                        <path
                            d="M20 28H44"
                            stroke="var(--vscode-secondary-foreground)"
                            stroke-width="2"
                            stroke-linecap="round"
                        />
                        <path
                            d="M20 36H44"
                            stroke="var(--vscode-secondary-foreground)"
                            stroke-width="2"
                            stroke-linecap="round"
                        />
                        <path
                            d="M52 20V44"
                            stroke="var(--vscode-secondary-foreground)"
                            stroke-width="2"
                            stroke-linecap="round"
                        />
                        <circle
                            cx="32"
                            cy="32"
                            r="16"
                            fill="var(--vscode-sidebar-background)"
                            stroke="var(--vscode-border)"
                            stroke-width="2"
                            stroke-dasharray="4 4"
                        />
                    </svg>
                </div>
                <div class="empty-text">
                    <h2 class="empty-title">还没有笔记</h2>
                    <p class="empty-description">
                        开始记录你的想法、灵感和重要信息
                    </p>
                </div>
                <button class="empty-action" @click="createNote">
                    <div class="action-icon">
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
                    <span>创建第一个笔记</span>
                </button>
                <div class="empty-hints">
                    <div class="hint-item">
                        <div class="hint-icon">
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
                                    stroke="var(--vscode-success)"
                                    stroke-width="1.5"
                                />
                                <path
                                    d="M4 6L5.5 7.5L8 4.5"
                                    stroke="var(--vscode-success)"
                                    stroke-width="1.5"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                            </svg>
                        </div>
                        <span>记录日常想法和灵感</span>
                    </div>
                    <div class="hint-item">
                        <div class="hint-icon">
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
                                    stroke="var(--vscode-info)"
                                    stroke-width="1.5"
                                />
                                <path
                                    d="M6 4V8"
                                    stroke="var(--vscode-info)"
                                    stroke-width="1.5"
                                    stroke-linecap="round"
                                />
                                <circle
                                    cx="6"
                                    cy="9"
                                    r="0.75"
                                    fill="var(--vscode-info)"
                                />
                            </svg>
                        </div>
                        <span>整理学习笔记和工作记录</span>
                    </div>
                    <div class="hint-item">
                        <div class="hint-icon">
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
                                    stroke="var(--vscode-warning)"
                                    stroke-width="1.5"
                                />
                                <path
                                    d="M6 4L6 6.5"
                                    stroke="var(--vscode-warning)"
                                    stroke-width="1.5"
                                    stroke-linecap="round"
                                />
                                <path
                                    d="M6 8V8.5"
                                    stroke="var(--vscode-warning)"
                                    stroke-width="1.5"
                                    stroke-linecap="round"
                                />
                            </svg>
                        </div>
                        <span>保存重要链接和参考资料</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const createNote = () => {
    // TODO: 实现创建笔记功能
    console.log("创建笔记");
};
</script>

<style scoped>
.notes-container {
    height: 100vh;
    background-color: var(--vscode-background);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.notes-header {
    padding: 16px 24px;
    border-bottom: 1px solid var(--vscode-border);
    background-color: var(--vscode-background);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
}

.header-content {
    display: flex;
    align-items: center;
    gap: 16px;
}

.header-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--vscode-sidebar-background);
    border-radius: 8px;
    border: 1px solid var(--vscode-border);
}

.header-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.header-title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: var(--vscode-foreground);
}

.header-subtitle {
    margin: 0;
    font-size: 13px;
    color: var(--vscode-secondary-foreground);
}

.header-actions {
    display: flex;
    gap: 12px;
}

.action-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.action-button.primary {
    background-color: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
}

.action-button.primary:hover {
    background-color: var(--vscode-focus-border);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 122, 204, 0.3);
}

.action-button.primary:active {
    transform: translateY(0);
    box-shadow: 0 1px 4px rgba(0, 122, 204, 0.2);
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

.notes-content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    overflow: auto;
}

.empty-state {
    max-width: 480px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
}

.empty-icon {
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.8;
}

.empty-text {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.empty-title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: var(--vscode-foreground);
}

.empty-description {
    margin: 0;
    font-size: 14px;
    color: var(--vscode-secondary-foreground);
    line-height: 1.5;
}

.empty-action {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background-color: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.empty-action:hover {
    background-color: var(--vscode-focus-border);
    transform: translateY(-1px);
    box-shadow: 0 2px 12px rgba(0, 122, 204, 0.3);
}

.empty-action:active {
    transform: translateY(0);
    box-shadow: 0 1px 6px rgba(0, 122, 204, 0.2);
}

.action-icon {
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.empty-hints {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 16px;
    width: 100%;
}

.hint-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background-color: var(--vscode-background);
    border: 1px solid var(--vscode-border);
    border-radius: 6px;
    text-align: left;
    transition: all 0.2s ease;
}

.hint-item:hover {
    background-color: var(--vscode-sidebar-background);
    border-color: var(--vscode-focus-border);
    transform: translateX(4px);
}

.hint-icon {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.hint-item span {
    font-size: 13px;
    color: var(--vscode-foreground);
    line-height: 1.4;
}
</style>
