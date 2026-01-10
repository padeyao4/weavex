<template>
    <div @click="goBack">back</div>
</template>
<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();

function goBack() {
    router.back();
}
</script>
