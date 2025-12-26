<template>
    <div class="test-container">
        <div class="test-header">
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
                            fill="var(--vscode-active-background)"
                            stroke="var(--vscode-focus-border)"
                            stroke-width="1.5"
                        />
                        <path
                            d="M9 8L13 12L9 16"
                            stroke="var(--vscode-focus-border)"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                        <circle
                            cx="17"
                            cy="12"
                            r="2"
                            fill="var(--vscode-focus-border)"
                        />
                    </svg>
                </div>
                <div class="header-text">
                    <h1 class="header-title">测试</h1>
                    <p class="header-subtitle">验证功能和性能</p>
                </div>
            </div>
            <div class="header-actions">
                <button class="action-button primary" @click="runTests">
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
                                d="M6 5L10 8L6 11"
                                stroke="var(--vscode-button-background)"
                                stroke-width="1.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                        </svg>
                    </div>
                    <span class="button-text">运行测试</span>
                </button>
                <button class="action-button secondary" @click="createTest">
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
                    <span class="button-text">新建测试</span>
                </button>
            </div>
        </div>

        <div class="test-content">
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
                            fill="var(--vscode-sidebar-background)"
                            stroke="var(--vscode-border)"
                            stroke-width="2"
                        />
                        <path
                            d="M20 20H44"
                            stroke="var(--vscode-icon-foreground)"
                            stroke-width="2"
                            stroke-linecap="round"
                        />
                        <path
                            d="M20 32H44"
                            stroke="var(--vscode-icon-foreground)"
                            stroke-width="2"
                            stroke-linecap="round"
                        />
                        <path
                            d="M20 44H44"
                            stroke="var(--vscode-icon-foreground)"
                            stroke-width="2"
                            stroke-linecap="round"
                        />
                        <path
                            d="M52 20V44"
                            stroke="var(--vscode-icon-foreground)"
                            stroke-width="2"
                            stroke-linecap="round"
                        />
                        <circle
                            cx="32"
                            cy="32"
                            r="20"
                            fill="var(--vscode-background)"
                            stroke="var(--vscode-border)"
                            stroke-width="2"
                            stroke-dasharray="4 4"
                        />
                        <path
                            d="M24 24L40 40"
                            stroke="var(--vscode-error)"
                            stroke-width="2"
                            stroke-linecap="round"
                        />
                        <path
                            d="M40 24L24 40"
                            stroke="var(--vscode-error)"
                            stroke-width="2"
                            stroke-linecap="round"
                        />
                    </svg>
                </div>
                <div class="empty-text">
                    <h2 class="empty-title">测试功能开发中</h2>
                    <p class="empty-description">
                        测试模块正在开发中，即将为您提供完整的测试功能
                    </p>
                </div>
                <div class="empty-stats">
                    <div class="stat-item">
                        <div class="stat-icon success">
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <circle
                                    cx="8"
                                    cy="8"
                                    r="6"
                                    fill="var(--vscode-success)"
                                />
                                <path
                                    d="M5 8L7 10L11 6"
                                    stroke="var(--vscode-background)"
                                    stroke-width="1.5"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                            </svg>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value">0</div>
                            <div class="stat-label">通过测试</div>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon warning">
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <circle
                                    cx="8"
                                    cy="8"
                                    r="6"
                                    fill="var(--vscode-warning)"
                                />
                                <path
                                    d="M8 5V9"
                                    stroke="var(--vscode-background)"
                                    stroke-width="1.5"
                                    stroke-linecap="round"
                                />
                                <circle
                                    cx="8"
                                    cy="11"
                                    r="1"
                                    fill="var(--vscode-background)"
                                />
                            </svg>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value">0</div>
                            <div class="stat-label">警告测试</div>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon error">
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <circle
                                    cx="8"
                                    cy="8"
                                    r="6"
                                    fill="var(--vscode-error)"
                                />
                                <path
                                    d="M5 5L11 11"
                                    stroke="var(--vscode-background)"
                                    stroke-width="1.5"
                                    stroke-linecap="round"
                                />
                                <path
                                    d="M11 5L5 11"
                                    stroke="var(--vscode-background)"
                                    stroke-width="1.5"
                                    stroke-linecap="round"
                                />
                            </svg>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value">0</div>
                            <div class="stat-label">失败测试</div>
                        </div>
                    </div>
                </div>
                <div class="empty-features">
                    <h3 class="features-title">即将推出的功能</h3>
                    <div class="features-list">
                        <div class="feature-item">
                            <div class="feature-icon">
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 14 14"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <rect
                                        x="2"
                                        y="2"
                                        width="10"
                                        height="10"
                                        rx="2"
                                        fill="var(--vscode-active-background)"
                                    />
                                    <path
                                        d="M5 5H9"
                                        stroke="var(--vscode-focus-border)"
                                        stroke-width="1.5"
                                        stroke-linecap="round"
                                    />
                                    <path
                                        d="M5 7H9"
                                        stroke="var(--vscode-focus-border)"
                                        stroke-width="1.5"
                                        stroke-linecap="round"
                                    />
                                    <path
                                        d="M5 9H7"
                                        stroke="var(--vscode-focus-border)"
                                        stroke-width="1.5"
                                        stroke-linecap="round"
                                    />
                                </svg>
                            </div>
                            <span>单元测试</span>
                        </div>
                        <div class="feature-item">
                            <div class="feature-icon">
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 14 14"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <rect
                                        x="2"
                                        y="2"
                                        width="10"
                                        height="10"
                                        rx="2"
                                        fill="var(--vscode-active-background)"
                                    />
                                    <path
                                        d="M5 5L9 9"
                                        stroke="var(--vscode-focus-border)"
                                        stroke-width="1.5"
                                        stroke-linecap="round"
                                    />
                                    <path
                                        d="M9 5L5 9"
                                        stroke="var(--vscode-focus-border)"
                                        stroke-width="1.5"
                                        stroke-linecap="round"
                                    />
                                </svg>
                            </div>
                            <span>集成测试</span>
                        </div>
                        <div class="feature-item">
                            <div class="feature-icon">
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 14 14"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <circle
                                        cx="7"
                                        cy="7"
                                        r="5"
                                        fill="var(--vscode-active-background)"
                                        stroke="var(--vscode-focus-border)"
                                        stroke-width="1.5"
                                    />
                                    <path
                                        d="M7 4V10"
                                        stroke="var(--vscode-focus-border)"
                                        stroke-width="1.5"
                                        stroke-linecap="round"
                                    />
                                    <path
                                        d="M4 7H10"
                                        stroke="var(--vscode-focus-border)"
                                        stroke-width="1.5"
                                        stroke-linecap="round"
                                    />
                                </svg>
                            </div>
                            <span>性能测试</span>
                        </div>
                        <div class="feature-item">
                            <div class="feature-icon">
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 14 14"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M7 2V12"
                                        stroke="var(--vscode-focus-border)"
                                        stroke-width="1.5"
                                        stroke-linecap="round"
                                    />
                                    <path
                                        d="M2 7H12"
                                        stroke="var(--vscode-focus-border)"
                                        stroke-width="1.5"
                                        stroke-linecap="round"
                                    />
                                    <circle
                                        cx="7"
                                        cy="7"
                                        r="4"
                                        fill="var(--vscode-active-background)"
                                        stroke="var(--vscode-focus-border)"
                                        stroke-width="1.5"
                                    />
                                </svg>
                            </div>
                            <span>覆盖率报告</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const runTests = () => {
    console.log("运行测试");
};

