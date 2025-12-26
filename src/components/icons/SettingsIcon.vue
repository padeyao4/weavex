<template>
    <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M10 3C6.13401 3 3 6.13401 3 10C3 13.866 6.13401 17 10 17C13.866 17 17 13.866 17 10C17 6.13401 13.866 3 10 3Z"
            :fill="fillColor"
            :stroke="strokeColor"
            stroke-width="1.5"
        />
        <circle
            cx="10"
            cy="10"
            r="2.5"
            :fill="iconColor"
        />
        <path
            d="M10 3V5"
            :stroke="iconColor"
            stroke-width="1.5"
            stroke-linecap="round"
        />
        <path
            d="M10 15V17"
            :stroke="iconColor"
            stroke-width="1.5"
            stroke-linecap="round"
        />
        <path
            d="M3 10H5"
            :stroke="iconColor"
            stroke-width="1.5"
            stroke-linecap="round"
        />
        <path
            d="M15 10H17"
            :stroke="iconColor"
            stroke-width="1.5"
            stroke-linecap="round"
        />
        <path
            d="M5.5 5.5L7 7"
            :stroke="iconColor"
            stroke-width="1.5"
            stroke-linecap="round"
        />
        <path
            d="M13 13L14.5 14.5"
            :stroke="iconColor"
            stroke-width="1.5"
            stroke-linecap="round"
        />
        <path
            d="M5.5 14.5L7 13"
            :stroke="iconColor"
            stroke-width="1.5"
            stroke-linecap="round"
        />
        <path
            d="M13 7L14.5 5.5"
            :stroke="iconColor"
            stroke-width="1.5"
            stroke-linecap="round"
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
