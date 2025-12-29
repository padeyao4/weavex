<script setup lang="ts">
import { useGraphStore } from "@/stores";
import { PNode } from "@/types";
import { GraphUtils } from "@/utils";
import { computed } from "vue";
const graphStore = useGraphStore();

const taskList = computed(() => {
    return Object.values(graphStore.allGraph).flatMap((graph) => {
        return GraphUtils.traverseGraph(graph, (n, g) => {
            const prevsCompleted = n.prevs
                .map((pre) => g.nodes[pre].completed)
                .every((completed) => completed);
            const childrenCompleted = n.children
                .map((childId) => g.nodes[childId].completed)
                .every((completed) => completed);
            return prevsCompleted && childrenCompleted && !n.completed;
        });
    });
});

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
                <div
                    v-for="item in taskList"
                    class="px-2 h-16 bg-amber-100 shrink-0 flex items-center rounded-lg border"
                >
                    <div
                        class="items-center relative flex w-6 h-6 group"
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
                            class="absolute opacity-0 group-hover:opacity-100 pointer-events-none"
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
                </div>
            </div>
        </div>
    </main>
</template>
