<template>
  <div
    class="task-item flex h-12 w-full flex-1 flex-row items-center rounded-md border border-gray-200 bg-white px-3 transition-colors duration-200 hover:border-gray-300 hover:bg-[#f5f5f5]"
  >
    <div
      class="checkbox-container-group relative flex h-5 w-5 shrink-0 items-center"
      @click.stop="handleToggleTask"
    >
      <icon-round
        theme="outline"
        size="20"
        fill="#9ca3af"
        :strokeWidth="2"
        strokeLinecap="square"
        class="absolute"
      />
      <icon-check
        class="checkbox-container-group-hover:opacity-100 pointer-events-none absolute opacity-0 transition-opacity duration-200"
        theme="outline"
        size="20"
        fill="#3b82f6"
        :strokeWidth="3"
        strokeLinecap="square"
      />
    </div>
    <div
      class="ml-3 w-full min-w-0 overflow-hidden text-sm font-normal text-ellipsis whitespace-nowrap text-gray-700"
      :class="{ 'text-gray-400 line-through': task.completed }"
    >
      {{ task.name }}
    </div>
    <div
      class="task-item:hover:opacity-100 m-2 h-5 w-5 shrink-0 opacity-0 transition-opacity duration-200"
      @click.stop="handleTogglePriority"
    >
      <icon-star
        v-if="task.isFollowed"
        theme="filled"
        size="20"
        fill="#fbbf24"
        :strokeWidth="2"
        strokeLinecap="square"
      />
      <icon-star
        v-else
        theme="outline"
        size="20"
        fill="#9ca3af"
        :strokeWidth="2"
        strokeLinecap="square"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TaskNode } from "@/stores/task";

interface Props {
  task: TaskNode;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  toggleTaskCompleted: [task: TaskNode];
  toggleTaskFollowed: [task: TaskNode];
}>();

function handleToggleTask() {
  emit("toggleTaskCompleted", props.task);
}

function handleTogglePriority() {
  emit("toggleTaskFollowed", props.task);
}
</script>

<style scoped>
.task-item:hover .task-item\:hover\:opacity-100 {
  opacity: 1;
}

.checkbox-container-group:hover .checkbox-container-group-hover\:opacity-100 {
  opacity: 1;
}
</style>
