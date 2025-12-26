<script setup lang="ts">
import AboutComponent from "./AboutComponent.vue";
import AccountInfo from "./AccountInfo.vue";
import UserDataInfo from "./UserDataInfo.vue";
import { useRouter, type RouteLocationRaw } from "vue-router";

const router = useRouter();

function handleBack() {
    // 获取上一个路由或默认返回首页
    router.push(
        (router.options.history.state.back || {
            name: "index",
        }) as RouteLocationRaw,
    );
}
</script>

<template>
    <div class="settings-container">
        <header class="settings-header">
            <div class="header-back" @click="handleBack">
                <div class="back-button">
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        class="back-icon"
                    >
                        <path
                            d="M12 4L6 10L12 16"
                            stroke="var(--vscode-icon-foreground)"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                    </svg>
                </div>
            </div>
            <div class="header-title">
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    class="title-icon"
                >
                    <circle
                        cx="10"
                        cy="10"
                        r="6.5"
                        fill="var(--vscode-active-background)"
                        stroke="var(--vscode-focus-border)"
                        stroke-width="1.5"
                    />
                    <circle
                        cx="10"
                        cy="10"
                        r="2.5"
                        fill="var(--vscode-focus-border)"
                    />
                    <path
                        d="M10 3V5"
                        stroke="var(--vscode-focus-border)"
                        stroke-width="1.5"
                        stroke-linecap="round"
                    />
                    <path
                        d="M10 15V17"
                        stroke="var(--vscode-focus-border)"
                        stroke-width="1.5"
                        stroke-linecap="round"
                    />
                    <path
                        d="M3 10H5"
                        stroke="var(--vscode-focus-border)"
                        stroke-width="1.5"
                        stroke-linecap="round"
                    />
                    <path
                        d="M15 10H17"
                        stroke="var(--vscode-focus-border)"
                        stroke-width="1.5"
                        stroke-linecap="round"
                    />
                    <path
                        d="M5.5 5.5L7 7"
                        stroke="var(--vscode-focus-border)"
                        stroke-width="1.5"
                        stroke-linecap="round"
                    />
                    <path
                        d="M13 13L14.5 14.5"
                        stroke="var(--vscode-focus-border)"
                        stroke-width="1.5"
                        stroke-linecap="round"
                    />
                    <path
                        d="M5.5 14.5L7 13"
                        stroke="var(--vscode-focus-border)"
                        stroke-width="1.5"
                        stroke-linecap="round"
                    />
                    <path
                        d="M13 7L14.5 5.5"
                        stroke="var(--vscode-focus-border)"
                        stroke-width="1.5"
                        stroke-linecap="round"
                    />
                </svg>
                <h1 class="title-text">设置</h1>
            </div>
        </header>

        <div class="settings-content">
            <div class="settings-section">
                <div class="section-header">
                    <h2 class="section-title">账户</h2>
                    <div class="section-divider"></div>
                </div>
                <AccountInfo />
            </div>

            <div class="settings-section">
                <div class="section-header">
                    <h2 class="section-title">数据</h2>
                    <div class="section-divider"></div>
                </div>
                <UserDataInfo />
            </div>

            <div class="settings-section">
                <div class="section-header">
                    <h2 class="section-title">关于</h2>
                    <div class="section-divider"></div>
                </div>
                <AboutComponent />
            </div>
        </div>
    </div>
</template>

<style scoped>
.settings-container {
    min-height: 100vh;
    background-color: var(--vscode-background);
    color: var(--vscode-foreground);
    display: flex;
    flex-direction: column;
}

.settings-header {
    height: 64px;
    background-color: var(--vscode-sidebar-background);
    border-bottom: 1px solid var(--vscode-border);
    display: flex;
    align-items: center;
    padding: 0 20px;
    position: sticky;
    top: 0;
    z-index: 10;
}

.header-back {
    margin-right: 16px;
}

.back-button {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.back-button:hover {
    background-color: var(--vscode-hover-background);
}

.back-button:hover .back-icon path {
    stroke: var(--vscode-focus-border);
}

.back-icon {
    width: 20px;
    height: 20px;
}

.header-title {
    display: flex;
    align-items: center;
    gap: 12px;
}

.title-icon {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
}

.title-text {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--vscode-foreground);
}

.settings-content {
    flex: 1;
    max-width: 800px;
    width: 100%;
    margin: 0 auto;
    padding: 24px;
}

.settings-section {
    margin-bottom: 32px;
}

.section-header {
    margin-bottom: 16px;
}

.section-title {
    margin: 0 0 8px 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--vscode-secondary-foreground);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.section-divider {
    height: 1px;
    background-color: var(--vscode-border);
    width: 100%;
}

.settings-section:last-child {
    margin-bottom: 0;
}
</style>
