<template>
    <div
        class="h-screen w-screen bg-black/50 absolute left-0 right-0 top-0 transition-opacity duration-300"
        :class="{
            hidden: !visible,
            'opacity-0': !visible,
            'opacity-100': visible,
        }"
        @click.self="handleClose"
        style="z-index: 9999"
    >
        <div
            class="absolute w-1/3 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border border-gray-300 bg-white rounded-md shadow-lg transition-all duration-300"
            :class="{
                'scale-95 opacity-0': !visible,
                'scale-100 opacity-100': visible,
            }"
        >
            <div class="flex flex-col m-4 py-2 justify-center items-center">
                <h3 class="text-lg font-semibold mb-4">创建新项目</h3>
                <el-form :model="formData" class="w-full">
                    <el-form-item label="项目名称:" required>
                        <el-input
                            v-model="formData.name"
                            placeholder="请输入项目名称"
                            @keydown.enter="handleConfirm"
                            :maxlength="50"
                            show-word-limit
                        ></el-input>
                    </el-form-item>
                </el-form>
                <div class="flex gap-2 mt-4">
                    <el-button @click="handleClose">取 消</el-button>
                    <el-button type="primary" @click="handleConfirm"
                        >确 定</el-button
                    >
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, watch } from "vue";
import { ElMessage } from "element-plus";

interface Props {
    visible: boolean;
}

interface Emits {
    (e: "update:visible", value: boolean): void;
    (e: "confirm", name: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const formData = reactive({
    name: "",
});

// 监听visible变化，重置表单
watch(
    () => props.visible,
    (newVisible) => {
        if (newVisible) {
            formData.name = "";
        }
    },
);

const handleClose = () => {
    emit("update:visible", false);
};

const handleConfirm = () => {
    if (!formData.name.trim()) {
        ElMessage.warning("请输入项目名称");
        return;
    }
    emit("confirm", formData.name.trim());
    emit("update:visible", false);
};
</script>
