<template>
    <div class="tasks-summery-container">
        <div class="summery-header">
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
                            d="M8 16H12"
                            stroke="var(--vscode-focus-border)"
                            stroke-width="1.5"
                            stroke-linecap="round"
                        />
                    </svg>
                </div>
                <div class="header-text">
                    <h1 class="header-title">我的一天</h1>
                    <p class="header-subtitle">今日任务概览和统计</p>
                </div>
            </div>
            <div class="header-date">
                <div class="date-content">
                    <div class="date-day">{{ currentDate.day }}</div>
                    <div class="date-info">
                        <div class="date-weekday">
                            {{ currentDate.weekday }}
                        </div>
                        <div class="date-full">{{ currentDate.full }}</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="summery-content">
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon total">
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <circle
                                    cx="10"
                                    cy="10"
                                    r="8"
                                    fill="var(--vscode-active-background)"
                                    stroke="var(--vscode-focus-border)"
                                    stroke-width="1.5"
                                />
                                <text
                                    x="10"
                                    y="14"
                                    text-anchor="middle"
                                    font-size="10"
                                    font-weight="600"
                                    fill="var(--vscode-focus-border)"
                                >
                                    Σ
                                </text>
                            </svg>
                        </div>
                        <div class="stat-title">总任务数</div>
                    </div>
                    <div class="stat-value">0</div>
                    <div class="stat-trend">
                        <span class="trend-text">今日无新增</span>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon completed">
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <circle
                                    cx="10"
                                    cy="10"
                                    r="8"
                                    fill="var(--vscode-success)"
                                    fill-opacity="0.15"
                                    stroke="var(--vscode-success)"
                                    stroke-width="1.5"
                                />
                                <path
                                    d="M6 10L9 13L14 7"
                                    stroke="var(--vscode-success)"
                                    stroke-width="1.5"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                            </svg>
                        </div>
                        <div class="stat-title">已完成</div>
                    </div>
                    <div class="stat-value">0</div>
                    <div class="stat-trend">
                        <span class="trend-text success">0% 完成率</span>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon pending">
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <circle
                                    cx="10"
                                    cy="10"
                                    r="8"
                                    fill="var(--vscode-warning)"
                                    fill-opacity="0.15"
                                    stroke="var(--vscode-warning)"
                                    stroke-width="1.5"
                                />
                                <path
                                    d="M10 6V10L12 12"
                                    stroke="var(--vscode-warning)"
                                    stroke-width="1.5"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                            </svg>
                        </div>
                        <div class="stat-title">进行中</div>
                    </div>
                    <div class="stat-value">0</div>
                    <div class="stat-trend">
                        <span class="trend-text warning">等待处理</span>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon overdue">
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <circle
                                    cx="10"
                                    cy="10"
                                    r="8"
                                    fill="var(--vscode-error)"
                                    fill-opacity="0.15"
                                    stroke="var(--vscode-error)"
                                    stroke-width="1.5"
                                />
                                <path
                                    d="M10 6V10L12 12"
                                    stroke="var(--vscode-error)"
                                    stroke-width="1.5"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                                <path
                                    d="M10 13V14"
                                    stroke="var(--vscode-error)"
                                    stroke-width="1.5"
                                    stroke-linecap="round"
                                />
                            </svg>
                        </div>
                        <div class="stat-title">已逾期</div>
                    </div>
                    <div class="stat-value">0</div>
                    <div class="stat-trend">
                        <span class="trend-text error">需要关注</span>
                    </div>
                </div>
            </div>

            <div class="content-sections">
                <div class="section-card">
                    <div class="section-header">
                        <div class="section-title">
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                class="section-icon"
                            >
                                <rect
                                    x="2"
                                    y="2"
                                    width="12"
                                    height="12"
                                    rx="2"
                                    fill="var(--vscode-active-background)"
                                    stroke="var(--vscode-focus-border)"
                                    stroke-width="1.5"
                                />
                                <path
                                    d="M5 5H11"
                                    stroke="var(--vscode-focus-border)"
                                    stroke-width="1.5"
                                    stroke-linecap="round"
                                />
                                <path
                                    d="M5 8H11"
                                    stroke="var(--vscode-focus-border)"
                                    stroke-width="1.5"
                                    stroke-linecap="round"
                                />
                                <path
                                    d="M5 11H8"
                                    stroke="var(--vscode-focus-border)"
                                    stroke-width="1.5"
                                    stroke-linecap="round"
                                />
                            </svg>
                            <span>今日重点任务</span>
                        </div>
                        <div class="section-actions">
                            <button class="icon-button" title="添加任务">
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
                                        fill="var(--vscode-button-background)"
                                    />
                                    <path
                                        d="M7 4V10"
                                        stroke="var(--vscode-button-foreground)"
                                        stroke-width="1.5"
                                        stroke-linecap="round"
                                    />
                                    <path
                                        d="M4 7H10"
                                        stroke="var(--vscode-button-foreground)"
                                        stroke-width="1.5"
                                        stroke-linecap="round"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="section-content">
                        <div class="empty-tasks">
                            <div class="empty-icon">
                                <svg
                                    width="48"
                                    height="48"
                                    viewBox="0 0 48 48"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <rect
                                        x="8"
                                        y="8"
                                        width="32"
                                        height="32"
                                        rx="4"
                                        fill="var(--vscode-sidebar-background)"
                                        stroke="var(--vscode-border)"
                                        stroke-width="2"
                                    />
                                    <path
                                        d="M16 16H32"
                                        stroke="var(--vscode-icon-foreground)"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                    />
                                    <path
                                        d="M16 24H32"
                                        stroke="var(--vscode-icon-foreground)"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                    />
                                    <path
                                        d="M16 32H24"
                                        stroke="var(--vscode-icon-foreground)"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                    />
                                    <circle
                                        cx="36"
                                        cy="36"
                                        r="8"
                                        fill="var(--vscode-background)"
                                        stroke="var(--vscode-border)"
                                        stroke-width="2"
                                        stroke-dasharray="3 3"
                                    />
                                </svg>
                            </div>
                            <div class="empty-text">
                                <h3 class="empty-title">暂无今日任务</h3>
                                <p class="empty-description">
                                    添加任务开始你高效的一天
                                </p>
                            </div>
                            <button class="empty-action" @click="addTodayTask">
                                <div class="action-icon">
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
                                            fill="var(--vscode-button-background)"
                                        />
                                        <path
                                            d="M7 4V10"
                                            stroke="var(--vscode-button-foreground)"
                                            stroke-width="1.5"
                                            stroke-linecap="round"
                                        />
                                        <path
                                            d="M4 7H10"
                                            stroke="var(--vscode-button-foreground)"
                                            stroke-width="1.5"
                                            stroke-linecap="round"
                                        />
                                    </svg>
                                </div>
                                <span>添加今日任务</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="section-card">
                    <div class="section-header">
                        <div class="section-title">
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                class="section-icon"
                            >
                                <path
                                    d="M8 2V14"
                                    stroke="var(--vscode-focus-border)"
                                    stroke-width="1.5"
                                    stroke-linecap="round"
                                />
                                <path
                                    d="M2 8H14"
                                    stroke="var(--vscode-focus-border)"
                                    stroke-width="1.5"
                                    stroke-linecap="round"
                                />
                                <circle
                                    cx="8"
                                    cy="8"
                                    r="6"
                                    fill="var(--vscode-active-background)"
                                    stroke="var(--vscode-focus-border)"
                                    stroke-width="1.5"
                                />
                            </svg>
                            <span>快速操作</span>
                        </div>
                    </div>
                    <div class="section-content">
                        <div class="quick-actions">
                            <button class="quick-action" @click="goToTaskGraph">
                                <div class="action-icon">
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 20 20"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <circle
                                            cx="10"
                                            cy="10"
                                            r="8"
                                            fill="var(--vscode-active-background)"
                                            stroke="var(--vscode-focus-border)"
                                            stroke-width="1.5"
                                        />
                                        <path
                                            d="M6 6L14 14"
                                            stroke="var(--vscode-focus-border)"
                                            stroke-width="1.5"
                                            stroke-linecap="round"
                                        />
                                        <path
                                            d="M6 14L14 6"
                                            stroke="var(--vscode-focus-border)"
                                            stroke-width="1.5"
                                            stroke-linecap="round"
                                        />
                                    </svg>
                                </div>
                                <div class="action-content">
                                    <div class="action-title">查看任务图</div>
                                    <div class="action-description">
                                        可视化任务关系
                                    </div>
                                </div>
                            </button>
                            <button class="quick-action" @click="createNewTask">
                                <div class="action-icon">
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 20 20"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <rect
                                            x="4"
                                            y="4"
                                            width="12"
                                            height="12"
                                            rx="2"
                                            fill="var(--vscode-active-background)"
                                            stroke="var(--vscode-focus-border)"
                                            stroke-width="1.5"
                                        />
                                        <path
                                            d="M10 6V14"
                                            stroke="var(--vscode-focus-border)"
                                            stroke-width="1.5"
                                            stroke-linecap="round"
                                        />
                                        <path
                                            d="M6 10H14"
                                            stroke="var(--vscode-focus-border)"
                                            stroke-width="1.5"
                                            stroke-linecap="round"
                                        />
                                    </svg>
                                </div>
                                <div class="action-content">
                                    <div class="action-title">新建任务</div>
                                    <div class="action-description">
                                        添加新任务项
                                    </div>
                                </div>
                            </button>
                            <button class="quick-action" @click="viewAllTasks">
                                <div class="action-icon">
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 20 20"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <rect
                                            x="4"
                                            y="4"
                                            width="12"
                                            height="12"
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
                                            d="M7 13H13"
                                            stroke="var(--vscode-focus-border)"
                                            stroke-width="1.5"
                                            stroke-linecap="round"
                                        />
                                    </svg>
                                </div>
                                <div class="action-content">
                                    <div class="action-title">查看所有任务</div>
                                    <div class="action-description">
                                        浏览完整任务列表
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const currentDate = computed(() => {
    const now = new Date();
    const day = now.getDate();
    const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    const weekday = weekdays[now.getDay()];
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    return {
        day: day.toString().padStart(2, "0"),
        weekday,
        full: `${year}年${month}月${day}日`,
    };
});

