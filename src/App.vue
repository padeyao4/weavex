<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { useRepoStore } from "./stores/repo";
import { ElMessageBox, ElMessage } from "element-plus";

const repoStore = useRepoStore();
const isCheckingUpdate = ref(false);
const isDownloading = ref(false);
const downloadProgress = ref(0);

const fetchVersion = async () => {
  try {
    isCheckingUpdate.value = true;
    const update = await check();

    if (update) {
      console.log(
        `发现新版本 ${update.version}，发布于 ${update.date}，更新内容：${update.body}`,
      );

      // 第一步：询问用户是否要下载更新
      try {
        await ElMessageBox.confirm(
          `发现新版本 ${update.version}\n\n更新内容：\n${update.body}\n\n是否要下载此更新？`,
          "发现新版本",
          {
            confirmButtonText: "下载更新",
            cancelButtonText: "忽略",
            type: "info",
            center: true,
            dangerouslyUseHTMLString: true,
          },
        );

        // 用户确认下载
        await downloadUpdate(update);
      } catch (error) {
        // 用户点击了"忽略"或关闭了对话框
        console.log("用户忽略更新");
        ElMessage.info("已跳过本次更新");
      }
    }
  } catch (error) {
    console.error("检查更新失败:", error);
  } finally {
    isCheckingUpdate.value = false;
  }
};

const downloadUpdate = async (update: any) => {
  try {
    isDownloading.value = true;
    downloadProgress.value = 0;
    ElMessage.info("正在下载更新...");

    let downloaded = 0;
    let contentLength = 0;

    // 只下载，不安装 - 避免Windows下程序直接退出
    await update.download((event: any) => {
      switch (event.event) {
        case "Started":
          contentLength = event.data.contentLength ?? 0;
          console.log(`开始下载 ${event.data.contentLength} 字节`);
          break;
        case "Progress":
          downloaded += event.data.chunkLength;
          if (contentLength > 0) {
            downloadProgress.value = Math.round(
              (downloaded / contentLength) * 100,
            );
          }
          console.log(
            `已下载 ${downloaded} / ${contentLength} (${downloadProgress.value}%)`,
          );
          break;
        case "Finished":
          console.log("下载完成");
          downloadProgress.value = 100;
          break;
      }
    });

    ElMessage.success("更新下载完成！");

    // 下载完成后询问用户如何安装
    await promptInstallation(update);
  } catch (error) {
    console.error("下载更新失败:", error);
    ElMessage.error("下载更新失败，请稍后重试");
  } finally {
    isDownloading.value = false;
  }
};

const promptInstallation = async (update: any) => {
  try {
    const result = await ElMessageBox.confirm(
      "更新已下载完成！\n\n注意：在Windows系统上安装更新需要重启应用。\n\n请选择安装方式：",
      "安装更新",
      {
        confirmButtonText: "立即安装并重启",
        cancelButtonText: "下次启动时安装",
        type: "warning",
        center: true,
        distinguishCancelAndClose: true,
      },
    );

    if (result) {
      // 用户选择"立即安装并重启"
      await installAndRestart(update);
    } else {
      // 用户选择"下次启动时安装"
      ElMessage.info("更新将在下次启动应用时自动安装");
      // 可以在这里保存更新信息，下次启动时自动安装
      localStorage.setItem(
        "pending_update",
        JSON.stringify({
          version: update.version,
          date: update.date,
        }),
      );
    }
  } catch (error) {
    // 用户关闭了对话框
    console.log("用户关闭安装对话框");
    ElMessage.info("您可以在设置中手动安装更新");
  }
};

const installAndRestart = async (update: any) => {
  try {
    ElMessage.warning("正在安装更新，应用即将重启...");

    // 重要提示：在Windows上，install() 方法也会导致应用退出
    // 所以我们需要先显示明确的警告信息
    await ElMessageBox.alert(
      "应用即将重启以完成更新安装。\n\n请保存所有未保存的工作。\n\n点击确定继续。",
      "准备重启",
      {
        confirmButtonText: "确定",
        type: "warning",
        center: true,
      },
    );

    // 安装更新 - 在Windows上这会启动外部安装程序
    await update.install();

    // 如果install()没有自动重启，我们尝试手动重启
    // 注意：在Windows上，install()通常会启动外部安装程序，当前应用会退出
    // 所以下面的代码可能不会执行
    try {
      await relaunch();
    } catch (relaunchError) {
      console.log("应用已退出，由安装程序处理重启");
    }
  } catch (error) {
    console.error("安装更新失败:", error);
    ElMessage.error("安装更新失败，请手动重启应用");
  }
};

// 检查是否有待处理的更新
const checkPendingUpdate = () => {
  const pendingUpdate = localStorage.getItem("pending_update");
  if (pendingUpdate) {
    try {
      const updateInfo = JSON.parse(pendingUpdate);
      console.log(`有待处理的更新: ${updateInfo.version}`);
      // 可以在这里提示用户有待处理的更新
    } catch (e) {
      console.error("解析待处理更新信息失败:", e);
    }
  }
};

// 手动检查更新函数，可以在设置中调用
const manualCheckUpdate = async () => {
  try {
    ElMessage.info("正在检查更新...");
    const update = await check();

    if (update) {
      const result = await ElMessageBox.confirm(
        `发现新版本 ${update.version}\n\n是否要下载并安装？`,
        "检查到更新",
        {
          confirmButtonText: "下载并安装",
          cancelButtonText: "取消",
          type: "info",
        },
      );

      if (result) {
        await downloadUpdate(update);
      }
    } else {
      ElMessage.success("当前已是最新版本");
    }
  } catch (error) {
    console.error("手动检查更新失败:", error);
    ElMessage.error("检查更新失败");
  }
};

// 导出手动检查更新函数，供其他组件使用
defineExpose({
  manualCheckUpdate,
});

onMounted(() => {
  repoStore.init();

  // 延迟检查更新，让应用先完全启动
  setTimeout(() => {
    fetchVersion();
    checkPendingUpdate();
  }, 2000);
});
</script>
