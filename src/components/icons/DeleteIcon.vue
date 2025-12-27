<template>
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4L12 12" :stroke="iconColor" stroke-width="1.5" stroke-linecap="round" />
        <path d="M12 4L4 12" :stroke="iconColor" stroke-width="1.5" stroke-linecap="round" />
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
