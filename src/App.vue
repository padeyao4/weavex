<script lang="ts" setup>
import { Graph } from "@antv/g6";
import { onMounted } from "vue";
import { createNode, PNode } from "./utils/node-beans-util";

const root: PNode = createNode();

onMounted(() => {
    const graph = new Graph({ 
        container: "container",
        autoFit: "view",
        autoResize: true,
        background: "#ffffdd",
    });
    graph.render();
});
</script>
<template>
    <div id="container"></div>
</template>
<style scoped>
#container {
    width: 100%;
    height: 100%;
    background-color: #841;
}
</style>
