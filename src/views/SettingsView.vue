<script setup lang="ts">
import AboutComponent from "@/components/settings/AboutComponent.vue";
import AccountInfo from "@/components/settings/AccountInfo.vue";
import UserDataInfo from "@/components/settings/UserDataInfo.vue";
import { Back } from "@element-plus/icons-vue";
import { useRouter, type RouteLocationRaw } from "vue-router";

const router = useRouter();

function handleBack() {
  // 获取上一个路由或默认返回首页
  router.push(
    (router.options.history.state.back || { name: "index" }) as RouteLocationRaw
  );
}
</script>

<template>
  <div class="flex flex-col items-center">
    <header
      class="drag-region flex h-16 w-screen items-center justify-start border-b border-gray-300"
    >
      <div
        class="no-drag-region m-4 flex h-10 w-10 items-center justify-center hover:bg-blue-50"
        @click="handleBack"
      >
        <el-icon class="h-10 w-10" :size="30"><Back /></el-icon>
      </div>
      <div class="text-xl text-gray-500">设置</div>
    </header>
    <div class="" style="width: 550px">
      <AccountInfo />
      <UserDataInfo />
      <AboutComponent />
    </div>
  </div>
</template>
