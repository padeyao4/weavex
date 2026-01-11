<template>
    <div class="flex flex-col pt-6">
        <div class="h-14 flex items-center font-sans text-xl pl-4 select-none">
            {{ currentGraphStore.graph?.name }}
        </div>
        <div
            id="container"
            @contextmenu.prevent
            class="flex-1 min-h-0 min-w-0 border-t border-gray-200"
        />
        <footer
            class="h-12 flex flex-row justify-center items-center gap-2 border-t border-gray-200"
        >
            <div
                class="w-10 h-10 hover:bg-gray-100 rounded-full flex justify-center items-center transition-colors duration-200"
                @click="toggleGraphView"
                title="切换视图"
            >
                <div class="relative w-6 h-6">
                    <icon-switch-button
                        theme="outline"
                        size="24"
                        fill="#333"
                        :strokeWidth="2"
                        strokeLinecap="square"
                        class="absolute"
                    />
                    <icon-switch-button
                        theme="two-tone"
                        size="24"
                        :fill="['#333', '#2F88FF']"
                        :strokeWidth="2"
                        strokeLinecap="square"
                        class="absolute"
                        :class="{
                            hidden: !currentGraphStore.graph?.hideCompleted,
                        }"
                    />
                </div>
            </div>
            <div
                class="w-10 h-10 hover:bg-gray-100 rounded-full flex justify-center items-center transition-colors duration-200"
                @click="fitView()"
                title="适应画布大小"
            >
                <div class="relative w-6 h-6">
                    <icon-fill
                        theme="outline"
                        size="24"
                        fill="#333"
                        :strokeWidth="2"
                        strokeLinecap="square"
                        class="absolute"
                    />
                </div>
            </div>
            <div
                class="w-10 h-10 hover:bg-gray-100 rounded-full flex justify-center items-center transition-colors duration-200"
                @click="fitCenter()"
                title="居中显示"
            >
                <div class="relative w-6 h-6">
                    <icon-aiming
                        theme="outline"
                        size="24"
                        fill="#333"
                        :strokeWidth="2"
                        strokeLinecap="square"
                        class="absolute"
                    />
                </div>
            </div>
        </footer>
        <NodeDetailDrawer
            v-model="drawer"
            :node="drawerNode"
            @save="saveNode"
        />
    </div>
