<template>
    <div
        class="flex h-screen bg-gray-50 text-gray-900 font-sans"
        :class="fontClass"
    >
        <!-- 导航栏 (Navigation Rail - Fluent style) -->
        <nav
            class="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-3 gap-1"
        >
            <button
                v-for="(item, index) in navItems"
                :key="index"
                @click="activeNav = item.key"
                class="w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-150"
                :class="{
                    'bg-blue-600 text-white': activeNav === item.key,
                    'text-gray-700 hover:bg-gray-100': activeNav !== item.key,
                }"
                :title="item.label"
            >
                <span class="text-lg">{{ item.icon }}</span>
            </button>
        </nav>

        <!-- 侧边栏 (Side List - Fluent list style) -->
        <aside class="w-64 bg-white border-r border-gray-200 flex flex-col">
            <div class="p-4 border-b border-gray-200">
                <h2
                    class="text-xs font-semibold text-gray-500 uppercase tracking-wide"
                >
                    {{ activeNav === "projects" ? "Projects" : "Notes" }}
                </h2>
            </div>
            <div class="flex-1 overflow-y-auto">
                <div
                    v-for="project in projects"
                    :key="project.id"
                    @click="activeProject = project.id"
                    class="px-4 py-2.5 flex items-center gap-3 cursor-pointer transition-colors duration-150"
                    :class="{
                        'bg-blue-50 border-l-2 border-blue-600':
                            activeProject === project.id,
                        'hover:bg-gray-50': activeProject !== project.id,
                    }"
                >
                    <span class="text-gray-500">📁</span>
                    <span class="text-sm truncate">{{ project.name }}</span>
                </div>
            </div>
        </aside>

        <!-- 内容区 (Content Area - Fluent card & spacing) -->
        <main class="flex-1 p-6 overflow-auto">
            <div class="mb-6">
                <h1 class="text-xl font-semibold text-gray-900">
                    {{
                        activeProject
                            ? projects.find((p) => p.id === activeProject)
                                  ?.name || "Project"
                            : "Select a project"
                    }}
                </h1>
                <p class="text-sm text-gray-600 mt-1">
                    View and edit your project's DAG workflow.
                </p>
            </div>

            <!-- DAG 图占位区域（Fluent 卡片风格） -->
            <div
                v-if="activeProject"
                class="bg-white border border-gray-200 rounded-lg shadow-sm w-full h-150 flex items-center justify-center"
            >
                <div class="text-center px-6 py-8">
                    <div
                        class="inline-flex items-center justify-center w-12 h-12 rounded-md bg-blue-50 text-blue-600 mb-4"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                            <path d="M2 17l10 5 10-5"></path>
                            <path d="M2 12l10 5 10-5"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900">
                        DAG Visualization
                    </h3>
                    <p class="text-sm text-gray-600 mt-1">
                        Render your project’s dependency graph here using D3 or
                        GoJS.
                    </p>
                </div>
            </div>

            <div v-else class="text-center text-gray-500 mt-16">
                <div class="inline-block p-4 bg-gray-100 rounded-full mb-4">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <rect
                            x="2"
                            y="3"
                            width="20"
                            height="14"
                            rx="2"
                            ry="2"
                        ></rect>
                        <line x1="8" y1="21" x2="16" y2="21"></line>
                        <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                </div>
                <p class="text-base font-medium text-gray-700">
                    No project selected
                </p>
                <p class="text-sm text-gray-500 mt-1">
                    Choose a project from the sidebar to get started.
                </p>
            </div>
        </main>
    </div>
</template>

<script setup>
import { ref, computed } from "vue";

// 判断是否在 Windows 上以启用 Segoe UI（可选）
const isWindows = navigator.userAgent.includes("Win");
const fontClass = computed(() =>
    isWindows ? "font-['Segoe_UI',_system-ui,_sans-serif]" : "font-sans",
);

const navItems = [
    { key: "projects", label: "Projects", icon: "📋" },
    { key: "notes", label: "Notes", icon: "📝" },
];

const activeNav = ref("projects");

const projects = [
    { id: 1, name: "Data Pipeline v2" },
    { id: 2, name: "User Onboarding Flow" },
    { id: 3, name: "ML Training Workflow" },
    { id: 4, name: "CI/CD Automation" },
    { id: 5, name: "Legacy Migration Plan" },
];

const activeProject = ref(null);
</script>

<style scoped>
/* 可选：显式声明 Segoe UI 字体栈 */
@layer base {
    body {
        font-family:
            "Segoe UI",
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Helvetica Neue",
            sans-serif;
    }
}
</style>
