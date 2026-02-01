<template>
  <div @click="handleClickOutside" class="flex h-full w-full flex-row">
    <menu-frame
      class="flex shrink-0 flex-col pt-7.5 select-none"
      @contextmenu.prevent
    >
      <div class="border-b border-gray-200">
        <router-link
          :to="{ name: 'taskSummary' }"
          custom
          replace
          v-slot="{ navigate, isActive }"
        >
          <div
            class="m-1 flex h-10 flex-row items-center rounded-md pr-2 pl-3 transition-colors duration-200 hover:bg-[#eee]"
            @click="navigate"
            :class="isActive ? 'rounded-md bg-[#eee]' : ''"
          >
            <icon-sun-one
              theme="outline"
              size="18"
              fill="#6b7280"
              :strokeWidth="2"
            />
            <div class="ml-3 text-sm font-normal text-gray-700 select-none">
              我的一天
            </div>
            <div
              v-if="taskStore.importantTasks.length > 0"
              class="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-[#00000020] text-xs font-light"
            >
              {{ taskStore.importantTasks.length }}
            </div>
          </div>
        </router-link>
      </div>

      <div class="flex min-h-0 flex-1 flex-col">
        <div class="mt-1 flex-1 overflow-y-auto">
          <div class="flex flex-col gap-1">
            <SortableList
              :list="graphsStore.graphsMeta"
              :update="debounceHandleGraphDrag"
            >
              <template #default="{ item }">
                <router-link
                  :to="{
                    name: 'taskGraph',
                    params: { taskId: item.id },
                  }"
                  custom
                  v-slot="{ navigate, isActive }"
                >
                  <div
                    @click="navigate"
                    :class="{
                      'rounded-md bg-[#eee]': isActive,
                    }"
                    class="group mr-1 ml-1 flex h-9 cursor-default flex-row items-center pl-3 transition-colors duration-200 hover:rounded-md hover:bg-[#eee]"
                    :data-draggable-move="item.id"
                  >
                    <icon-chart-graph
                      theme="outline"
                      size="18"
                      fill="#6b7280"
                      :strokeWidth="2"
                    />
                    <div
                      class="min-w-0 flex-1 overflow-hidden pl-3 text-sm font-normal text-ellipsis whitespace-nowrap text-gray-700 select-none"
                    >
                      {{ item.name }}
                    </div>
                    <div
                      class="m-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-sm opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:bg-gray-300"
                      @click.stop="showContextMenu($event, item.id, item.name)"
                    >
                      <icon-more-one
                        theme="outline"
                        size="16"
                        fill="#333"
                        :strokeWidth="2"
                        strokeLinecap="square"
                      />
                    </div>
                  </div>
                </router-link>
              </template>
            </SortableList>
          </div>
        </div>
      </div>
      <div
        class="flex h-12 items-center justify-center border-t border-gray-200 p-1"
      >
        <div
          @click="formData.visible = true"
          class="flex h-full w-full flex-row items-center rounded-md p-1 pl-3 transition-colors duration-200 hover:rounded-md hover:bg-gray-100"
        >
          <icon-plus
            theme="outline"
            size="18"
            fill="#6b7280"
            :strokeWidth="2"
          />
          <div class="ml-3 text-sm font-normal text-gray-700 select-none">
            创建项目
          </div>
        </div>
      </div>
    </menu-frame>
    <router-view :key="$route.fullPath" class="min-h-0 min-w-0 flex-1" />
    <teleport to="body">
      <!-- 右键菜单组件 -->
      <ContextMenu
        :visible="contextMenu.visible"
        :x="contextMenu.x"
        :y="contextMenu.y"
        :graph-id="contextMenu.graphId"
        :graph-name="contextMenu.graphName"
        @rename="openRenameDialog"
        @delete="deleteGraph"
        @close="closeContextMenu"
      />

      <!-- 重命名对话框组件 -->
      <RenameDialog
        :visible="renameDialog.visible"
        :name="renameDialog.name"
        :graph-id="renameDialog.graphId"
        @update:visible="handleRenameDialogClose"
        @update:name="(value) => (renameDialog.name = value)"
        @confirm="renameGraph"
      />

      <!-- 创建项目对话框组件 -->
      <CreateProjectDialog
        :visible="formData.visible"
        @update:visible="(value) => (formData.visible = value)"
        @confirm="createTaskGraph"
      />
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { useGraphStore, useTaskStore } from "@/stores";
import { GraphUtils } from "@/utils";
import { reactive, onMounted } from "vue";
import router from "@/router";
import ContextMenu from "./ContextMenu.vue";
import RenameDialog from "./RenameDialog.vue";
import SortableList from "@/components/SortableList.vue";
import CreateProjectDialog from "./CreateProjectDialog.vue";
import MenuFrame from "@/components/MenuFrame.vue";
import { PGraph } from "@/types";
import { debounce } from "lodash-es";

