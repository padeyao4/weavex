<template>
    <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M5 3C3.89543 3 3 3.89543 3 5V15C3 16.1046 3.89543 17 5 17H15C16.1046 17 17 16.1046 17 15V5C17 3.89543 16.1046 3 15 3H5Z"
            :fill="fillColor"
            :stroke="strokeColor"
            stroke-width="1.5"
        />
        <path
            d="M8 7L12 10L8 13"
            :stroke="iconColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
        />
        <circle
            cx="14"
            cy="10"
            r="1.5"
            :fill="iconColor"
        />
    </svg>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
    active?: boolean;
    color?: string;
}

const props = withDefaults(defineProps<Props>(), {
    active: false,
    color: "",
});

const fillColor = computed(() => {
    if (props.active) return "var(--vscode-active-background)";
    if (props.color) return props.color;
    return "transparent";
});

const strokeColor = computed(() => {
    if (props.active) return "var(--vscode-focus-border)";
    if (props.color) return props.color;
    return "var(--vscode-border)";
});

const iconColor = computed(() => {
    if (props.active) return "var(--vscode-focus-border)";
    if (props.color) return props.color;
    return "var(--vscode-icon-foreground)";
});
</script>
