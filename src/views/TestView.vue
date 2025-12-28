<template>
    <div class="flex flex-col">
        <div>
            {{ env ?? "prod" }}
        </div>
        <el-button type="primary" @click="readFileTest">读取文件</el-button>
        <el-button type="primary" @click="createDirectoryTest"
            >创建目录</el-button
        >
    </div>
</template>
<script setup lang="ts">
const env = import.meta.env.VITE_APP_ENV;
async function readFileTest() {}
async function createDirectoryTest() {}
</script>
