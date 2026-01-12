<script setup lang="ts">
import FramePage from "@/components/FramePage.vue";
import { debug, error, info } from "@tauri-apps/plugin-log";
import { reactive, computed, watch, ref } from "vue";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { ElMessage } from "element-plus";
import { useContextStore, useRuntimeStore } from "@/stores";
import { router } from "@/router";

const contextStore = useContextStore();
const runtimeStore = useRuntimeStore();

const form = reactive({
  repositoryUrl: "",
  branch: "main",
  username: "",
  password: "",
  workdir: "",
  authMethod: "password", // password 或 ssh_key
  sshKey: "",
});

const loading = ref(false);
const operationResult = ref<{ success: boolean; message: string } | null>(null);

// 计算属性：检测URL类型
const urlType = computed(() => {
  const url = form.repositoryUrl.trim();

  if (!url) return "unknown";

  // SSH URL模式：git@开头 或 ssh://开头
  if (url.startsWith("git@") || url.startsWith("ssh://")) {
    return "ssh";
  }

  // HTTP/HTTPS URL模式
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return "http";
  }

  // 其他情况（可能是简写形式）
  if (url.includes(":")) {
    // 如果有冒号但没有@，可能是简写的SSH（如：github.com:user/repo.git）
    if (!url.includes("@")) {
      return "ssh";
    }
  }

  return "unknown";
});

const openDirectory = async () => {
  const directory = await open({
    multiple: false,
    directory: true,
  });
  if (directory) {
    form.workdir = directory;
  }
};

// 监听URL变化，重置认证方式
watch(
  () => form.repositoryUrl,
  () => {
    if (urlType.value === "http") {
      form.authMethod = "password"; // HTTP只支持密码认证
    } else if (urlType.value === "ssh") {
      form.authMethod = "ssh_key"; // SSH默认使用key认证
    }
  },
);

/**
 * 执行git clone
 */
const fetchRepository = async () => {
  // todo 参数验证
  loading.value = true;
  operationResult.value = null;

  try {
    debug("开始克隆仓库: " + form.repositoryUrl);
    debug("分支: " + form.branch);
    debug("URL类型: " + urlType.value);
    debug("认证方式: " + form.authMethod);
    debug("工作目录: " + form.workdir);

    // 根据URL类型确定认证方式
    let authMethod = "none";
    if (urlType.value === "http") {
      authMethod = "https";
    } else if (urlType.value === "ssh") {
      authMethod = "ssh";
    }

    // 准备git选项
    const gitOptions = {
      repo_url: form.repositoryUrl,
      target_dir: form.workdir,
      branch: form.branch,
      auth_method: authMethod,
      username: (form.username && encodeURIComponent(form.username)) || null,
      password: (form.password && encodeURIComponent(form.password)) || null,
      ssh_key: form.authMethod === "ssh_key" ? form.sshKey : null,
      commit_message: null,
      files: null,
    };

    debug(
      "Git选项: " +
        JSON.stringify({
          ...gitOptions,
          ...{
            username: gitOptions.username ? "*" : null,
            password: gitOptions.password ? "*" : null,
            ssh_key: gitOptions.ssh_key ? "*" : null,
          },
        }),
    );

    // 调用Rust git_clone命令
    const result = await invoke<string>("git_clone", { options: gitOptions });

    operationResult.value = {
      success: true,
      message: result,
    };

    info("仓库克隆成功: " + result);

    // 设置参数到context中
    Object.assign(contextStore.context, form);
    runtimeStore.status.application.existWorkspace = true;
    setTimeout(() => {
      router.push({
        name: "taskSummary",
      });
    }, 2000);
  } catch (err: any) {
    const errorMessage = err.toString();
    operationResult.value = {
      success: false,
      message: errorMessage,
    };
    error("仓库克隆失败: " + errorMessage);
    ElMessage.error("仓库克隆失败: " + errorMessage);
  } finally {
    loading.value = false;
  }
};

