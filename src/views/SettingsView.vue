<script setup lang="ts">
import { useRouter } from "vue-router";
import { version } from "@/../package.json";
import { FsUtil } from "@/lib";
import { onMounted, ref } from "vue";

const router = useRouter();
const dev = import.meta.env.VITE_APP_ENV === "dev";
const localPath = ref<string>();

onMounted(async () => {
    localPath.value = await FsUtil.getLocalStoragePath();
});

const back = () => {
    router.push((router.options.history.state.back || { name: "home" }) as any);
};
</script>
<template>
    <div class="flex flex-col items-center bg-gray-50 h-screen">
        <header
            class="drag-region flex h-16 w-screen items-center justify-start border-b border-gray-300"
        >
            <div
                class="no-drag-region m-4 flex h-10 w-10 items-center justify-center hover:bg-blue-50"
                @click="back"
            >
                <el-icon class="h-10 w-10" :size="30"><Back /></el-icon>
            </div>
            <div class="text-xl text-gray-500">设置</div>
        </header>
        <div
            class="w-140 my-4 text-gray-500 font-light font-sans gap-1 flex flex-col pb-2 border-b border-gray-300"
        >
            <div class="text-md font-medium">存储</div>
            <div class="text-sm">数据存储目录: {{ localPath }}</div>
            <div class="text-sm">
                不要手动修改或者删除目录文件,升级或者迁移前可备份此文件
            </div>
        </div>
        <div
            class="w-140 my-4 text-gray-500 font-light font-sans gap-1 flex flex-col pb-2 border-b border-gray-300"
        >
            <div class="text-md font-medium">关于</div>
            <div class="text-sm">
                当前版本: {{ version + (dev ? " (开发版)" : "") }}
            </div>
        </div>
    </div>
</template>
