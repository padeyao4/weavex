<template>
    <div>
        <div style="height: 56px">header {{ taskId }}</div>
        <div
            style="height: calc(100% - 56px)"
            id="container"
            @contextmenu.prevent="() => {}"
        ></div>
    </div>
</template>
<script setup lang="ts">
import { Graph } from "@antv/g6";
import { computed, nextTick, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useCurrentGraphStore, useGraphsStore } from "@/stores";
import { GraphUtils, NodeUtil } from "@/utils";

const route = useRoute();
const taskId = route.params.taskId;
const currentGraphStore = useCurrentGraphStore();
currentGraphStore.setGraph({ id: taskId as string });
const graphsStore = useGraphsStore();

const data = computed(() => {
    return GraphUtils.toGraphData(graphsStore.currentGraph);
});

onMounted(() => {
    // 创建图实例
    const graph = new Graph({
        container: "container",
        autoFit: "center",
        autoResize: true,
        data: data.value,
        plugins: [
            {
                type: "contextmenu",
                trigger: "contextmenu",
                // 只在节点上开启右键菜单，默认全部元素都开启
                enable: (e: any) => e.targetType === "canvas",
                getItems: () => {
                    return [{ name: "添加节点", value: "add-node" }];
                },
                onClick: (value: any) => {
                    if (value === "add-node") {
                        const node = NodeUtil.fakerNode();
                        graphsStore.addNode(graphsStore.currentGraph, node);
                        graph.addNodeData([
                            {
                                id: node.id,
                                data: { ...node },
                            },
                        ]);
                        graph.render();
                    }
                },
            },
            {
                type: "grid-line",
                size: 20,
            },
            {
                type: "tooltip",
                trigger: "hover",
            },
        ],

        // 节点配置
        node: {
            type: (value) => value.type ?? "rect",
            style: {
                fill: "#e6f7ff",
                stroke: "#91d5ff",
                lineWidth: 1,
                radius: 4,
                labelText: (d: any) => d.data.title,
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
                endArrow: true,
            },
        },

        // 交互行为
        behaviors: ["zoom-canvas", "drag-canvas"],

        // 布局配置 - 使用内置的力导向布局
        layout: {
            type: "antv-dagre",
            rankdir: "LR",
            sortByCombo: true,
        },
    });
    graph.render();
});
</script>
