<template>
    <div>
        <el-button type="primary" @click="test">测试fs</el-button>
    </div>
</template>
<script setup lang="ts">
import { LocalFs } from "@/lib";
const test = async () => {
    const content = await LocalFs.read("test.txt");
    console.log("test.txt content:", content);
};
</script>
