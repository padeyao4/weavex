<script setup lang="ts">
import router from "@/router";
import { version } from "@/../package.json";
import WindowTitleBar from "@/components/WindowsTitleBar.vue";
import { useConfigStore } from "@/stores";
import { open } from "@tauri-apps/plugin-dialog";
import { debug } from "@tauri-apps/plugin-log";

const dev = import.meta.env.VITE_APP_ENV === "dev";

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
  <div class="flex h-screen flex-col items-center bg-gray-50">
    <header
      class="drag-region mt-7.5 flex h-14 w-screen items-start justify-start border-b border-gray-300"
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
      class="my-4 flex w-140 flex-col gap-1 border-b border-gray-300 pb-4 font-sans font-light text-gray-500"
    >
      <div class="text-md mb-2 font-medium">存储</div>
      <div class="text-sm">项目存储目录: xxx</div>
      <div class="text-sm">APP数据目录: xxxx</div>
      <div class="text-sm">
        不要手动修改或者删除目录文件,升级或者迁移前可备份此文件
      </div>
    </div>
    <div
      class="my-4 flex w-140 flex-col gap-1 border-b border-gray-300 pb-4 font-sans font-light text-gray-500"
    >
      <div class="text-md mb-2 font-medium">基础设置</div>
      <div class="flex flex-row items-center">
        <div class="mr-auto text-sm">测试模式</div>
        <el-switch v-model="configStore.config.testMode" size="sm" />
      </div>
      <div class="flex flex-row items-center">
        <div class="mr-auto text-sm">Graph动画效果</div>
        <el-switch v-model="configStore.config.graphAnimation" size="sm" />
      </div>
    </div>
    <div
      class="my-4 flex w-140 flex-col gap-1 border-b border-gray-300 pb-4 font-sans font-light text-gray-500"
    >
      <div class="text-md mb-2 font-medium">切换项目</div>
      <div class="flex flex-row items-center">
        <div class="mr-auto text-sm">切换项目</div>
        <el-button type="primary" size="small" @click="openFileDialog"
          >切换项目</el-button
        >
      </div>
    </div>
    <div
      class="my-4 flex w-140 flex-col gap-1 border-b border-gray-300 pb-4 font-sans font-light text-gray-500"
    >
      <div class="text-md mb-2 font-medium">关于</div>
      <div class="text-sm">
        当前版本: {{ version + (dev ? " (开发版)" : "") }}
      </div>
    </div>
  </div>
</template>
