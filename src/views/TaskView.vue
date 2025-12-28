<script setup lang="ts">
import { useGraphsStore } from "@/stores";
import { GraphUtils } from "@/utils";
import { reactive } from "vue";
import { ElMessage } from "element-plus";
const graphsStore = useGraphsStore();

const formData = reactive({
    visible: false,
    name: "",
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
    ElMessage.success("项目创建成功");
};
</script>

<template>
    <menu
        class="w-64 bg-gray-100 border-r border-gray-200 flex flex-col shrink-0 h-screen"
    >
        <router-link
            :to="{ name: 'taskSummary' }"
            custom
            replace
            v-slot="{ navigate, isActive }"
        >
            <div
                class="flex flex-row items-center h-12 hover:bg-amber-100 mt-3 pl-2 pr-2 m-1 hover:rounded-md no-underline"
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
                <div class="ml-2 no-underline">我的一天</div>
            </div>
        </router-link>
        <div class="bg-gray-200 border-b border-gray-200" />
        <div class="flex-1 flex-col gap-1 mt-1 overflow-y-auto">
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
                    <div class="pl-2 mr-auto">{{ item.name }}</div>
                    <div
                        class="flex justify-center items-center w-6 h-6 m-2 rounded-sm group-hover:opacity-100 opacity-0 hover:bg-amber-300"
                    >
                        <icon-more
                            theme="outline"
                            size="24"
                            fill="#333"
                            :strokeWidth="2"
                            strokeLinecap="square"
                        />
                    </div>
                </div>
            </router-link>
        </div>
        <div class="bg-gray-200 border-b border-gray-200" />
        <div class="h-14 flex p-1 justify-center items-center">
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
                <div class="ml-2">创建项目</div>
            </div>
        </div>
    </menu>
    <router-view :key="$route.fullPath" />
    <!-- <el-dialog title="创建项目" v-model="formData.visible" width="30%">
         <el-form :model="formData">
            <el-form-item label="项目名称">
                <el-input v-model="formData.name"></el-input>
            </el-form-item>
        </el-form>
        <span slot="footer" class="dialog-footer">
            <el-button @click="formData.visible = false">取 消</el-button>
            <el-button type="primary" @click="createTaskGraph()"
                >确 定</el-button
            >
        </span>
    </el-dialog> -->
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
                            @keyup.enter="createTaskGraph"
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
</template>
