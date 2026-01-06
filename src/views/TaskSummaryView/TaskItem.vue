<template>
    <template v-for="item in tasks" :key="item.id">
        <div
            class="px-3 h-12 bg-white shrink-0 flex items-center rounded-md border border-gray-200 task-item hover:border-gray-300 hover:bg-[#f5f5f5] transition-colors duration-200"
        >
            <div
                class="items-center relative flex w-5 h-5 checkbox-container-group"
                @click="toggleTask(item)"
            >
                <icon-round
                    theme="outline"
                    size="20"
                    fill="#9ca3af"
                    :strokeWidth="2"
                    strokeLinecap="square"
                    class="absolute"
                />
                <icon-check
                    class="absolute opacity-0 checkbox-container-group-hover:opacity-100 pointer-events-none transition-opacity duration-200"
                    theme="outline"
                    size="20"
                    fill="#3b82f6"
                    :strokeWidth="3"
                    strokeLinecap="square"
                />
            </div>
            <div
                class="ml-3 text-gray-700 text-sm font-normal"
                :class="{ 'line-through text-gray-400': item.completed }"
            >
                {{ item.name }}
            </div>
            <div
                class="m-2 ml-auto w-5 h-5 opacity-0 task-item:hover:opacity-100 transition-opacity duration-200"
                @click="taskStore.toggleImportant(item.id)"
            >
                <icon-star
                    v-if="importantTaskIds.includes(item.id)"
                    theme="filled"
                    size="20"
                    fill="#fbbf24"
                    :strokeWidth="2"
                    strokeLinecap="square"
                />
                <icon-star
                    v-else
                    theme="outline"
                    size="20"
                    fill="#9ca3af"
                    :strokeWidth="2"
                    strokeLinecap="square"
                />
            </div>
        </div>
    </template>
</template>

<script setup lang="ts">
import { useTaskStore } from "@/stores";
import { PNode } from "@/types";

interface Props {
    tasks: PNode[];
    toggleTask: (task: PNode) => void;
}

defineProps<Props>();

const taskStore = useTaskStore();
const importantTaskIds = taskStore.importantTaskIds;
</script>

<style scoped>
.task-item:hover .task-item\:hover\:opacity-100 {
    opacity: 1;
}

.checkbox-container-group:hover .checkbox-container-group-hover\:opacity-100 {
    opacity: 1;
}
</style>
