<template>
    <div
        v-if="visible"
        class="fixed bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50"
        :style="{ left: x + 'px', top: y + 'px' }"
        @click.stop
    >
        <div
            class="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
            @click="handleRename"
        >
            <el-icon :size="14"><icon-edit /></el-icon>
            <span>重命名</span>
        </div>
        <div
            class="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2 text-red-500"
            @click="handleDelete"
        >
            <el-icon :size="14"><icon-delete /></el-icon>
            <span>删除</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { info } from "@tauri-apps/plugin-log";
import { ElMessageBox } from "element-plus";

interface Props {
    visible: boolean;
    x: number;
    y: number;
    graphId: string;
    graphName: string;
}

interface Emits {
    (e: "rename", graphId: string, graphName: string): void;
    (e: "delete", graphId: string): void;
    (e: "close"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const handleRename = () => {
    emit("rename", props.graphId, props.graphName);
    emit("close");
};

const handleDelete = async () => {
    try {
        emit("close");
        await ElMessageBox.confirm(
            "确定要删除这个项目吗？删除后无法恢复。",
            "确认删除",
            {
                confirmButtonText: "确定",
                cancelButtonText: "取消",
                type: "warning",
            },
        );
        emit("delete", props.graphId);
    } catch {
        info("用户点击了取消");
    }
};
</script>
