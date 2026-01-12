<script setup lang="ts">
import FramePage from "@/components/FramePage.vue";
import { debug } from "@tauri-apps/plugin-log";
import { reactive, computed, watch } from "vue";
import { open } from "@tauri-apps/plugin-dialog";

const form = reactive({
    repositoryUrl: "",
    branch: "main",
    username: "",
    password: "",
    workdir: "",
    authMethod: "password", // password 或 token
    token: "",
});

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
            form.authMethod = "password"; // SSH默认使用密码认证
        }
    },
);

const fetchRepository = () => {
    debug("Fetching repository:" + form.repositoryUrl + form.branch);
    debug("URL type:" + urlType.value);
    debug("Auth method:" + form.authMethod);

    // 根据认证方式收集数据
    const authData = {
        username: form.username,
        password: form.password,
        token: form.authMethod === "token" ? form.token : "",
    };

    debug("Auth data:" + authData);
};
</script>

<template>
    <FramePage>
        <div class="w-full h-full">
            <div class="text-xl font-bold mb-4">
                Git Repository Configuration
            </div>

            <!-- URL类型提示 -->
            <div
                v-if="urlType !== 'unknown' && form.repositoryUrl"
                class="mb-4 p-2 rounded"
                :class="
                    urlType === 'ssh'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-green-50 text-green-700 border border-green-200'
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
                    <div class="text-xs text-gray-500 mt-1">
                        支持HTTP/HTTPS和SSH格式
                    </div>
                </el-form-item>

                <el-form-item label="Branch">
                    <el-input
                        v-model="form.branch"
                        placeholder="Enter branch name (default: main)"
                    ></el-input>
                    <div class="text-xs text-gray-500 mt-1">
                        默认分支为 main，可修改为其他分支名
                    </div>
                </el-form-item>

                <!-- SSH地址的认证方式选择 -->
                <el-form-item v-if="urlType === 'ssh'" label="认证方式">
                    <el-radio-group v-model="form.authMethod">
                        <el-radio label="password">账号密码</el-radio>
                        <el-radio label="token">Token验证</el-radio>
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

                <!-- Token输入（仅SSH使用token认证时） -->
                <el-form-item
                    v-if="urlType === 'ssh' && form.authMethod === 'token'"
                    label="Token"
                >
                    <el-input
                        v-model="form.token"
                        placeholder="Enter personal access token"
                        type="password"
                        show-password
                    ></el-input>
                    <div class="text-xs text-gray-500 mt-1">
                        用于SSH认证的个人访问令牌
                    </div>
                </el-form-item>

                <el-form-item label="Work Directory">
                    <el-text v-if="form.workdir">{{ form.workdir }}</el-text>
                    <el-button @click="openDirectory">打开目录</el-button>
                    <br />
                    <div class="text-xs text-gray-500 mt-1">
                        本地工作目录路径
                    </div>
                </el-form-item>

                <el-form-item>
                    <el-button
                        type="primary"
                        @click="fetchRepository"
                        :disabled="!form.repositoryUrl"
                    >
                        Fetch Repository
                    </el-button>
                </el-form-item>
            </el-form>

            <!-- 使用说明 -->
            <div class="mt-8 p-4 bg-gray-50 rounded border">
                <h3 class="font-bold text-gray-700 mb-2">使用说明：</h3>
                <ul class="text-sm text-gray-600 space-y-1">
                    <li>
                        • <strong>HTTP/HTTPS地址</strong>：以 http:// 或
                        https:// 开头，使用用户名和密码认证
                    </li>
                    <li>
                        • <strong>SSH地址</strong>：以 git@ 或 ssh://
                        开头，可选择使用账号密码或Token认证
                    </li>
                    <li>
                        • <strong>简写SSH地址</strong>：如
                        github.com:user/repo.git 也会被识别为SSH地址
                    </li>
                    <li>
                        •
                        <strong>Token认证</strong
                        >：适用于需要更高安全性的SSH连接，如GitHub Personal
                        Access Token
                    </li>
                </ul>
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