const createTest = () => {
    console.log("创建测试");
};
</script>

<style scoped>
.test-container {
    height: 100vh;
    background-color: var(--vscode-background);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.test-header {
    padding: 16px 24px;
    border-bottom: 1px solid var(--vscode-border);
    background-color: var(--vscode-sidebar-background);
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
    background-color: var(--vscode-active-background);
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

.action-button.secondary {
    background-color: transparent;
    color: var(--vscode-foreground);
    border: 1px solid var(--vscode-border);
}

.action-button.secondary:hover {
    background-color: var(--vscode-hover-background);
    border-color: var(--vscode-focus-border);
    color: var(--vscode-focus-border);
}

.action-button.secondary:active {
    background-color: var(--vscode-active-background);
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

.test-content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    overflow: auto;
}

.empty-state {
    max-width: 560px;
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

.empty-stats {
    display: flex;
    gap: 24px;
    margin-top: 16px;
}

.stat-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background-color: var(--vscode-sidebar-background);
    border: 1px solid var(--vscode-border);
    border-radius: 8px;
    min-width: 120px;
    transition: all 0.2s ease;
}

.stat-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-color: var(--vscode-focus-border);
}

.stat-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    flex-shrink: 0;
}

.stat-icon.success {
    background-color: rgba(137, 209, 133, 0.15);
}

.stat-icon.warning {
    background-color: rgba(204, 167, 0, 0.15);
}

.stat-icon.error {
    background-color: rgba(244, 135, 113, 0.15);
}

.stat-content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
}

.stat-value {
    font-size: 20px;
    font-weight: 700;
    color: var(--vscode-foreground);
    line-height: 1;
}

.stat-label {
    font-size: 12px;
    color: var(--vscode-secondary-foreground);
    text-align: left;
}

.empty-features {
    margin-top: 32px;
    width: 100%;
}

.features-title {
    margin: 0 0 16px 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--vscode-foreground);
    text-align: left;
}

.features-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
}

.feature-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background-color: var(--vscode-sidebar-background);
    border: 1px solid var(--vscode-border);
    border-radius: 6px;
    text-align: left;
    transition: all 0.2s ease;
}

.feature-item:hover {
    background-color: var(--vscode-hover-background);
    border-color: var(--vscode-focus-border);
    transform: translateX(4px);
}

.feature-icon {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.feature-item span {
    font-size: 13px;
    color: var(--vscode-foreground);
    line-height: 1.4;
}
</style>
