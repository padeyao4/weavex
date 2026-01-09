<script setup lang="ts">
import { useTaskStore } from "@/stores";
import { PNode } from "@/types";
import TaskItem from "./TaskItem.vue";
import { ref } from "vue";

const taskStore = useTaskStore();
// 每次打开这个页面启动清理无效的任务

const toggleTask = (task: PNode) => {
    task.completed = !task.completed;
};

const showOthers = ref(false);
</script>

<template>
    <main
        class="w-full h-screen bg-white flex flex-col overflow-hidden select-none"
    >
        <div class="ml-6 mr-6 mb-6 mt-8 flex flex-col flex-1 min-h-0">
            <div class="h-10 flex items-center text-xl select-none">
                任务列表
            </div>
            <div
                class="flex-1 flex flex-col gap-3 overflow-y-auto mt-3 min-h-0"
            >
                <TaskItem
                    :tasks="taskStore.importantTasks"
                    :toggleTask="toggleTask"
                />
                <div
                    class="h-8 border border-gray-200 bg-gray-50 select-none w-fit rounded-md flex justify-center items-center px-2 text-sm hover:bg-gray-200 shrink-0"
                    @click="showOthers = !showOthers"
                >
                    <span
                        v-if="showOthers"
                        class="flex items-center justify-center"
                    >
                        <icon-down
                            theme="outline"
                            size="24"
                            fill="#333"
                            :strokeWidth="2"
                            strokeLinecap="square"
                        />
                    </span>
                    <span v-else class="flex items-center justify-center">
                        <icon-right
                            theme="outline"
                            size="24"
                            fill="#333"
                            :strokeWidth="2"
                            strokeLinecap="square"
                        />
                    </span>
                    次要任务
                    <span class="text-gray-400"
                        >（{{ taskStore.lowPriorityTasks.length }}）</span
                    >
                </div>
                <TaskItem
                    :tasks="showOthers ? taskStore.lowPriorityTasks : []"
                    :toggleTask="toggleTask"
                />
            </div>
        </div>
    </main>
</template>
