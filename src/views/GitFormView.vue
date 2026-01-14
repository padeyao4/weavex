<script setup lang="ts">
import FramePage from "@/components/FramePage.vue";
import { debug, error, info } from "@tauri-apps/plugin-log";
import { reactive, ref } from "vue";
import { open } from "@tauri-apps/plugin-dialog";
import { ElMessage } from "element-plus";
import { useRepoStore } from "@/stores";
import router from "@/router";

const repoStore = useRepoStore();

const form = reactive({
  repositoryUrl: "",
  branch: "main",
  workDir: "",
});

const loading = ref(false);
const operationResult = ref<{ success: boolean; message: string } | null>(null);

const openDirectory = async () => {
  const directory = await open({
    multiple: false,
    directory: true,
  });
  if (directory) {
    form.workDir = directory;
  }
};

const goBack = () => {
  router.back();
};

/**
 * 执行git clone
 */
const handleGitClone = async () => {
  // 参数验证
  if (!form.repositoryUrl.trim()) {
    ElMessage.error("请输入仓库URL");
    return;
  }

  if (!form.workDir.trim()) {
    ElMessage.error("请选择工作目录");
    return;
  }

  if (!form.branch.trim()) {
    form.branch = "main";
  }

  loading.value = true;
  operationResult.value = null;

  try {
    // 准备git选项
    const gitOptions = {
      repo_url: form.repositoryUrl.trim(),
      target_dir: form.workDir.trim(),
      branch: form.branch.trim() || "main",
    };

    debug("Git选项: " + JSON.stringify(gitOptions));

    // 调用repoStore的cloneRepo方法
    await repoStore.cloneRepo(gitOptions);

    operationResult.value = {
      success: true,
      message: "仓库克隆成功",
    };

    info("clone success");

    setTimeout(() => {
      router.push({
        name: "taskSummary",
      });
    }, 1000);
  } catch (err: any) {
    const errorMessage = err.toString();
    operationResult.value = {
      success: false,
      message: errorMessage,
    };
    error("仓库克隆失败: " + errorMessage);
    ElMessage.error("clone repository failed: " + errorMessage);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <FramePage>
    <div class="flex h-full w-full items-center justify-center select-none">
      <!-- 右侧滑动式返回按钮 -->
      <div class="absolute top-1/2 right-0 -translate-y-1/2">
        <button
          @click="goBack"
          class="group flex items-center gap-2 rounded-l-full bg-gray-100 px-3 py-4 pl-6 shadow-md transition-all hover:bg-gray-200 hover:shadow-lg active:scale-95"
        >
          <span
            class="text-sm font-medium text-gray-700 opacity-0 transition-all group-hover:opacity-100"
          >
            返回
          </span>
          <div
            class="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm transition-transform group-hover:translate-x-1"
          >
            <span class="text-lg text-gray-600">→</span>
          </div>
        </button>
      </div>

      <div
        class="flex flex-col items-center justify-center gap-8 rounded-2xl border border-gray-200 p-10"
      >
        <!-- 标题区域 -->
        <div class="flex flex-col items-center gap-3">
          <div class="text-3xl font-bold text-gray-700">克隆Git仓库</div>
        </div>

        <!-- 表单区域 -->
        <div class="w-full max-w-md space-y-4">
          <!-- 仓库地址 -->
          <div class="space-y-2">
            <div class="flex flex-row">
              <label class="block text-sm font-medium text-gray-700">
                仓库地址 <span class="text-red-500">*</span>
              </label>
              <div class="ml-auto text-xs text-gray-500">
                支持SSH格式的仓库地址
              </div>
            </div>
            <input
              v-model="form.repositoryUrl"
              type="text"
              placeholder="git@github.com:user/repo.git"
              class="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
            />
          </div>

          <!-- 分支 -->
          <div class="space-y-2">
            <div class="flex flex-row">
              <label class="block text-sm font-medium text-gray-700">
                分支
              </label>
              <div class="ml-auto text-xs text-gray-500">
                默认使用 main 分支
              </div>
            </div>
            <input
              v-model="form.branch"
              type="text"
              placeholder="main"
              class="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
            />
          </div>

          <!-- 工作目录 -->
          <div class="space-y-2">
            <div class="flex flex-row">
              <label class="block text-sm font-medium text-gray-700">
                工作目录 <span class="text-red-500">*</span>
              </label>
              <div class="ml-auto text-xs text-gray-500">本地工作目录路径</div>
            </div>
            <div class="flex gap-2">
              <input
                v-model="form.workDir"
                type="text"
                placeholder="选择工作目录"
                readonly
                class="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
              />
              <button
                @click="openDirectory"
                class="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-200 focus:outline-none"
              >
                选择目录
              </button>
            </div>
          </div>

          <!-- 提交按钮 -->
          <div class="flex flex-row pt-4">
            <button
              @click="handleGitClone"
              :disabled="!form.repositoryUrl || !form.workDir || loading"
              class="w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              <span v-if="loading">处理中...</span>
              <span v-else>克隆仓库</span>
            </button>
          </div>
        </div>

        <!-- 操作结果 -->
        <div
          v-if="operationResult"
          class="mt-6 w-full max-w-md rounded-xl p-4"
          :class="
            operationResult.success
              ? 'border border-green-200 bg-green-50'
              : 'border border-red-200 bg-red-50'
          "
        >
          <div class="flex items-start gap-3">
            <div
              class="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full"
              :class="
                operationResult.success
                  ? 'bg-green-100 text-green-600'
                  : 'bg-red-100 text-red-600'
              "
            >
              <span class="text-sm font-bold">
                {{ operationResult.success ? "✓" : "✗" }}
              </span>
            </div>
            <div class="flex-1">
              <div
                class="font-medium"
                :class="
                  operationResult.success ? 'text-green-800' : 'text-red-800'
                "
              >
                {{ operationResult.success ? "操作成功" : "操作失败" }}
              </div>
              <div
                class="mt-1 text-sm"
                :class="
                  operationResult.success ? 'text-green-700' : 'text-red-700'
                "
              >
                {{ operationResult.message }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </FramePage>
</template>

<style scoped>
/* 自定义样式 */
input:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

button:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>
