<template>
    <template v-for="item in tasks" :key="item.id">
        <div
            class="px-2 h-16 bg-amber-100 shrink-0 flex items-center rounded-lg border task-item"
        >
            <div
                class="items-center relative flex w-6 h-6 checkbox-container-group"
                @click="toggleTask(item)"
            >
                <icon-round
                    theme="outline"
                    size="24"
                    fill="#333"
                    :strokeWidth="2"
                    strokeLinecap="square"
                    class="absolute"
                />
                <icon-check
                    class="absolute opacity-0 checkbox-container-group-hover:opacity-100 pointer-events-none transition-opacity duration-200"
                    theme="outline"
                    size="30"
                    fill="#333"
                    :strokeWidth="2"
                    strokeLinecap="square"
                />
            </div>
            <div class="ml-2">
                {{ item.name }}
            </div>
            <div
                class="m-2 ml-auto w-6 h-6 opacity-0 task-item:hover:opacity-100 transition-opacity duration-200"
                @click="taskStore.toggleImportant(item.id)"
            >
                <icon-star
                    v-if="importantTaskIds.includes(item.id)"
                    theme="filled"
                    size="24"
                    fill="#4a90e2"
                    :strokeWidth="2"
                    strokeLinecap="square"
                />
                <icon-star
                    v-else
                    theme="outline"
                    size="24"
                    fill="#333"
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
