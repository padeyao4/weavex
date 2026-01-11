<template>
    <WindowsTitleBar />
    <div class="h-screen w-screen flex bg-[#f7f7f7] overflow-hidden">
        <aside
            class="w-14 h-screen flex flex-col shrink-0 items-center pt-9 pb-1"
        >
            <NavItem
                route-name="taskMenu"
                :icon-component="'icon-list-success'"
            />
            <NavItem route-name="note" :icon-component="'icon-notebook'" />
            <NavItem
                v-if="configStore.config.testMode"
                route-name="testPage"
                :icon-component="'icon-experiment-one'"
            />
            <NavItem
                route-name="settings"
                :icon-component="'icon-setting-two'"
                position="bottom"
                :is-last="true"
            />
        </aside>
        <router-view class="flex-1 border-l border-gray-200 rounded-tl-lg" />
    </div>
</template>

<script setup lang="ts">
import WindowsTitleBar from "@/components/WindowsTitleBar.vue";
import { useConfigStore } from "@/stores/config";
import NavItem from "./NavItem.vue";

const configStore = useConfigStore();
</script>