const graphsStore = useGraphStore();
const taskStore = useTaskStore();

const formData = reactive({
  visible: false,
  name: "",
});

// 确保有活动的子路由
onMounted(() => {
  const currentRoute = router.currentRoute.value;
  // 如果当前路由是taskMenu本身（没有子路由），则跳转到taskSummary
  if (
    currentRoute.name === "taskMenu" ||
    !currentRoute.matched.some(
      (route) => route.name === "taskSummary" || route.name === "taskGraph",
    )
  ) {
    router.replace({ name: "taskSummary" });
  }
});

// 右键菜单状态
const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  graphId: "",
  graphName: "",
});

// 重命名对话框状态
const renameDialog = reactive({
  visible: false,
  name: "",
  graphId: "",
});

const createTaskGraph = (name: string) => {
  const newGraph = GraphUtils.createGraph({ name: name.trim() });
  graphsStore.addGraph(newGraph, { persist: true });
  router.push({ name: "taskGraph", params: { taskId: newGraph.id } });
};

// 显示右键菜单
const showContextMenu = (
  event: MouseEvent,
  graphId: string,
  graphName: string,
) => {
  event.preventDefault();
  event.stopPropagation();

  contextMenu.visible = true;
  contextMenu.x = event.clientX;
  contextMenu.y = event.clientY;
  contextMenu.graphId = graphId;
  contextMenu.graphName = graphName;
};

// 关闭右键菜单
const closeContextMenu = () => {
  contextMenu.visible = false;
};

// 删除项目
const deleteGraph = (graphId: string) => {
  // 获取当前路由
  const currentRoute = router.currentRoute.value;

  // 检查当前是否在要删除的项目的页面
  const isOnDeletedGraphPage =
    currentRoute.name === "taskGraph" &&
    String(currentRoute.params.taskId) === graphId;

  // 删除项目
  graphsStore.removeGraph(graphId, { persist: true });
  closeContextMenu();

  // 如果当前在要删除的项目的页面，则跳转到任务概览页
  if (isOnDeletedGraphPage) {
    router.replace({ name: "taskSummary" });
  }
};

// 打开重命名对话框
const openRenameDialog = (graphId: string, graphName: string) => {
  renameDialog.visible = true;
  renameDialog.name = graphName;
  renameDialog.graphId = graphId;
};

// 重命名项目
const renameGraph = (graphId: string, name: string) => {
  graphsStore.updateGraph(
    { id: graphId, name },
    { persist: true, update: true },
  );
  renameDialog.visible = false;
};

// 当重命名对话框关闭时重置状态
const handleRenameDialogClose = () => {
  renameDialog.visible = false;
};

// 点击其他地方关闭右键菜单
const handleClickOutside = () => {
  if (contextMenu.visible) {
    closeContextMenu();
  }
};

// 处理项目拖拽排序
const handleGraphDrag = (current: PGraph, other: PGraph) => {
  // 如果优先级相同，添加随机值避免冲突
  if (current.priority === other.priority) {
    current.priority = (current.priority ?? 0) + Math.random() * 100;
    other.priority = (other.priority ?? 0) + Math.random() * 100;
  }

  // 交换优先级
  [current.priority, other.priority] = [other.priority, current.priority];
};

// 使用防抖函数优化拖拽性能
const debounceHandleGraphDrag = debounce(handleGraphDrag, 10);
</script>