// 新增：执行git pull操作
const pullRepository = async () => {
  if (!form.workdir) {
    ElMessage.error("请选择工作目录");
    return;
  }

  loading.value = true;
  operationResult.value = null;

  try {
    debug("开始拉取仓库更新: " + form.workdir);

    // 准备git选项
    const gitOptions = {
      repo_url: form.repositoryUrl,
      target_dir: form.workdir,
      branch: form.branch,
      auth_method:
        urlType.value === "http"
          ? "https"
          : urlType.value === "ssh"
            ? "ssh"
            : "none",
      username: form.username || null,
      password: form.password || null,
      ssh_key: form.authMethod === "ssh_key" ? form.sshKey : null,
      commit_message: null,
      files: null,
    };

    // 调用Rust git_pull命令
    const result = await invoke<string>("git_pull", { options: gitOptions });

    operationResult.value = {
      success: true,
      message: result,
    };

    info("仓库拉取成功: " + result);
    ElMessage.success("仓库拉取成功！");
  } catch (err: any) {
    const errorMessage = err.toString();
    operationResult.value = {
      success: false,
      message: errorMessage,
    };

    error("仓库拉取失败: " + errorMessage);
    ElMessage.error("仓库拉取失败: " + errorMessage);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <FramePage>
    <div class="h-full w-full">
      <div class="mb-4 text-xl font-bold">Git Repository Configuration</div>

      <!-- URL类型提示 -->
      <div
        v-if="urlType !== 'unknown' && form.repositoryUrl"
        class="mb-4 rounded p-2"
        :class="
          urlType === 'ssh'
            ? 'border border-blue-200 bg-blue-50 text-blue-700'
            : 'border border-green-200 bg-green-50 text-green-700'
        "
      >
        <span class="font-medium">URL类型:</span>
        <span class="ml-2">{{
          urlType === "ssh" ? "SSH地址" : "HTTP地址"
        }}</span>
      </div>

      <el-form :model="form" @submit.prevent="fetchRepository">
        <el-form-item label="Repository URL" required>
          <el-input
            v-model="form.repositoryUrl"
            placeholder="例如: https://github.com/user/repo.git 或 git@github.com:user/repo.git"
            @blur="urlType"
          ></el-input>
          <div class="mt-1 text-xs text-gray-500">支持HTTP/HTTPS和SSH格式</div>
        </el-form-item>

        <el-form-item label="Branch">
          <el-input
            v-model="form.branch"
            placeholder="Enter branch name (default: main)"
          ></el-input>
          <div class="mt-1 text-xs text-gray-500">
            默认分支为 main，可修改为其他分支名
          </div>
        </el-form-item>

        <!-- SSH地址的认证方式选择 -->
        <el-form-item v-if="urlType === 'ssh'" label="认证方式">
          <el-radio-group v-model="form.authMethod">
            <el-radio label="password">账号密码</el-radio>
            <el-radio label="ssh_key">SSH密钥</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 用户名输入（SSH和HTTP都需要） -->
        <el-form-item
          v-if="
            urlType === 'http' ||
            (urlType === 'ssh' && form.authMethod === 'password')
          "
          label="Username"
        >
          <el-input
            v-model="form.username"
            placeholder="Enter username"
          ></el-input>
        </el-form-item>

        <!-- 密码输入（HTTP或SSH使用密码认证时） -->
        <el-form-item
          v-if="
            urlType === 'http' ||
            (urlType === 'ssh' && form.authMethod === 'password')
          "
          label="Password"
        >
          <el-input
            v-model="form.password"
            placeholder="Enter password"
            type="password"
            show-password
          ></el-input>
        </el-form-item>

        <!-- SSH密钥输入（仅SSH使用密钥认证时） -->
        <el-form-item
          v-if="urlType === 'ssh' && form.authMethod === 'ssh_key'"
          label="SSH密钥"
        >
          <el-input
            v-model="form.sshKey"
            placeholder="粘贴SSH私钥内容（以-----BEGIN开头）"
            type="textarea"
            :rows="6"
            show-password
          ></el-input>
          <div class="mt-1 text-xs text-gray-500">
            用于SSH认证的私钥内容，请确保密钥格式正确
          </div>
        </el-form-item>

        <el-form-item label="Work Directory">
          <el-text v-if="form.workdir">{{ form.workdir }}</el-text>
          <el-button @click="openDirectory">打开目录</el-button>
          <br />
          <div class="mt-1 text-xs text-gray-500">本地工作目录路径</div>
        </el-form-item>

        <el-form-item>
          <div class="flex gap-2">
            <el-button
              type="primary"
              @click="fetchRepository"
              :disabled="!form.repositoryUrl || !form.workdir || loading"
              :loading="loading"
            >
              {{ loading ? "处理中..." : "克隆仓库" }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>

      <!-- 操作结果 -->
      <div
        v-if="operationResult"
        class="mt-6 rounded border p-4"
        :class="
          operationResult.success
            ? 'border-green-200 bg-green-50'
            : 'border-red-200 bg-red-50'
        "
      >
        <h3
          class="mb-2 font-bold"
          :class="operationResult.success ? 'text-green-700' : 'text-red-700'"
        >
          {{ operationResult.success ? "操作成功" : "操作失败" }}
        </h3>
        <div
          class="text-sm"
          :class="operationResult.success ? 'text-green-600' : 'text-red-600'"
        >
          {{ operationResult.message }}
        </div>
      </div>
    </div>
  </FramePage>
</template>

<style scoped>
/* 添加一些自定义样式 */
:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-input) {
  width: 100%;
}
</style>
