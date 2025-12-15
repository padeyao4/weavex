<script lang="ts" setup>
import { Graph } from "@antv/g6";
import { onMounted } from "vue";
import { createTemplateData, convert } from "./utils";

const root = createTemplateData();
const data = convert(root);

onMounted(() => {
    const graph = new Graph({
        container: "container",
        autoFit: "center",
        autoResize: true,
        background: "#ffffdd",
        data,
        node: {
            type: "rect", // 节点类型
            style: {
                fill: "#e6f7ff", // 填充色
                stroke: "#91d5ff", // 边框色
                lineWidth: 1, // 边框宽度
                labelText: (d) => d.label as string, // 标签文本
            },
        },
        behaviors: [
            {
                type: "drag-element",
            },
            "zoom-canvas",
            {
                type: "drag-canvas",
            },
        ],
        layout: {
            type: "force",
        },
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
    height: 100vh;
    background-color: #841;
}
</style>
