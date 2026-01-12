<template>
  <router-link
    :to="{ name: routeName }"
    :class="[
      'flex h-10 w-10 items-center justify-center rounded-lg transition-colors duration-200 hover:bg-[#eee]',
      positionClass,
      { 'mb-4': !isLast },
    ]"
    active-class="bg-[#ededed]"
  >
    <component
      :is="iconComponent"
      :theme="iconTheme"
      :size="iconSize"
      :fill="iconColor"
      :strokeWidth="iconStrokeWidth"
    />
  </router-link>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  routeName: string;
  iconComponent: any;
  iconTheme?: string;
  iconSize?: string | number;
  iconColor?: string;
  iconStrokeWidth?: number;
  position?: "top" | "bottom";
  isLast?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  iconTheme: "outline",
  iconSize: "20",
  iconColor: "#6b7280",
  iconStrokeWidth: 2,
  position: "top",
  isLast: false,
});

const positionClass = computed(() => {
  return props.position === "bottom" ? "mt-auto" : "";
});
</script>
