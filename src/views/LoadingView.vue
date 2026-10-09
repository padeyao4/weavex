<script setup lang="ts">
import FramePage from "@/components/FramePage.vue";
</script>

<template>
  <FramePage class="bg-base">
    <div class="flex h-full items-center justify-center bg-base">
      <div class="flex flex-col items-center space-y-6">
        <!-- 加载文字 -->
        <div class="text-center">
          <p class="font-medium tracking-wide text-text">加载中</p>
          <p class="mt-1 text-sm text-muted">请稍候...</p>
        </div>

        <!-- 极简进度指示器：显式尺寸与骨架屏 .boot-bar 完全一致（4px × 128px） -->
        <div class="h-[4px] w-[128px] overflow-hidden rounded-full bg-hover">
          <div
            class="h-full w-1/2 animate-pulse rounded-full bg-blue-500"
          ></div>
        </div>
      </div>
    </div>
  </FramePage>
</template>

<style scoped>
</style>
