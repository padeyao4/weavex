<script setup lang="ts">
import router from "@/router";
import { version } from "@/../package.json";
import FramePage from "@/components/FramePage.vue";
import { useConfigStore, useContextStore } from "@/stores";
import {
  Back,
  Folder,
  Warning,
  Setting,
  VideoPlay,
  InfoFilled,
  Sunny,
  Moon,
  Monitor,
} from "@element-plus/icons-vue";
import { invoke } from "@tauri-apps/api/core";
import { applyTheme } from "@/lib/theme";
import type { ThemeMode } from "@/lib/config";

const contextStore = useContextStore();

const dev = import.meta.env.DEV;

const back = () => {
  router.push((router.options.history.state.back || { name: "home" }) as any);
};

const configStore = useConfigStore();

const openWorkDir = async () => {
  if (contextStore.context.workDir) {
    await invoke("open_dir", {
      dirPath: contextStore.context.workDir ?? "",
    });
  }
};

/** 切换主题：保存到 config.json 并立即应用 */
const setTheme = (value: ThemeMode) => {
  configStore.config.theme = value;
  configStore.save();
  applyTheme(value);
};
</script>

<template>
  <FramePage>
    <div class="flex h-screen flex-col bg-base">
      <!-- 头部 -->
      <header
        class="shrink-0 border-b border-border bg-surface/80 backdrop-blur-sm"
      >
        <div class="px-6 py-4">
          <div class="flex items-center gap-4">
            <button
              class="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-hover"
              @click="back"
            >
              <el-icon class="text-icon" :size="24">
                <Back />
              </el-icon>
            </button>
            <h1 class="text-xl font-medium text-text">设置</h1>
          </div>
        </div>
      </header>

      <!-- 内容区域 -->
      <main class="flex-1 overflow-y-auto">
        <div class="mx-auto max-w-4xl space-y-8 px-6 py-8">
          <!-- 存储设置 -->
          <section class="rounded-lg border border-border bg-surface p-6">
            <h2 class="mb-4 text-lg font-medium text-text">存储</h2>
            <div class="space-y-3">
              <div class="flex items-start gap-3">
                <div class="mt-0.5 shrink-0">
                  <el-icon class="text-icon" :size="18">
                    <Folder />
                  </el-icon>
                </div>
                <div class="flex-1">
                  <p class="text-sm font-medium text-text">项目存储目录</p>
                  <div class="mt-1 flex items-center gap-2">
                    <div class="min-w-0 flex-1">
                      <div
                        class="w-150 truncate rounded-md border border-border bg-base px-3 py-1.5 font-mono text-xs text-muted"
                        :title="contextStore.context.workDir"
                      >
                        {{ contextStore.context.workDir }}
                      </div>
                    </div>
                    <button
                      @click="openWorkDir"
                      class="shrink-0 rounded-md border border-border bg-surface px-3 py-1 text-xs font-medium text-text transition-all hover:border-primary hover:bg-hover hover:text-primary active:bg-hover"
                      title="打开目录"
                    >
                      打开
                    </button>
                  </div>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <div class="mt-0.5 shrink-0">
                  <el-icon class="text-icon" :size="18">
                    <Warning />
                  </el-icon>
                </div>
                <p class="text-sm text-muted">
                  请勿手动修改或删除目录文件，升级或迁移前可备份此目录
                </p>
              </div>
            </div>
          </section>

          <!-- 主题设置 -->
          <section class="rounded-lg border border-border bg-surface p-6">
            <h2 class="mb-4 text-lg font-medium text-text">主题</h2>
            <div class="flex items-center justify-between py-2">
              <div class="flex items-center gap-3">
                <el-icon class="text-icon" :size="18">
                  <Sunny />
                </el-icon>
                <div>
                  <p class="text-sm font-medium text-text">外观模式</p>
                  <p class="mt-0.5 text-[13px] text-muted">
                    亮色、暗色或跟随系统
                  </p>
                </div>
              </div>
              <el-radio-group
                v-model="configStore.config.theme"
                @change="setTheme"
              >
                <el-radio-button value="light">
                  <el-icon><Sunny /></el-icon>
                  <span class="ml-1">亮色</span>
                </el-radio-button>
                <el-radio-button value="dark">
                  <el-icon><Moon /></el-icon>
                  <span class="ml-1">暗色</span>
                </el-radio-button>
                <el-radio-button value="system">
                  <el-icon><Monitor /></el-icon>
                  <span class="ml-1">跟随系统</span>
                </el-radio-button>
              </el-radio-group>
            </div>
          </section>

          <!-- 基础设置 -->
          <section class="rounded-lg border border-border bg-surface p-6">
            <h2 class="mb-4 text-lg font-medium text-text">基础设置</h2>
            <div class="space-y-4">
              <div class="flex items-center justify-between py-2">
                <div class="flex items-center gap-3">
                  <el-icon class="text-icon" :size="18">
                    <Setting />
                  </el-icon>
                  <div>
                    <p class="text-sm font-medium text-text">测试模式</p>
                    <p class="mt-0.5 text-[13px] text-muted">启用测试功能</p>
                  </div>
                </div>
                <el-switch
                  v-model="configStore.config.testMode"
                  size="large"
                  class="ml-4"
                  @change="configStore.save()"
                />
              </div>

              <div class="flex items-center justify-between py-2">
                <div class="flex items-center gap-3">
                  <el-icon class="text-icon" :size="18">
                    <VideoPlay />
                  </el-icon>
                  <div>
                    <p class="text-sm font-medium text-text">
                      编辑操作动画
                    </p>
                    <p class="mt-0.5 text-[13px] text-muted">
                      节点增删、折叠展开、保存修改等编辑操作播放过渡动画；切换项目直接展示
                    </p>
                  </div>
                </div>
                <el-switch
                  v-model="configStore.config.graphAnimation"
                  size="large"
                  class="ml-4"
                  @change="configStore.save()"
                />
              </div>
            </div>
          </section>

          <!-- 关于 -->
          <section class="rounded-lg border border-border bg-surface p-6">
            <h2 class="mb-4 text-lg font-medium text-text">关于</h2>
            <div class="flex items-center gap-3">
              <el-icon class="text-muted" :size="18">
                <InfoFilled />
              </el-icon>
              <div>
                <p class="text-sm font-medium text-text">
                  当前版本: {{ version }}
                  <span v-if="dev" class="font-medium text-blue-500 dark:text-blue-400"
                    >(开发版)</span
                  >
                </p>
                <p class="mt-0.5 text-[13px] text-muted">软件版本信息</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  </FramePage>
</template>

<style scoped>
/* 平滑过渡效果 */
section {
  transition: all 0.2s ease;
}

section:hover {
  border-color: #d1d5db;
  background-color: #f9fafb;
}

.dark section:hover {
  border-color: #47505e;
  background-color: #2d333d;
}

/* 按钮悬停效果 */
button:hover {
  transform: translateY(-1px);
}
</style>
