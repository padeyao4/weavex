<script setup lang="ts">
import { useTaskStore } from "@/stores";

import { ref } from "vue";
import TaskItem from "./TaskItem.vue";
import SortableList from "@/components/SortableList.vue";
import { debounce } from "lodash-es";
import { debug } from "@tauri-apps/plugin-log";
import NodeDetailForm from "@/components/NodeDetailForm.vue";
import type { TaskNode } from "@/stores/task";

const taskStore = useTaskStore();
// 每次打开这个页面启动清理无效的任务

const selectedTask = ref<TaskNode | null>(null);
const showOthers = ref(false);

const toggleTaskCompleted = (task: TaskNode) => {
  task.completed = !task.completed;
};

const toggleTaskFollowed = (task: TaskNode) => {
  task.isFollowed = !task.isFollowed;
  task.priority || (task.priority = Date.now());
};

function onUpdate(current: TaskNode, other: TaskNode) {
  if (current.priority === other.priority) {
    current.priority = (current.priority ?? 0) + Math.random() * 100;
    other.priority = (other.priority ?? 0) + Math.random() * 100;
  }
  [current.priority, other.priority] = [other.priority, current.priority];
  debug(`Dragging completed, ${current.priority} <-> ${other.priority}`);
}

const debounceUpdate = debounce(onUpdate, 10);

const handleTaskClick = (task: TaskNode) => {
  if (selectedTask.value?.id === task.id) {
    // 点击同一个任务，关闭弹窗
    selectedTask.value = null;
  } else {
    // 点击不同任务，打开弹窗
    selectedTask.value = task;
  }
};

const handleSave = () => {
  // 保存节点更新
  selectedTask.value = null;
};

const handleCancel = () => {
  selectedTask.value = null;
};
</script>

<template>
  <main class="flex flex-row select-none">
    <div class="mt-7.5 flex min-h-0 min-w-0 flex-1 flex-col">
      <div class="flex h-12 items-center px-4 text-xl select-none">
        任务列表
      </div>
      <div class="min-h-0 min-w-0 flex-1 overflow-y-auto px-4">
        <div class="my-2 flex min-h-0 min-w-0 flex-1 flex-col gap-3">
          <SortableList
            :list="taskStore.importantTasks"
            :update="debounceUpdate"
          >
            <template #default="{ item }">
              <div
                @click="handleTaskClick(item)"
                :class="{ 'selected-task': selectedTask?.id === item.id }"
              >
                <TaskItem
                  :task="item"
                  :data-draggable-move="item.id"
                  @toggle-task-completed="toggleTaskCompleted"
                  @toggle-task-followed="toggleTaskFollowed"
                />
              </div>
            </template>
          </SortableList>
          <div
            class="flex h-8 w-fit shrink-0 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-2 text-sm select-none hover:bg-gray-200"
            @click="showOthers = !showOthers"
          >
            <span v-if="showOthers" class="flex items-center justify-center">
              <icon-down
                theme="outline"
                size="24"
                fill="#333"
                :strokeWidth="2"
                strokeLinecap="square"
              />
            </span>
            <span v-else class="flex items-center justify-center">
              <icon-right
                theme="outline"
                size="24"
                fill="#333"
                :strokeWidth="2"
                strokeLinecap="square"
              />
            </span>
            次要任务
            <span class="text-gray-400"
              >（{{ taskStore.lowPriorityTasks.length }}）</span
            >
          </div>
          <SortableList
            :list="showOthers ? taskStore.lowPriorityTasks : []"
            :update="debounceUpdate"
          >
            <template #default="{ item }">
              <div
                @click="handleTaskClick(item)"
                :class="{ 'selected-task': selectedTask?.id === item.id }"
              >
                <TaskItem
                  :task="item"
                  :data-draggable-move="item.id"
                  @toggle-task-completed="toggleTaskCompleted"
                  @toggle-task-followed="toggleTaskFollowed"
                />
              </div>
            </template>
          </SortableList>
        </div>
      </div>
    </div>
    <NodeDetailForm
      v-if="selectedTask"
      :node="selectedTask"
      :graphId="selectedTask.graphId"
      @save="handleSave"
      @cancel="handleCancel"
      class="w-80 border-l border-gray-200"
    />
  </main>
</template>

<style scoped>
.selected-task {
  border-radius: 6px;
  background-color: #f0f9ff;
  border: 1px solid #3b82f6;
}

.selected-task .task-item {
  border-color: transparent;
  background-color: transparent;
}
</style>
