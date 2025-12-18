<template>
  <div @click="showTaskForm = true">创建任务</div>
  <el-dialog v-model="showTaskForm" title="创建任务" width="400px">
    <el-form :model="newTaskForm" label-width="80px">
      <el-form-item label="标题" required>
        <el-input v-model="newTaskForm.title" placeholder="请输入任务标题" />
      </el-form-item>
      <el-form-item label="描述">
        <el-input
          v-model="newTaskForm.description"
          type="textarea"
          placeholder="请输入任务描述"
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
import { useTaskStore } from "@/store/task";
import { PNode } from "@/utils";
import { ref } from "vue";

const taskStore = useTaskStore();
const showTaskForm = ref(false);
const newTaskForm = ref<Partial<PNode>>({});

const createTask = () => {
  showTaskForm.value = true;
  taskStore.add(newTaskForm.value);
  showTaskForm.value = false;
};
</script>
