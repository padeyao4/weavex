<script setup lang="ts">
import router from "@/router";
import { version } from "@/../package.json";
import FramePage from "@/components/FramePage.vue";
import { useConfigStore, useContextStore, useRepoStore } from "@/stores";
import {
  Back,
  Folder,
  Warning,
  Setting,
  VideoPlay,
  Switch,
  InfoFilled,
} from "@element-plus/icons-vue";
import { invoke } from "@tauri-apps/api/core";

const repoStore = useRepoStore();
const contextStore = useContextStore();

const dev = import.meta.env.DEV;

const back = () => {
  router.push((router.options.history.state.back || { name: "home" }) as any);
};

const configStore = useConfigStore();

const switchRepo = async () => {
  repoStore.switchRepo();
};

const openWorkDir = async () => {
  if (contextStore.context.workDir) {
    await invoke("open_dir", {
      dirPath: contextStore.context.workDir ?? "",
    });
  }
};
</script>

<template>
  <FramePage>
    <div class="flex h-screen flex-col bg-gray-50">
      <!-- 头部 -->
      <header
        class="drag-region shrink-0 border-b border-gray-200 bg-white/80 backdrop-blur-sm"
      >
        <div class="px-6 py-4">
          <div class="flex items-center gap-4">
            <button
              class="no-drag-region flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
              @click="back"
            >
              <el-icon class="text-gray-600" :size="24">
                <Back />
              </el-icon>
            </button>
            <h1 class="text-xl font-medium text-gray-800">设置</h1>
          </div>
        </div>
      </header>

      <!-- 内容区域 -->
      <main class="flex-1 overflow-y-auto">
        <div class="mx-auto max-w-4xl space-y-8 px-6 py-8">
          <!-- 存储设置 -->
          <section class="rounded-lg border border-gray-200 bg-white p-6">
            <h2 class="mb-4 text-lg font-medium text-gray-800">存储</h2>
            <div class="space-y-3">
              <div class="flex items-start gap-3">
                <div class="mt-0.5 shrink-0">
                  <el-icon class="text-gray-400" :size="18">
                    <Folder />
                  </el-icon>
                </div>
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-700">项目存储目录</p>
                  <div class="mt-1 flex items-center gap-2">
                    <div class="min-w-0 flex-1">
                      <div
                        class="w-150 truncate rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 font-mono text-xs text-gray-500"
                        :title="contextStore.context.workDir"
                      >
                        {{ contextStore.context.workDir }}
                      </div>
                    </div>
                    <button
                      @click="openWorkDir"
                      class="shrink-0 rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 transition-all hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 active:bg-blue-100"
                      title="打开目录"
                    >
                      打开
                    </button>
                  </div>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <div class="mt-0.5 shrink-0">
                  <el-icon class="text-gray-400" :size="18">
                    <Warning />
                  </el-icon>
                </div>
                <p class="text-sm text-gray-500">
                  请勿手动修改或删除目录文件，升级或迁移前可备份此目录
                </p>
              </div>
            </div>
          </section>

          <!-- 基础设置 -->
          <section class="rounded-lg border border-gray-200 bg-white p-6">
            <h2 class="mb-4 text-lg font-medium text-gray-800">基础设置</h2>
            <div class="space-y-4">
              <div class="flex items-center justify-between py-2">
                <div class="flex items-center gap-3">
                  <el-icon class="text-gray-400" :size="18">
                    <Setting />
                  </el-icon>
                  <div>
                    <p class="text-sm font-medium text-gray-700">测试模式</p>
                    <p class="mt-0.5 text-xs text-gray-400">启用测试功能</p>
                  </div>
                </div>
                <el-switch
                  v-model="configStore.config.testMode"
                  size="large"
                  class="ml-4"
                />
              </div>

              <div class="flex items-center justify-between py-2">
                <div class="flex items-center gap-3">
                  <el-icon class="text-gray-400" :size="18">
                    <VideoPlay />
                  </el-icon>
                  <div>
                    <p class="text-sm font-medium text-gray-700">
                      Graph动画效果
                    </p>
                    <p class="mt-0.5 text-xs text-gray-400">启用图表动画</p>
                  </div>
                </div>
                <el-switch
                  v-model="configStore.config.graphAnimation"
                  size="large"
                  class="ml-4"
                />
              </div>
            </div>
          </section>

          <!-- 项目切换 -->
          <section class="rounded-lg border border-gray-200 bg-white p-6">
            <h2 class="mb-4 text-lg font-medium text-gray-800">项目切换</h2>
            <div class="flex items-center justify-between py-2">
              <div class="flex items-center gap-3">
                <el-icon class="text-gray-400" :size="18">
                  <Switch />
                </el-icon>
                <div>
                  <p class="text-sm font-medium text-gray-700">切换项目</p>
                  <p class="mt-0.5 text-xs text-gray-400">切换到其他项目</p>
                </div>
              </div>
              <button
                @click="switchRepo"
                class="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 transition-all hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 active:bg-blue-100"
              >
                切换
              </button>
            </div>
          </section>

          <!-- 关于 -->
          <section class="rounded-lg border border-gray-200 bg-white p-6">
            <h2 class="mb-4 text-lg font-medium text-gray-800">关于</h2>
            <div class="flex items-center gap-3">
              <el-icon class="text-gray-400" :size="18">
                <InfoFilled />
              </el-icon>
              <div>
                <p class="text-sm font-medium text-gray-700">
                  当前版本: {{ version }}
                  <span v-if="dev" class="font-medium text-blue-500"
                    >(开发版)</span
                  >
                </p>
                <p class="mt-0.5 text-xs text-gray-400">软件版本信息</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  </FramePage>
</template>

<style scoped>
.no-drag-region {
  -webkit-app-region: no-drag;
}

.drag-region {
  -webkit-app-region: drag;
}

/* 平滑过渡效果 */
section {
  transition: all 0.2s ease;
}

section:hover {
  border-color: #d1d5db;
  background-color: #f9fafb;
}

/* 按钮悬停效果 */
button:hover {
  transform: translateY(-1px);
}
</style>
