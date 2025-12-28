<script setup lang="ts">
import { useGraphsStore } from "@/stores";
const graphsStore = useGraphsStore();
</script>

<template>
    <menu
        class="w-64 bg-gray-100 border-r border-gray-200 flex flex-col shrink-0 h-screen"
    >
        <router-link
            :to="{ name: 'taskSummary' }"
            custom
            replace
            v-slot="{ navigate, isActive }"
        >
            <div
                class="flex flex-row items-center h-12 hover:bg-amber-100 mt-3 pl-2 pr-2 m-1 hover:rounded-md no-underline"
                @click="navigate"
                :class="isActive ? 'bg-amber-100' : ''"
            >
                <icon-sun-one
                    theme="outline"
                    size="24"
                    fill="#333"
                    :strokeWidth="2"
                    strokeLinecap="square"
                />
                <div class="ml-2 no-underline">我的一天</div>
            </div>
        </router-link>
        <div class="bg-gray-200 border-b border-gray-200" />
        <div class="flex-1 flex-col gap-1 mt-1 overflow-y-auto">
            <router-link
                :to="{ name: 'taskGraph', params: { taskId: item.id } }"
                custom
                v-slot="{ navigate, isActive }"
                v-for="item in graphsStore.graphsMeta"
                :key="item.id"
            >
                <div
                    @click="navigate"
                    :class="{ 'bg-amber-100': isActive }"
                    class="flex flex-row h-10 hover:bg-amber-100 items-center ml-1 mr-1 pl-2 hover:rounded-md group cursor-default"
                >
                    <icon-chart-graph
                        theme="outline"
                        size="24"
                        fill="#333"
                        :strokeWidth="2"
                        strokeLinecap="square"
                    />
                    <div class="pl-2 mr-auto">{{ item.name }}</div>
                    <div
                        class="flex justify-center items-center w-6 h-6 m-2 rounded-sm group-hover:opacity-100 opacity-0 hover:bg-amber-300"
                    >
                        <icon-more
                            theme="outline"
                            size="24"
                            fill="#333"
                            :strokeWidth="2"
                            strokeLinecap="square"
                        />
                    </div>
                </div>
            </router-link>
        </div>
        <div class="bg-gray-200 border-b border-gray-200" />
        <div class="h-14 flex p-1 justify-center items-center">
            <div
                class="h-full w-full p-1 hover:bg-amber-100 hover:rounded-md flex flex-row items-center pl-2"
            >
                <icon-plus
                    theme="outline"
                    size="24"
                    fill="#333"
                    :strokeWidth="3"
                    strokeLinecap="square"
                />
                <div class="ml-2">创建项目</div>
            </div>
        </div>
    </menu>
    <router-view :key="$route.fullPath" />
</template>
