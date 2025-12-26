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
import { Graph, IElementEvent, Element } from "@antv/g6";
import { computed, onMounted } from "vue";
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
        autoResize: true,
        autoFit: "center",
        data: data.value,
        plugins: [
            {
                type: "contextmenu",
                trigger: "contextmenu",
                getItems: (e: IElementEvent) => {
                    switch (e.targetType) {
                        case "node":
                            return [
                                {
                                    name: "添加后续节点",
                                    value: "node:add-next",
                                },
                                {
                                    name: "添加前置节点",
                                    value: "node:add-prev",
                                },
                                {
                                    name: "插入后续节点",
                                    value: "node:insert-next",
                                },
                                { name: "删除节点", value: "node:delete" },
                            ];
                        case "edge":
                            return [{ name: "删除边", value: "edge:delete" }];
                        case "combo":
                            return [
                                {
                                    name: "添加子节点",
                                    value: "combo:add-child",
                                },
                                {
                                    name: "删除组合",
                                    value: "combo:delete",
                                },
                            ];
                        case "canvas":
                            return [
                                { name: "添加节点", value: "canvas:add-node" },
                            ];
                        default:
                            return [];
                    }
                },
                onClick: (
                    value: any,
                    _target: HTMLElement,
                    current?: Element,
                ) => {
                    switch (value) {
                        case "node:delete":
                        case "combo:delete":
                            if (current) {
                                graphsStore.removeNode(
                                    graphsStore.currentGraph,
                                    [current.id],
                                );
                                graph.setData(data.value);
                                graph.render();
                            }
                            break;
                        case "node:add-next":
                            if (current) {
                                const nextNode = NodeUtil.fakerNode();

                                nextNode.parent =
                                    graphsStore.currentGraph?.nodes[
                                        current.id
                                    ].parent;

                                graphsStore.addNode(
                                    graphsStore.currentGraph,
                                    nextNode,
                                );
                                graphsStore.addEdge(
                                    graphsStore.currentGraph,
                                    current.id,
                                    nextNode.id,
                                );
                                graph.setData(data.value);
                                graph.render();
                            }
                            break;
                        case "node:insert-next":
                            if (current) {
                                const nextNode = NodeUtil.fakerNode();
                                const currentNode =
                                    graphsStore.currentGraph?.nodes[current.id];
                                nextNode.parent = currentNode?.parent;
                                graphsStore.addNode(
                                    graphsStore.currentGraph,
                                    nextNode,
                                );
                                currentNode?.nexts.forEach((id) => {
                                    graphsStore.addEdge(
                                        graphsStore.currentGraph,
                                        nextNode.id,
                                        id,
                                    );
                                    graphsStore.removeEdge(
                                        graphsStore.currentGraph,
                                        [{ from: currentNode?.id, to: id }],
                                    );
                                });

                                graphsStore.addEdge(
                                    graphsStore.currentGraph,
                                    currentNode?.id,
                                    nextNode.id,
                                );
                                // 添加边
                                graph.setData(data.value);
                                graph.render();
                            }
                            break;
                        case "edge:delete":
                            if (current) {
                                graphsStore.removeEdge(
                                    graphsStore.currentGraph,
                                    [current.id],
                                );
                                graph.setData(data.value);
                                graph.render();
                            }
                            break;
                        case "canvas:add-node":
                            const node = NodeUtil.fakerNode();
                            graphsStore.addNode(graphsStore.currentGraph, node);
                            graph.addNodeData([
                                {
                                    id: node.id,
                                    data: { ...node },
                                },
                            ]);
                            graph.render();
                            break;
                        default:
                            console.warn(`Unknown action: ${value}`);
                            break;
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
                labelText: (d: any) => d.data.name,
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