const addTodayTask = () => {
    console.log("添加今日任务");
    // TODO: 实现添加今日任务功能
};

const goToTaskGraph = () => {
    router.push("/a/tasks");
};

const createNewTask = () => {
    console.log("创建新任务");
    // TODO: 实现创建新任务功能
};

const viewAllTasks = () => {
    router.push("/a/tasks");
};
</script>

<style scoped>
.tasks-summery-container {
    height: 100vh;
    background-color: var(--vscode-background);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.summery-header {
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

.header-date {
    display: flex;
    align-items: center;
}

.date-content {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    background-color: var(--vscode-active-background);
    border: 1px solid var(--vscode-border);
    border-radius: 8px;
}

.date-day {
    font-size: 28px;
    font-weight: 700;
    color: var(--vscode-focus-border);
    line-height: 1;
}

.date-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.date-weekday {
    font-size: 14px;
    font-weight: 600;
    color: var(--vscode-foreground);
}

.date-full {
    font-size: 12px;
    color: var(--vscode-secondary-foreground);
}

.summery-content {
    flex: 1;
    padding: 24px;
    overflow: auto;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px;
    margin-bottom: 32px;
}

.stat-card {
    background-color: var(--vscode-sidebar-background);
    border: 1px solid var(--vscode-border);
    border-radius: 8px;
    padding: 20px;
    transition: all 0.2s ease;
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-color: var(--vscode-focus-border);
}

.stat-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
}

.stat-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    flex-shrink: 0;
}

