<script setup lang="ts">
import FramePage from "@/components/FramePage.vue";
import { debug } from "@tauri-apps/plugin-log";
import { reactive } from "vue";

const form = reactive({
    repositoryUrl: "",
    branch: "master",
    username: "",
    password: "",
    workdir: "",
    httpOrSSH: "http",
});

const fetchRepository = () => {
    debug("Fetching repository:" + form.repositoryUrl + form.branch);
};
</script>

<template>
    <FramePage>
        <div class="w-full h-full">
            <div>git repository</div>
            <el-form :model="form" @submit.prevent="fetchRepository">
                <el-form-item label="Repository URL">
                    <el-input
                        v-model="form.repositoryUrl"
                        placeholder="Enter repository URL"
                    ></el-input>
                </el-form-item>
                <el-form-item label="Branch">
                    <el-select
                        v-model="form.branch"
                        placeholder="Select branch"
                    >
                        <el-option label="master" value="master"></el-option>
                        <el-option label="main" value="main"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="Username">
                    <el-input
                        v-model="form.username"
                        placeholder="Enter username"
                    ></el-input>
                </el-form-item>
                <el-form-item label="Password">
                    <el-input
                        v-model="form.password"
                        placeholder="Enter password"
                        type="password"
                    ></el-input>
                </el-form-item>
                <el-form-item label="Work Directory">
                    <el-input
                        v-model="form.workdir"
                        placeholder="Enter work directory"
                    ></el-input>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="fetchRepository"
                        >Fetch Repository</el-button
                    >
                </el-form-item>
            </el-form>
        </div>
    </FramePage>
</template>

<style scoped></style>
