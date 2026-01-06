<template>
    <div class="h-screen w-screen flex flex-col bg-white overflow-hidden">
        <WindowsTitleBar v-if="true" />
        <div class="flex flex-row flex-1">
            <aside
                class="w-16 bg-gray-200 h-screen flex flex-col shrink-0 items-center gap-6 pt-10 border-gray-300 border-r"
            >
                <router-link
                    :to="{ name: 'taskMenu' }"
                    class="hover:bg-amber-100 hover:rounded-md flex items-center justify-center h-10 w-10"
                    active-class="bg-amber-100 rounded-md"
                >
                    <icon-list-success
                        theme="outline"
                        size="24"
                        fill="#333"
                        :strokeWidth="3"
                        strokeLinecap="square"
                    />
                </router-link>
                <router-link
                    :to="{ name: 'note' }"
                    class="hover:bg-amber-100 hover:rounded-md flex items-center justify-center h-10 w-10"
                    active-class="bg-amber-100 rounded-md"
                >
                    <icon-notebook
                        theme="outline"
                        size="24"
                        fill="#333"
                        :strokeWidth="3"
                        strokeLinecap="square"
                    />
                </router-link>
                <router-link
                    :to="{ name: 'settings' }"
                    active-class="bg-amber-100 rounded-md"
                    class="mt-auto mb-2 hover:bg-amber-100 hover:rounded-md p-2 h-10 w-10 flex justify-center align-center"
                >
                    <icon-setting-two
                        theme="outline"
                        size="24"
                        fill="#333"
                        :strokeWidth="3"
                        strokeLinecap="square"
                    />
                </router-link>
            </aside>
            <router-view />
        </div>
    </div>
</template>

<script setup lang="ts">
import WindowsTitleBar from "@/components/WindowsTitleBar.vue";
</script>