.stat-icon.total {
    background-color: rgba(0, 122, 204, 0.15);
}

.stat-icon.completed {
    background-color: rgba(137, 209, 133, 0.15);
}

.stat-icon.pending {
    background-color: rgba(204, 167, 0, 0.15);
}

.stat-icon.overdue {
    background-color: rgba(244, 135, 113, 0.15);
}

.stat-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--vscode-secondary-foreground);
}

.stat-value {
    font-size: 32px;
    font-weight: 700;
    color: var(--vscode-foreground);
    line-height: 1;
    margin-bottom: 8px;
}

.stat-trend {
    display: flex;
    align-items: center;
    gap: 4px;
}

.trend-text {
    font-size: 12px;
    font-weight: 500;
}

.trend-text.success {
    color: var(--vscode-success);
}

.trend-text.warning {
    color: var(--vscode-warning);
}

.trend-text.error {
    color: var(--vscode-error);
}

.content-sections {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 24px;
}

.section-card {
    background-color: var(--vscode-sidebar-background);
    border: 1px solid var(--vscode-border);
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.section-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--vscode-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: var(--vscode-active-background);
}

.section-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    font-weight: 600;
    color: var(--vscode-foreground);
}

.section-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
}

.section-actions {
    display: flex;
    gap: 8px;
}

.icon-button {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 1px solid var(--vscode-border);
    border-radius: 4px;
    color: var(--vscode-icon-foreground);
    cursor: pointer;
    padding: 0;
    transition: all 0.2s ease;
}

.icon-button:hover {
    background-color: var(--vscode-hover-background);
    border-color: var(--vscode-focus-border);
    color: var(--vscode-icon-hover-foreground);
}

.section-content {
    flex: 1;
    padding: 20px;
}

.empty-tasks {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    height: 100%;
    min-height: 200px;
}

.empty-icon {
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.6;
}

.empty-text {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}

.empty-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--vscode-foreground);
}

.empty-description {
    margin: 0;
    font-size: 13px;
    color: var(--vscode-secondary-foreground);
    text-align: center;
}

.empty-action {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background-color: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.empty-action:hover {
    background-color: var(--vscode-focus-border);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 122, 204, 0.3);
}

.empty-action:active {
    transform: translateY(0);
    box-shadow: 0 1px 4px rgba(0, 122, 204, 0.2);
}

.action-icon {
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.quick-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.quick-action {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background-color: var(--vscode-active-background);
    border: 1px solid var(--vscode-border);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
    text-align: left;
}

.quick-action:hover {
    background-color: var(--vscode-hover-background);
    border-color: var(--vscode-focus-border);
    transform: translateX(4px);
}

.quick-action:active {
    background-color: var(--vscode-active-background);
}

.action-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.action-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--vscode-foreground);
}

.action-description {
    font-size: 12px;
    color: var(--vscode-secondary-foreground);
    line-height: 1.4;
}

@media (max-width: 1024px) {
    .content-sections {
        grid-template-columns: 1fr;
    }

    .stats-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 768px) {
    .stats-grid {
        grid-template-columns: 1fr;
    }

    .summery-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
    }

    .header-date {
        width: 100%;
    }

    .date-content {
        width: 100%;
        justify-content: center;
    }
}
</style>
