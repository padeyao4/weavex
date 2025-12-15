<template>
    <div id="container"></div>
</template>

<script lang="ts" setup>
import { Graph } from "@antv/g6";
import { onMounted } from "vue";
import { createTemplateData, convert } from "./utils";

// 创建测试数据
const root = createTemplateData();
const data = convert(root);

onMounted(() => {
    // 创建图实例
    const graph = new Graph({
        container: "container",
        autoFit: "center",
        autoResize: true,
        data,

        // 节点配置
        node: {
            type: "rect",
            style: {
                fill: "#e6f7ff",
                stroke: "#91d5ff",
                lineWidth: 1,
                radius: 4,
                labelText: (d: any) => d.label,
                labelBackground: true,
                labelBackgroundOpacity: 0.7,
                labelBackgroundRadius: 2,
            },
        },

        // combo配置
        combo: {
            type: "rect",
            style: {
                fill: "rgba(24, 144, 255, 0.1)",
                stroke: "#1890ff",
                lineWidth: 1,
                radius: 4,
                labelText: (d: any) => d.label,
                labelFill: "#1890ff",
                labelFontSize: 14,
                labelFontWeight: "bold",
            },
        },

        // 边配置
        edge: {
            type: "line",
            style: {
                stroke: "#d9d9d9",
                lineWidth: 1,
            },
        },

        // 交互行为
        behaviors: ["drag-element", "zoom-canvas", "drag-canvas"],

        // 布局配置 - 使用内置的力导向布局
        layout: {
            // type: "force",
            type: "custom-layout",
            linkDistance: 100,
            nodeStrength: -30,
            edgeStrength: 0.1,
            preventOverlap: true,
        },

        // 插件配置
        plugins: [
            {
                type: "grid-line",
                size: 20,
            },
            {
                type: "tooltip",
                trigger: "hover",
            },
        ],
    });

    // 渲染图形
    graph.render();

    console.log("Graph created successfully");
    console.log("Nodes:", graph.getNodeData());
    console.log("Edges:", graph.getEdgeData());
    console.log("Combos:", graph.getComboData());
});
</script>

<style scoped>
#container {
    width: 100%;
    height: 100vh;
    /*border: 1px solid #ddd;*/
    border-radius: 4px;
    overflow: hidden;
}
</style>
