<template>
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="12" height="12" rx="2" :fill="fillColor" />
        <path d="M8 5V11" :stroke="iconColor" stroke-width="1.5" stroke-linecap="round" />
        <path d="M5 8H11" :stroke="iconColor" stroke-width="1.5" stroke-linecap="round" />
    </svg>
</template>

<script setup lang="ts">
interface Props {
    active?: boolean;
    color?: string;
}

const props = withDefaults(defineProps<Props>(), {
    active: false,
    color: "",
});

import { computed } from "vue";

const fillColor = computed(() => {
    if (props.active) return "var(--vscode-active-background)";
    if (props.color) return props.color;
    return "var(--vscode-button-background)";
});

const iconColor = computed(() => {
    if (props.active) return "var(--vscode-focus-border)";
    if (props.color) return props.color;
    return "var(--vscode-button-foreground)";
});
</script>
