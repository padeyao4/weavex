<script setup lang="ts">
import { useGraphStore } from "@/stores";
import { GraphUtils } from "@/utils";
import { reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { router } from "@/router";

const graphsStore = useGraphStore();

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
const deleteGraph = async (graphId: string) => {
    try {
        await ElMessageBox.confirm(
            "确定要删除这个项目吗？删除后无法恢复。",
            "确认删除",
            {
                confirmButtonText: "确定",
                cancelButtonText: "取消",
                type: "warning",
            },
        );

        graphsStore.removeGraph(graphId);
        ElMessage.success("项目删除成功");
        closeContextMenu();
    } catch {
        // 用户点击了取消
    }
};

// 打开重命名对话框
const openRenameDialog = (graphId: string, graphName: string) => {
    renameDialog.visible = true;
    renameDialog.name = graphName;
    renameDialog.graphId = graphId;
    closeContextMenu();
};

// 重命名项目
const renameGraph = (e?: KeyboardEvent) => {
    if (!renameDialog.name.trim()) {
        return;
    }

    graphsStore.updateGraph(renameDialog.graphId, {
        name: renameDialog.name.trim(),
    });
    renameDialog.visible = false;
    renameDialog.name = "";
    e?.preventDefault();
};

// 点击其他地方关闭右键菜单
const handleClickOutside = () => {
    if (contextMenu.visible) {
        closeContextMenu();
    }
};
</script>

<template>
    <div @click="handleClickOutside" class="flex flex-row">
        <menu
            class="w-64 bg-gray-100 border-r border-gray-200 flex flex-col shrink-0 h-screen"
        >
            <div class="border-b border-gray-200">
                <router-link
                    :to="{ name: 'taskSummary' }"
                    custom
                    replace
                    v-slot="{ navigate, isActive }"
                >
                    <div
                        class="flex flex-row items-center h-12 hover:bg-amber-100 mt-3 pl-2 pr-2 m-1 hover:rounded-md"
                        @click="navigate"
                        :class="isActive ? 'bg-amber-100' : ''"
                    >
                        <icon-sun-one
                            theme="outline"
                            size="24"
                            fill="#333"
                            :strokeWidth="2"
                            strokeLinecap="square"
                        />
                        <div class="ml-2 select-none">我的一天</div>
                    </div>
                </router-link>
            </div>

            <!-- <div class="bg-gray-200 border-b border-gray-200" /> -->
            <div class="flex-1 flex flex-col gap-1 mt-1 overflow-y-auto">
                <router-link
                    :to="{ name: 'taskGraph', params: { taskId: item.id } }"
                    custom
                    v-slot="{ navigate, isActive }"
                    v-for="item in graphsStore.graphsMeta"
                    :key="item.id"
                >
                    <div
                        @click="navigate"
                        :class="{ 'bg-amber-100': isActive }"
                        class="flex flex-row h-10 hover:bg-amber-100 items-center ml-1 mr-1 pl-2 hover:rounded-md group cursor-default"
                    >
                        <icon-chart-graph
                            theme="outline"
                            size="24"
                            fill="#333"
                            :strokeWidth="2"
                            strokeLinecap="square"
                        />
                        <div class="pl-2 mr-auto select-none">
                            {{ item.name }}
                        </div>
                        <div
                            class="flex justify-center items-center w-6 h-6 m-2 rounded-sm group-hover:opacity-100 opacity-0 hover:bg-amber-300 cursor-pointer"
                            @click.stop="
                                showContextMenu($event, item.id, item.name)
                            "
                        >
                            <el-icon :size="16">
                                <icon-more />
                            </el-icon>
                        </div>
                    </div>
                </router-link>
            </div>
            <div
                class="h-14 flex p-1 justify-center items-center border-t border-gray-200"
            >
                <div
                    @click="formData.visible = true"
                    class="h-full w-full p-1 hover:bg-amber-100 hover:rounded-md flex flex-row items-center pl-2"
                >
                    <icon-plus
                        theme="outline"
                        size="24"
                        fill="#333"
                        :strokeWidth="3"
                        strokeLinecap="square"
                    />
                    <div class="ml-2 select-none">创建项目</div>
                </div>
            </div>
        </menu>
        <router-view
            :key="$route.fullPath"
            class="h-screen"
            :style="{ width: 'calc(100vw - 64px - 256px)' }"
        />

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

        <!-- 右键菜单 -->
        <div
            v-if="contextMenu.visible"
            class="fixed bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50"
            :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
            @click.stop
        >
            <div
                class="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                @click="
                    openRenameDialog(contextMenu.graphId, contextMenu.graphName)
                "
            >
                <el-icon :size="14"><icon-edit /></el-icon>
                <span>重命名</span>
            </div>
            <div
                class="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2 text-red-500"
                @click="deleteGraph(contextMenu.graphId)"
            >
                <el-icon :size="14"><icon-delete /></el-icon>
                <span>删除</span>
            </div>
        </div>

        <!-- 重命名对话框 -->
        <div
            class="h-screen w-screen bg-black/50 absolute left-0 right-0 top-0 transition-opacity duration-300"
            :class="{
                hidden: !renameDialog.visible,
                'opacity-0': !renameDialog.visible,
                'opacity-100': renameDialog.visible,
            }"
            @click.self="renameDialog.visible = false"
            style="z-index: 9999"
        >
            <div
                class="absolute w-1/3 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border border-gray-300 bg-white rounded-md shadow-lg transition-all duration-300"
                :class="{
                    'scale-95 opacity-0': !renameDialog.visible,
                    'scale-100 opacity-100': renameDialog.visible,
                }"
            >
                <div class="flex flex-col m-4 py-2 justify-center items-center">
                    <h3 class="text-lg font-semibold mb-4">重命名项目</h3>
                    <el-form class="w-full">
                        <el-form-item label="项目名称:" required>
                            <el-input
                                v-model="renameDialog.name"
                                placeholder="请输入项目名称"
                                @keydown.enter="renameGraph"
                                :maxlength="50"
                                show-word-limit
                            ></el-input>
                        </el-form-item>
                    </el-form>
                    <div class="flex gap-2 mt-4">
                        <el-button @click="renameDialog.visible = false"
                            >取 消</el-button
                        >
                        <el-button type="primary" @click="renameGraph()"
                            >确 定</el-button
                        >
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
