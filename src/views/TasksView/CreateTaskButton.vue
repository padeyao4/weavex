<template>
    <div @click="showTaskForm = true">创建任务</div>
    <el-dialog v-model="showTaskForm" title="创建任务" width="400px">
        <el-form :model="newTaskForm" label-width="80px">
            <el-form-item label="标题" required>
                <el-input
                    v-model="newTaskForm.name"
                    placeholder="请输入任务标题"
                />
            </el-form-item>
        </el-form>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="showTaskForm = false">取消</el-button>
                <el-button type="primary" @click="createTask"> 创建 </el-button>
            </span>
        </template>
    </el-dialog>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { PGraph } from "@/types";
import { useGraphsStore } from "@/stores";
import { GraphUtils } from "@/utils";

const showTaskForm = ref(false);
const newTaskForm = ref<Partial<PGraph>>({});
const graphsStore = useGraphsStore();

const createTask = () => {
    const graph = GraphUtils.createGraph(newTaskForm.value);
    graphsStore.addGraph(graph);
    showTaskForm.value = false;
    newTaskForm.value = {};
};
</script>
