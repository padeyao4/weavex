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
    <main class="w-full h-screen bg-gray-50 flex">
        <div class="m-4 flex flex-col flex-1">
            <div class="h-14 flex items-center font-medium font-sans text-xl">
                任务列表
            </div>
            <div class="flex-1 flex flex-col gap-2 overflow-y-auto mt-2">
                <TaskItem
                    :tasks="taskStore.importantTasks"
                    :toggleTask="toggleTask"
                />
                <el-divider content-position="left">我是割线</el-divider>
                <TaskItem
                    :tasks="taskStore.otherTasks"
                    :toggleTask="toggleTask"
                />
            </div>
        </div>
    </main>
</template>
