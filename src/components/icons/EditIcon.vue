<template>
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 5L11.5 4.5C12.0523 3.94772 12.9477 3.94772 13.5 4.5C14.0523 5.05228 14.0523 5.94772 13.5 6.5L13 7"
            :stroke="iconColor" stroke-width="1.5" stroke-linecap="round" />
        <path d="M8 8L11 11" :stroke="iconColor" stroke-width="1.5" stroke-linecap="round" />
        <path d="M5 13L3 13C2.44772 13 2 12.5523 2 12L2 10" :stroke="iconColor" stroke-width="1.5"
            stroke-linecap="round" />
        <path d="M5 13L11 7" :stroke="iconColor" stroke-width="1.5" stroke-linecap="round" />
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

const iconColor = computed(() => {
    if (props.active) return "var(--vscode-focus-border)";
    if (props.color) return props.color;
    return "var(--vscode-icon-foreground)";
});
</script>
