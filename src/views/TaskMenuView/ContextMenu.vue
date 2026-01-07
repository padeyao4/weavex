<template>
    <div
        v-if="visible"
        class="fixed bg-white z-50 min-w-32 shadow-sm rounded-lg m-1 border border-gray-200"
        :style="{ left: x + 'px', top: y + 'px' }"
        @click.stop
    >
        <div
            class="px-4 py-2.5 hover:bg-gray-50 hover:rounded-lg cursor-pointer text-sm text-gray-700 border-b border-gray-100"
            @click="handleRename"
        >
            重命名
        </div>
        <div
            class="px-4 py-2.5 hover:bg-gray-50 hover:rounded-lg cursor-pointer text-sm text-red-400"
            @click="handleDelete"
        >
            删除
        </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <div
        v-if="isDeleteDialogVisible"
        class="fixed inset-0 flex bg-[#00000050] items-center justify-center z-50"
        @click="cancelDelete"
    >
        <div
            class="bg-white rounded-lg shadow-lg p-6 w-80 max-w-xs mx-auto"
            @click.stop
        >
            <div class="text-lg font-medium text-gray-800 mb-2">确认删除</div>
            <div class="text-gray-600 mb-6 text-sm">
                确定要删除这个项目吗？删除后无法恢复。
            </div>
            <div class="flex justify-end space-x-3">
                <div
                    class="px-4 py-2 text-sm rounded cursor-pointer hover:bg-gray-100"
                    @click="cancelDelete"
                >
                    取消
                </div>
                <div
                    class="px-4 py-2 text-sm bg-red-500 text-white rounded cursor-pointer hover:bg-red-600"
                    @click="confirmDelete"
                >
                    确定
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

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

const isDeleteDialogVisible = ref(false);

const handleRename = () => {
    emit("rename", props.graphId, props.graphName);
    emit("close");
};

const handleDelete = () => {
    emit("close");
    isDeleteDialogVisible.value = true;
};

const confirmDelete = () => {
    isDeleteDialogVisible.value = false;
    emit("delete", props.graphId);
};

const cancelDelete = () => {
    isDeleteDialogVisible.value = false;
};
</script>
