<template>
  <FramePage>
    <div class="flex h-screen w-screen overflow-hidden bg-[#f7f7f7]">
      <aside
        class="flex h-screen w-14 shrink-0 flex-col items-center pt-9 pb-1"
      >
        <NavItem route-name="taskMenu" :icon-component="'icon-list-success'" />
        <NavItem route-name="noteMenu" :icon-component="'icon-notebook'" />
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
      <router-view class="flex-1 rounded-tl-lg border-l border-gray-200" />
    </div>
  </FramePage>
</template>

<script setup lang="ts">
import FramePage from "@/components/FramePage.vue";
import { useConfigStore } from "@/stores/config";
import NavItem from "./NavItem.vue";

const configStore = useConfigStore();
</script>
