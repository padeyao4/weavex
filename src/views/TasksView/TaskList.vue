<script setup lang="ts">
import CreateTaskButton from "./CreateTaskButton.vue";
import { useGraphsStore } from "@/stores";
import { ElScrollbar, ElMessageBox } from "element-plus";
import { ref } from "vue";
import { router } from "@/route";
import { useRoute } from "vue-router";

const route = useRoute();
const graphsStore = useGraphsStore();
const hoveredTaskId = ref<string | null>(null);

const deleteTask = async (taskId: string) => {
  try {
    await ElMessageBox.confirm(
      "确定要删除这个任务吗？此操作不可撤销。",
      "确认删除",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
        customClass: "delete-confirm-dialog",
      }
    );

    graphsStore.removeGraph(taskId);

    // 如果删除的是当前选中的任务，可能需要导航到其他页面
    // 这里可以根据需要添加导航逻辑
    if (route.params.taskId === taskId) {
      router.replace({ name: "tasksSummery" });
    }
  } catch (error) {
    // 用户取消了删除
    console.log("删除已取消");
  }
};

const routeToTask = (taskId: string) => {
  router.replace({ name: "taskGraph", params: { taskId } });
};
</script>

<template>
  <div class="task-list-container">
    <div class="task-list-header">
      <div class="header-title">
        <span class="title-text">任务列表</span>
      </div>
      <div class="header-actions">
        <button class="icon-button" title="搜索">
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="6"
              cy="6"
              r="4.5"
              stroke="var(--vscode-secondary-foreground)"
              stroke-width="1.5"
            />
            <path
              d="M10 10L13 13"
              stroke="var(--vscode-secondary-foreground)"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>
    </div>

    <div class="task-list-content">
      <div class="quick-access">
        <router-link
          :to="{ name: 'tasksSummery' }"
          class="quick-access-item"
          :class="{ active: $route.name === 'tasksSummery' }"
        >
          <span class="quick-access-text">我的一天</span>
        </router-link>
      </div>

      <div class="task-list-divider"></div>

      <div class="task-groups">
        <div class="task-items-container">
          <el-scrollbar class="task-scrollbar">
            <div class="task-items">
              <div
                v-for="meta in graphsStore.graphsMeta"
                :key="meta.id"
                class="task-item"
                :class="{
                  active: $route.params.id === meta.id,
                }"
                @mouseenter="hoveredTaskId = meta.id"
                @mouseleave="hoveredTaskId = null"
              >
                <div class="task-item-link" @click="routeToTask(meta.id)">
                  <div class="task-item-content flex flew-row h-10">
                    <div
                      class="task-item-title h-full grow overflow-hidden items-center"
                    >
                      {{ meta.name }}
                    </div>
                    <div
                      v-show="hoveredTaskId === meta.id"
                      class="delete-button flex shrink-0 justify-center items-center"
                      @click.stop="deleteTask(meta.id)"
                    >
                      D
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-scrollbar>
        </div>
      </div>
    </div>

    <div class="task-list-footer">
      <create-task-button />
    </div>
  </div>
</template>

<style scoped>
.task-list-container {
  width: 250px;
  height: 100vh;
  background-color: var(--vscode-sidebar-background);
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--vscode-border);
  user-select: none;
}

.task-list-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--vscode-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  flex-shrink: 0;
}

.title-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--vscode-foreground);
}

.header-actions {
  display: flex;
  gap: 4px;
}

.icon-button {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--vscode-secondary-foreground);
  cursor: pointer;
  padding: 0;
  transition: all 0.2s ease;
}

.icon-button:hover {
  background-color: var(--vscode-hover-background);
  color: var(--vscode-icon-hover-foreground);
}

.task-list-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.quick-access {
  padding: 12px 16px;
}

.quick-access-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  text-decoration: none;
  color: var(--vscode-secondary-foreground);
  border-radius: 4px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.quick-access-item:hover {
  background-color: var(--vscode-hover-background);
  color: var(--vscode-foreground);
}

.quick-access-item.active {
  background-color: var(--vscode-active-background);
  color: var(--vscode-foreground);
}

.quick-access-icon {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quick-access-text {
  font-size: 13px;
  font-weight: 500;
}

.task-list-divider {
  height: 1px;
  background-color: var(--vscode-border);
  margin: 0 16px;
}

.task-groups {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.task-group-header {
  padding: 12px 16px 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.group-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--vscode-secondary-foreground);
}

.group-count {
  font-size: 11px;
  font-weight: 500;
  color: var(--vscode-secondary-foreground);
  background-color: var(--vscode-active-background);
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

.task-items-container {
  flex: 1;
  overflow: hidden;
}

.task-scrollbar {
  height: 100%;
}

.task-scrollbar :deep(.el-scrollbar__wrap) {
  overflow-x: hidden;
}

.task-items {
  padding: 0 16px 16px;
}

.task-item {
  margin-bottom: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
}

.task-item:hover {
  background-color: var(--vscode-hover-background);
}

.task-item.active {
  background-color: var(--vscode-active-background);
}

.task-item-link {
  gap: 8px;
  padding: 8px 12px;
  text-decoration: none;
  color: var(--vscode-foreground);
  cursor: pointer;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.task-item-content {
  flex: 1;
  min-width: 0;
}

.task-item-title {
  font-size: 13px;
  line-height: 40px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-item.active .task-item-title {
  font-weight: 600;
}

.task-item-meta {
  margin-top: 2px;
}

.task-item-date {
  font-size: 11px;
  color: var(--vscode-secondary-foreground);
}

.task-item.active .task-item-date {
  color: var(--vscode-focus-border);
}

.delete-button {
  width: 30px;
  height: 30px;
  background: #fff;
  display: flex-inline;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  color: var(--vscode-secondary-foreground);
  cursor: pointer;
  padding: 0;
  margin-left: auto;
}

.task-item:hover .delete-button {
  opacity: 1;
}

.delete-button:hover {
  background-color: var(--vscode-error-background);
  color: var(--vscode-error-foreground);
}

.delete-button:hover svg path {
  stroke: var(--vscode-error-foreground);
}

.task-list-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--vscode-border);
  background-color: var(--vscode-sidebar-background);
}
</style>
