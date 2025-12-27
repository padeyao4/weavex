<template>
    <div class="flex flex-col">
        <el-button type="primary" @click="readFileTest">读取文件</el-button>
        <el-button type="primary" @click="createDirectoryTest"
            >创建目录</el-button
        >
    </div>
</template>
<script setup lang="ts">
import { BaseDirectory, mkdir } from "@tauri-apps/plugin-fs";
async function readFileTest() {}
async function createDirectoryTest() {
    await mkdir("testDir", {
        recursive: true,
        baseDir: BaseDirectory.Document,
    });
}
</script>
