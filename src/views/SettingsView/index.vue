<script setup lang="ts">
import { useRouter } from "vue-router";
import { version } from "@/../package.json";
import { FsUtil } from "@/lib";
import { onMounted, ref } from "vue";
import WindowTitleBar from "@/components/WindowsTitleBar.vue";
import { useConfigStore } from "@/stores";
import { open } from "@tauri-apps/plugin-dialog";
import { debug } from "@tauri-apps/plugin-log";

const router = useRouter();
const dev = import.meta.env.VITE_APP_ENV === "dev";
const documentDataPath = ref<string>();
const appDataPath = ref<string>();

onMounted(async () => {
    documentDataPath.value = await FsUtil.getDocumentDataPath();
    appDataPath.value = await FsUtil.getAppDataPath();
});

const back = () => {
    router.push((router.options.history.state.back || { name: "home" }) as any);
};

const configStore = useConfigStore();

const openFileDialog = async () => {
    const directory = await open({
        multiple: false,
        directory: true,
    });
    debug(directory ?? "");
};
</script>
<template>
    <WindowTitleBar />
    <div class="flex flex-col items-center bg-gray-50 h-screen">
        <header
            class="drag-region flex h-14 w-screen items-start justify-start border-b border-gray-300 mt-7.5"
        >
            <div class="flex flex-row items-center">
                <div
                    class="no-drag-region mx-4 flex h-10 w-10 items-center justify-center hover:bg-blue-50"
                    @click="back"
                >
                    <el-icon class="h-10 w-10" :size="30"><Back /></el-icon>
                </div>
                <div class="text-xl text-gray-500">设置</div>
            </div>
        </header>
        <div
            class="w-140 my-4 text-gray-500 font-light font-sans gap-1 flex flex-col pb-4 border-b border-gray-300"
        >
            <div class="text-md font-medium mb-2">存储</div>
            <div class="text-sm">项目存储目录: {{ documentDataPath }}</div>
            <div class="text-sm">APP数据目录: {{ appDataPath }}</div>
            <div class="text-sm">
                不要手动修改或者删除目录文件,升级或者迁移前可备份此文件
            </div>
        </div>
        <div
            class="w-140 my-4 text-gray-500 font-light font-sans gap-1 flex flex-col pb-4 border-b border-gray-300"
        >
            <div class="text-md font-medium mb-2">基础设置</div>
            <div class="flex flex-row items-center">
                <div class="text-sm mr-auto">测试模式</div>
                <el-switch v-model="configStore.config.testMode" size="sm" />
            </div>
            <div class="flex flex-row items-center">
                <div class="text-sm mr-auto">Graph动画效果</div>
                <el-switch
                    v-model="configStore.config.graphAnimation"
                    size="sm"
                />
            </div>
        </div>
        <div
            class="w-140 my-4 text-gray-500 font-light font-sans gap-1 flex flex-col pb-4 border-b border-gray-300"
        >
            <div class="text-md font-medium mb-2">切换项目</div>
            <div class="flex flex-row items-center">
                <div class="text-sm mr-auto">切换项目</div>
                <el-button type="primary" size="small" @click="openFileDialog"
                    >切换项目</el-button
                >
            </div>
        </div>
        <div
            class="w-140 my-4 text-gray-500 font-light font-sans gap-1 flex flex-col pb-4 border-b border-gray-300"
        >
            <div class="text-md font-medium mb-2">关于</div>
            <div class="text-sm">
                当前版本: {{ version + (dev ? " (开发版)" : "") }}
            </div>
        </div>
    </div>
</template>
