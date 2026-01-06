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
                <h3 class="text-lg font-semibold mb-4">重命名项目</h3>
                <el-form class="w-full">
                    <el-form-item label="项目名称:" required>
                        <el-input
                            v-model="localName"
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
import { ref, watch } from "vue";

interface Props {
    visible: boolean;
    name: string;
    graphId: string;
}

interface Emits {
    (e: "update:visible", value: boolean): void;
    (e: "update:name", value: string): void;
    (e: "confirm", graphId: string, name: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 使用本地 ref 来存储输入值
const localName = ref(props.name);

// 当 props.name 变化时更新本地值
watch(
    () => props.name,
    (newValue) => {
        localName.value = newValue;
    },
);

// 监听本地值的变化并触发更新事件
watch(localName, (newValue) => {
    emit("update:name", newValue);
});

const handleClose = () => {
    emit("update:visible", false);
};

const handleConfirm = (e?: KeyboardEvent) => {
    if (!localName.value.trim()) {
        return;
    }

    emit("confirm", props.graphId, localName.value.trim());
    emit("update:visible", false);
    e?.preventDefault();
};
</script>
