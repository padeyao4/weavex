<template>
    <div class="flex flex-col" style="width: 68px">
        <div>
            <div><router-link :to="`/a/tasks/summery`">任务</router-link></div>
            <div><router-link :to="`/a/notes`">笔记</router-link></div>
            <div><router-link :to="`/a/test`">测试</router-link></div>
        </div>
        <div class="grow"></div>
        <div><router-link :to="`/settings`">设置</router-link></div>
    </div>
</template>
<script setup lang="ts"></script>