</template>
<script setup lang="ts">
import { useConfigStore, useCurrentGraphStore } from "@/stores";
import { NodeUtil } from "@/utils";
import {
    Element,
    Graph,
    GraphEvent,
    IElementEvent,
    NodeData,
    NodeEvent,
} from "@antv/g6";
import { onMounted, ref, reactive, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { PNode } from "@/types";
import { debug } from "@tauri-apps/plugin-log";
import NodeDetailDrawer from "./NodeDetailDrawer.vue";
import { pull } from "lodash-es";

const route = useRoute();
const taskId = route.params.taskId as string;
const currentGraphStore = useCurrentGraphStore();
currentGraphStore.setGraph({ id: taskId as string });
const configStore = useConfigStore();

const drawer = ref(false);
const drawerNode = reactive<PNode>(NodeUtil.createNode());

let graph: Graph | undefined;

const fitView = () => {
    graph?.fitView();
};

const fitCenter = () => {
    graph?.fitCenter();
};

const animationPlaying = ref(false);

onMounted(() => {
    graph = new Graph({
        container: "container",
        autoResize: true,
        data: currentGraphStore.graphData,
        transforms: ["custom-transform"],
        plugins: [
            {
                type: "contextmenu",
                trigger: "contextmenu",
                getItems: (e: IElementEvent) => {
                    switch (e.targetType) {
                        case "node":
                            return [
                                ...[
                                    {
                                        name: "添加后续节点",
                                        value: "node:add-next",
                                    },
                                    {
                                        name: "添加子节点",
                                        value: "node:add-child",
                                    },
                                    {
                                        name: "添加前置节点",
                                        value: "node:add-prev",
                                    },
                                    {
                                        name: "插入后续节点",
                                        value: "node:insert-next",
                                    },
                                    {
                                        name: "插入前置节点",
                                        value: "node:insert-prev",
                                    },
                                    { name: "删除节点", value: "node:delete" },
                                    {
                                        name: "删除前置关系",
                                        value: "node:delete-prev-edge",
                                    },
                                    {
                                        name: "删除后续关系",
                                        value: "node:delete-next-edge",
                                    },
                                    {
                                        name: "删除且保留关系",
                                        value: "node:delete-keep-edge",
                                    },
                                ],
                                ...(configStore.config.testMode
                                    ? [
                                          {
                                              name: "测试",
                                              value: "node:test",
                                          },
                                      ]
                                    : []),
                            ];
                        case "edge":
                            return [{ name: "删除边", value: "edge:delete" }];
                        case "canvas":
                            return [
                                { name: "添加节点", value: "canvas:add-node" },
                            ];
                        default:
                            debug("getItems : " + e.targetType);
                            return [];
                    }
                },
                onClick: (
                    value: any,
                    _target: HTMLElement,
                    current?: Element,
                ) => {
                    if (!current || animationPlaying.value) return;
                    switch (value) {
                        case "node:delete-keep-edge":
                            {
                                // 删除当前节点但保留当前节点的关系，比如 a->b->c ,当删除b的时候，变成a->c
                                // 如果有 a->c b->c  c->d ,当删除c的时候，变成a->d b->d
                                // 如果有 a->c b->c  c->d c->e ,删除c的时候，变成 a->d b->d a->e b->e
                                const currentNode =
                                    currentGraphStore.graph?.nodes[
                                        current.id.replace(/-combo$/, "")
                                    ];
                                const prevs = [...(currentNode?.prevs ?? [])];
                                const nexts = [...(currentNode?.nexts ?? [])];

                                // 为每一对（前驱，后继）建立新的边
                                for (const prevId of prevs) {
                                    for (const nextId of nexts) {
                                        // 避免创建重复的边
                                        const prevNode =
                                            currentGraphStore.graph?.nodes[
                                                prevId
                                            ];
                                        const nextNode =
                                            currentGraphStore.graph?.nodes[
                                                nextId
                                            ];
                                        if (
                                            prevNode &&
                                            nextNode &&
                                            !prevNode.nexts.includes(nextId)
                                        ) {
                                            currentGraphStore.addEdge(
                                                prevId,
                                                nextId,
                                            );
                                        }
                                    }
                                }
                                // 删除当前节点
                                currentGraphStore.removeNode([current.id]);
                            }
                            break;
                        case "node:delete":
                            currentGraphStore.removeNode([current.id]);
                            break;
                        case "node:add-next":
                            {
                                const nextNode = NodeUtil.createNode();
                                const parentId =
                                    currentGraphStore.graph?.nodes[current.id]
                                        .parent;
                                currentGraphStore.addNode(nextNode);
                                currentGraphStore.addChild(
                                    parentId,
                                    nextNode.id,
                                );
                                currentGraphStore.addEdge(
                                    current.id,
                                    nextNode.id,
                                );
                            }
                            break;
                        case "node:insert-next":
                            {
                                const nextNode = NodeUtil.createNode();
                                const currentNode =
                                    currentGraphStore.graph?.nodes[current.id];
                                currentGraphStore.addNode(nextNode);
                                currentGraphStore.addChild(
                                    currentNode?.parent,
                                    nextNode.id,
                                );
                                currentNode?.nexts.forEach((id) => {
                                    currentGraphStore.addEdge(nextNode.id, id);
                                    currentGraphStore.removeEdge([
                                        { from: currentNode?.id, to: id },
                                    ]);
                                });

                                currentGraphStore.addEdge(
                                    currentNode?.id,
                                    nextNode.id,
                                );
                            }
                            break;
                        case "node:add-prev":
                            {
                                // 添加前置节点
                                const prevNode = NodeUtil.createNode();
                                const parentId =
                                    currentGraphStore.graph?.nodes[current.id]
                                        ?.parent;
                                currentGraphStore.addNode(prevNode);
                                currentGraphStore.addChild(
                                    parentId,
                                    prevNode.id,
                                );
                                currentGraphStore.addEdge(
                                    prevNode.id,
                                    current.id,
                                );
                                currentGraphStore.buildRoots();
                            }
                            break;
                        case "node:insert-prev": // 插入前置节点
                            {
                                const prevNode = NodeUtil.createNode();
                                const currentNode =
                                    currentGraphStore.graph?.nodes[current.id];

                                currentGraphStore.addNode(prevNode);
                                currentGraphStore.addChild(
                                    currentNode?.parent,
                                    prevNode.id,
                                );

                                // 将当前节点的所有前驱节点转移到新节点前面
                                currentNode?.prevs.forEach((id) => {
                                    currentGraphStore.addEdge(id, prevNode.id);
                                    currentGraphStore.removeEdge([
                                        { from: id, to: currentNode?.id },
                                    ]);
                                });

                                currentGraphStore.addEdge(
                                    prevNode.id,
                                    current.id,
                                );
                            }
                            break;
                        case "node:delete-prev-edge": // 删除当前节点的所有前置节点（实际上是删除边）
                            {
                                const currentNode =
                                    currentGraphStore.graph?.nodes[current.id];
                                // 创建要删除的边列表
                                const edgesToDelete =
                                    currentNode?.prevs.map((id) => ({
                                        from: id,
                                        to: current.id,
                                    })) || [];

                                if (edgesToDelete.length > 0) {
                                    currentGraphStore.removeEdge(edgesToDelete);
                                }
                            }
                            break;
                        case "node:delete-next-edge":
                            {
                                // 删除当前节点的所有后续节点（实际上是删除边）
                                const currentNode =
                                    currentGraphStore.graph?.nodes[current.id];
                                // 创建要删除的边列表
                                const edgesToDelete =
                                    currentNode?.nexts.map((id) => ({
                                        from: current.id,
                                        to: id,
                                    })) || [];
                                if (edgesToDelete.length > 0) {
                                    currentGraphStore.removeEdge(edgesToDelete);
                                }
                            }
                            break;
                        case "edge:delete":
                            currentGraphStore.removeEdge([current.id]);
                            break;
                        case "canvas:add-node":
                            {
                                const node = NodeUtil.createNode();
                                currentGraphStore.addNode(node);
                            }
                            break;
                        case "node:add-child":
                            {
                                const currentNode =
                                    currentGraphStore.graph?.nodes[current.id]!;
                                Object.assign(currentNode, {
                                    expanded: true,
                                });
                                currentGraphStore.updateNode(currentNode);
                                const newNode = NodeUtil.createNode();
                                currentGraphStore.addNode(newNode);
                                currentGraphStore.addChild(
                                    currentNode.id,
                                    newNode.id,
                                );
                            }
                            break;
                        case "node:test":
                            testNode(current.id);
                            break;
                        default:
                            console.warn(`Unknown action: ${value}`);
                            break;
                    }
                    renderGraph();
                },
            },
        ],

        // 节点配置
        node: {
            type: "custom-node",
            style: {
                fill: (d: NodeData) =>
                    d.data?.completed ? "#00000050" : "#fff",
                stroke: "#00000080",
                lineWidth: 0.5,
                lineDash: (d: NodeData) => (d.data?.expanded ? [4, 4] : []),
                radius: 8,
                labelText: (d: NodeData) => {
                    return d.data?.expanded ? "" : (d.data?.name as string);
                },
                labelBackground: true,
                labelBackgroundOpacity: 0.7,
                labelBackgroundRadius: 2,
                labelPlacement: "center",
                labelFontSize: 12,
                labelFontWeight: "lighter",
                labelBackgroundFillOpacity: 0,
                labelWordWrap: true,
                labelMaxWidth: "90%",
                labelPadding: 4,
                labelMaxLines: 3,
                shadowColor: undefined,
                shadowBlur: undefined,
                labelTextOverflow: "ellipsis",
                pointerEvents: (d: NodeData) => (d.type ? "none" : "all"),
                port: false,
                ports: [
                    { key: "in", placement: "left", fill: "#7E92B5" },
                    { key: "out", placement: "right", fill: "#D580FF" },
                ],
                button: {
                    r: 12,
                    onClick: (id: string) => {
                        if (animationPlaying.value) return;
                        currentGraphStore.toggleNodeExpanded(id);
                        renderGraph();
                    },
                },
            },
            state: {
                default: {
                    stroke: "#00000080",
                    lineWidth: 0.5,
                    shadowColor: "#000",
                    shadowBlur: 0,
                },
                highlight: {
                    stroke: "#3B82F6",
                    lineWidth: 0.5,
                    shadowColor: "#3B82F6",
                    shadowBlur: 5,
                },
                hover: {},
            },
        },
        // 边配置
        edge: {
            type: "cubic-horizontal",
            style: {
                stroke: "#00000080",
                lineWidth: 0.5,
                increasedLineWidthForHitTesting: 3,
                cursor: "pointer",
            },
        },

        // 交互行为
        behaviors: [
            "zoom-canvas",
            {
                type: "drag-canvas",
                key: "drag-canvas",
                sensitivity: 1, // 设置拖拽灵敏度
            },
        ],
        layout: {
            type: "custom-layout",
            rankdir: "LR",
            marginx: 0,
            marginy: 0,
        },
        animation: configStore.config.graphAnimation,
    });
    graph.on(NodeEvent.CLICK, (evt: IElementEvent & { target: Element }) => {
        const nodeId = evt.target.id;
        const node = currentGraphStore.graph?.nodes[nodeId];
        Object.keys(drawerNode).forEach(
            (key) => delete drawerNode[key as keyof PNode],
        );
        Object.assign(drawerNode, node ?? {});
        drawer.value = true;
    });
    graph.on(
        NodeEvent.POINTER_ENTER,
        (evt: IElementEvent & { target: Element }) => {
            const defaultState = graph?.getElementState(evt.target.id) ?? [];
            graph?.setElementState(evt.target.id, [...defaultState, "hover"]);
        },
    );
    graph.on(
        NodeEvent.POINTER_LEAVE,
        (evt: IElementEvent & { target: Element }) => {
            const defaultState = graph?.getElementState(evt.target.id) ?? [];
            pull(defaultState, "hover");
            graph?.setElementState(evt.target.id, defaultState);
        },
    );
    graph.on(GraphEvent.BEFORE_ANIMATE, () => {
        animationPlaying.value = true;
    });
    graph.on(GraphEvent.AFTER_ANIMATE, () => {
        animationPlaying.value = false;
    });

    graph.render();
});

const testNode = (id: string) => {
    console.log(`Testing node ${id}`);
    graph?.setElementState(id, "default");
    const states = graph?.getElementState(id);
    debug(`${states}`);
};

function renderGraph() {
    graph?.setData(() => currentGraphStore.graphData);
    graph?.render();
}

function saveNode(node: PNode) {
    node.completed && graph?.setElementState(node.id, "default");
    currentGraphStore.updateNode(node);
    renderGraph();
}

function toggleGraphView() {
    if (animationPlaying.value) return;
    currentGraphStore.updateGraph({
        id: currentGraphStore.graph?.id!,
        hideCompleted: !currentGraphStore.graph?.hideCompleted,
    });
    renderGraph();
}

onUnmounted(() => {
    graph?.destroy();
});
</script>
