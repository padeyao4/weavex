<script setup lang="ts">
import { onMounted } from "vue";
import SettingsItem from "./SettingsItem.vue";
import { version } from "@/../package.json";


onMounted(() => { });
</script>
<template>
    <SettingsItem>
        <template #description>
            <div>当前版本: {{ version }}</div>
        </template>
    </SettingsItem>
</template>
