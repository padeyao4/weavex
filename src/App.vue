<script lang="ts" setup>
import { Graph } from "@antv/g6";
import { onMounted } from "vue";
import { createNode, PNode } from "./utils/node-beans-util";

const root: PNode = createNode();

const data = {
    nodes: [
        {
            id: "node2",
            x: 100,
            y: 100,
            size: {
                width: 100,
                height: 50,
            },
        },
    ],
};

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
                r: 20, // 半径
                labelText: (d) => d.id, // 标签文本
            },
        },
        behaviors: ["drag-element", "zoom-canvas", "drag-canvas"],
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
