<script setup lang="ts">
import FramePage from "@/components/FramePage.vue";
</script>

<template>
  <FramePage class="bg-[#eee]">
    <div class="flex h-full items-center justify-center bg-[#eee]">
      <div class="flex flex-col items-center space-y-6">
        <!-- 极简旋转加载器 -->
        <div class="relative">
          <!-- 外圈 -->
          <div class="h-16 w-16 rounded-full border-4 border-gray-200"></div>
          <!-- 旋转部分 -->
          <div
            class="absolute top-0 left-0 h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-blue-500"
          ></div>
        </div>

        <!-- 加载文字 -->
        <div class="text-center">
          <p class="font-medium tracking-wide text-gray-600">加载中</p>
          <p class="mt-1 text-sm text-gray-400">请稍候...</p>
        </div>

        <!-- 极简进度指示器 -->
        <div class="h-1 w-32 overflow-hidden rounded-full bg-gray-200">
          <div
            class="h-full w-1/2 animate-pulse rounded-full bg-blue-500"
          ></div>
        </div>
      </div>
    </div>
  </FramePage>
</template>

<style scoped>
/* 自定义动画速度 */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
