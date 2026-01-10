<template>
    <WindowsTitleBar />
    <div class="h-screen w-screen flex bg-white overflow-hidden">
        <aside
            class="w-14 h-screen flex flex-col shrink-0 items-center pt-9 pb-1"
        >
            <router-link
                :to="{ name: 'taskMenu' }"
                class="hover:bg-gray-100 rounded-lg flex items-center justify-center h-10 w-10 mb-4 transition-colors duration-200"
                active-class="bg-gray-100"
            >
                <icon-list-success
                    theme="outline"
                    size="20"
                    fill="#6b7280"
                    :strokeWidth="2"
                />
            </router-link>
            <router-link
                :to="{ name: 'note' }"
                class="hover:bg-gray-100 rounded-lg flex items-center justify-center h-10 w-10 mb-4 transition-colors duration-200"
                active-class="bg-gray-100"
            >
                <icon-notebook
                    theme="outline"
                    size="20"
                    fill="#6b7280"
                    :strokeWidth="2"
                />
            </router-link>
            <router-link
                v-if="configStore.config.testMode"
                :to="{ name: 'testPage' }"
                class="hover:bg-gray-100 rounded-lg flex items-center justify-center h-10 w-10 mb-4 transition-colors duration-200"
                active-class="bg-gray-100"
            >
                <icon-experiment-one
                    theme="outline"
                    size="20"
                    fill="#6b7280"
                    :strokeWidth="2"
                />
            </router-link>
            <router-link
                :to="{ name: 'settings' }"
                active-class="bg-gray-100"
                class="mt-auto hover:bg-gray-100 rounded-lg flex items-center justify-center h-10 w-10 transition-colors duration-200"
            >
                <icon-setting-two
                    theme="outline"
                    size="20"
                    fill="#6b7280"
                    :strokeWidth="2"
                />
            </router-link>
        </aside>
        <router-view class="flex-1 border-l border-gray-200 rounded-tl-lg" />
    </div>
</template>

<script setup lang="ts">
import WindowsTitleBar from "@/components/WindowsTitleBar.vue";
import { useConfigStore } from "@/stores/config";

const configStore = useConfigStore();
</script>
