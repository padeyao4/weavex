<script setup lang="ts">
import { useTaskStore } from "@/stores";
import { PNode } from "@/types";
import TaskItem from "./TaskItem.vue";

const taskStore = useTaskStore();
// 每次打开这个页面启动清理无效的任务
taskStore.clearInvalidTasks();

const toggleTask = (task: PNode) => {
    task.completed = !task.completed;
};
</script>

<template>
    <main class="w-full h-screen bg-white flex flex-col overflow-hidden">
        <div class="ml-6 mr-6 mb-6 mt-8 flex flex-col flex-1 min-h-0">
            <div
                class="h-10 flex items-center text-gray-600 text-base font-normal"
            >
                任务列表
            </div>
            <div
                class="flex-1 flex flex-col gap-3 overflow-y-auto mt-3 min-h-0"
            >
                <TaskItem
                    :tasks="taskStore.importantTasks"
                    :toggleTask="toggleTask"
                />
                <el-divider
                    content-position="left"
                    class="text-gray-400 text-xs"
                    >我是割线</el-divider
                >
                <TaskItem
                    :tasks="taskStore.otherTasks"
                    :toggleTask="toggleTask"
                />
            </div>
        </div>
    </main>
</template>
