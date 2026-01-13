<script setup lang="ts">
import FramePage from "@/components/FramePage.vue";
</script>

<template>
  <FramePage>
    <div class="loading-container">
      <div class="loading-spinner">
        <div class="spinner-circle"></div>
        <div class="spinner-text">加载中</div>
      </div>
    </div>
  </FramePage>
</template>

<style scoped>
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.spinner-circle {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #3498db;
  animation: spin 1s ease-in-out infinite;
}

.spinner-text {
  font-size: 16px;
  color: #2c3e50;
  font-weight: 500;
  letter-spacing: 1px;
  opacity: 0.8;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
