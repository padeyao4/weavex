<template>
    <div class="h-screen w-screen flex flex-col bg-white overflow-hidden">
        <WindowsTitleBar />
        <div class="flex flex-row flex-1">
            <aside
                class="w-14 bg-white h-screen flex flex-col shrink-0 items-center py-8 border-r border-gray-100"
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
            <main class="flex-1">
                <router-view />
            </main>
        </div>
    </div>
</template>

<script setup lang="ts">
import WindowsTitleBar from "@/components/WindowsTitleBar.vue";
</script>
