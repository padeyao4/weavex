<template>
    <div @click="handleClickOutside" class="flex flex-1 flex-row h-screen">
        <menu
            class="w-64 bg-white border-r border-gray-100 flex flex-col shrink-0 h-full pt-8"
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
                        class="flex flex-row items-center h-10 hover:bg-gray-100 pl-3 pr-2 m-1 rounded-md transition-colors duration-200"
                        @click="navigate"
                        :class="isActive ? 'bg-gray-100 rounded-md' : ''"
                    >
                        <icon-sun-one
                            theme="outline"
                            size="18"
                            fill="#6b7280"
                            :strokeWidth="2"
                        />
                        <div
                            class="ml-3 select-none text-gray-700 text-sm font-normal"
                        >
                            我的一天
                        </div>
                        <div
                            class="ml-auto rounded-full bg-[#00000020] text-xs font-light w-6 h-6 flex justify-center items-center"
                        >
                            {{ taskStore.importantTasks.length }}
                        </div>
                    </div>
                </router-link>
            </div>

            <div class="flex-1 flex flex-col min-h-0">
                <div class="flex-1 overflow-y-auto mt-1">
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
                                            'bg-gray-100 rounded-md': isActive,
                                        }"
                                        class="flex flex-row h-9 hover:bg-gray-100 items-center ml-1 mr-1 pl-3 hover:rounded-md group cursor-default transition-colors duration-200"
                                        :data-draggable-move="item.id"
                                    >
                                        <icon-chart-graph
                                            theme="outline"
                                            size="18"
                                            fill="#6b7280"
                                            :strokeWidth="2"
                                        />
                                        <div
                                            class="pl-3 mr-auto select-none text-gray-700 text-sm font-normal"
                                        >
                                            {{ item.name }}
                                        </div>
                                        <div
                                            class="flex justify-center items-center w-6 h-6 m-2 rounded-sm group-hover:opacity-100 opacity-0 hover:bg-gray-300 cursor-pointer transition-opacity duration-200"
                                            @click.stop="
                                                showContextMenu(
                                                    $event,
                                                    item.id,
                                                    item.name,
                                                )
                                            "
                                        >
                                            <el-icon :size="14">
                                                <icon-more />
                                            </el-icon>
                                        </div>
                                    </div>
                                </router-link>
                            </template>
                        </SortableList>
                    </div>
                </div>
            </div>
            <div
                class="h-12 flex p-1 justify-center items-center border-t border-gray-200"
            >
                <div
                    @click="formData.visible = true"
                    class="h-full w-full p-1 hover:bg-gray-100 hover:rounded-md flex flex-row items-center pl-3 transition-colors duration-200 rounded-md"
                >
                    <icon-plus
                        theme="outline"
                        size="18"
                        fill="#6b7280"
                        :strokeWidth="2"
                    />
                    <div
                        class="ml-3 select-none text-gray-700 text-sm font-normal"
                    >
                        创建项目
                    </div>
                </div>
            </div>
        </menu>
        <router-view :key="$route.fullPath" class="h-full flex-1 bg-white" />

        <!-- 创建项目对话框 -->
        <div
            class="h-screen w-screen bg-black/50 absolute left-0 right-0 top-0 transition-opacity duration-300"
            :class="{
                hidden: !formData.visible,
                'opacity-0': !formData.visible,
                'opacity-100': formData.visible,
            }"
            @click.self="formData.visible = false"
            style="z-index: 9999"
        >
            <div
                class="absolute w-1/3 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border border-gray-300 bg-white rounded-md shadow-lg transition-all duration-300"
                :class="{
                    'scale-95 opacity-0': !formData.visible,
                    'scale-100 opacity-100': formData.visible,
                }"
            >
                <div class="flex flex-col m-4 py-2 justify-center items-center">
                    <h3 class="text-lg font-semibold mb-4">创建新项目</h3>
                    <el-form :model="formData" class="w-full">
                        <el-form-item label="项目名称:" required>
                            <el-input
                                v-model="formData.name"
                                placeholder="请输入项目名称"
                                @keydown.enter="
                                    (e: any) => {
                                        createTaskGraph();
                                        e.preventDefault();
                                    }
                                "
                                :maxlength="50"
                                show-word-limit
                            ></el-input>
                        </el-form-item>
                    </el-form>
                    <div class="flex gap-2 mt-4">
                        <el-button @click="formData.visible = false"
                            >取 消</el-button
                        >
                        <el-button type="primary" @click="createTaskGraph()"
                            >确 定</el-button
                        >
                    </div>
                </div>
            </div>
        </div>

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
    </div>
</template>

<script setup lang="ts">
import { useGraphStore, useTaskStore } from "@/stores";
import { GraphUtils } from "@/utils";
import { reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { router } from "@/router";
import ContextMenu from "./ContextMenu.vue";
import RenameDialog from "./RenameDialog.vue";
import SortableList from "@/components/SortableList.vue";
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
            (route) =>
                route.name === "taskSummary" || route.name === "taskGraph",
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

const createTaskGraph = () => {
    if (!formData.name.trim()) {
        ElMessage.warning("请输入项目名称");
        return;
    }
    const newGraph = GraphUtils.createGraph({ name: formData.name.trim() });
    graphsStore.addGraph(newGraph);
    formData.name = "";
    formData.visible = false;
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
    graphsStore.removeGraph(graphId);
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
    graphsStore.updateGraph(graphId, { name });
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
