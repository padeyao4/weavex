<template>
    <div class="w-full h-screen flex flex-col p-4">
        <div class="h-14 flex items-center text-xl font-sans font-medium">
            {{ currentGraphStore.graph?.name }}
        </div>
        <div
            id="container"
            @contextmenu.prevent
            class="flex-1 min-h-0 min-w-0"
        />
        <el-drawer
            v-model="drawer"
            title="节点详情"
            :with-header="false"
            size="400px"
        >
            <div class="node-drawer">
                <el-form
                    :model="drawerNode"
                    label-width="80px"
                    class="node-form"
                >
                    <el-form-item label="节点名称" required>
                        <el-input
                            v-model="drawerNode.name"
                            placeholder="请输入节点名称"
                        />
                    </el-form-item>
                    <el-form-item label="描述">
                        <el-input
                            v-model="drawerNode.description"
                            type="textarea"
                            :rows="3"
                            placeholder="请输入节点描述"
                        />
                    </el-form-item>
                    <el-form-item label="详细记录">
                        <el-input
                            v-model="drawerNode.record"
                            type="textarea"
                            :rows="5"
                            placeholder="请输入节点详细记录"
                        />
                    </el-form-item>
                    <!-- <el-form-item label="开始时间">
                        <el-date-picker
                            v-model="drawerNode.startAt"
                            type="datetime"
                            placeholder="选择开始时间"
                            :default-value="new Date()"
                            value-format="timestamp"
                        />
                    </el-form-item>
                    <el-form-item label="结束时间">
                        <el-date-picker
                            v-model="drawerNode.endAt"
                            type="datetime"
                            placeholder="选择结束时间"
                            :default-value="new Date()"
                            value-format="timestamp"
                        />
                    </el-form-item> -->
                    <el-form-item label="完成状态">
                        <el-switch v-model="drawerNode.completed" />
                        <span
                            style="
                                margin-left: 8px;
                                color: #666;
                                font-size: 12px;
                            "
                        >
                            {{ drawerNode.completed ? "已完成" : "未完成" }}
                        </span>
                    </el-form-item>
                    <el-form-item>
                        <div class="form-actions">
                            <el-button type="primary" @click="saveNode()"
                                >保存</el-button
                            >
                            <el-button @click="drawer = false">取消</el-button>
                        </div>
                    </el-form-item>
                </el-form>
            </div>
        </el-drawer>
    </div>
</template>
<script setup lang="ts">
import { useCurrentGraphStore } from "@/stores";
import { NodeUtil } from "@/utils";
import { Element, Graph, IElementEvent, NodeEvent } from "@antv/g6";
import { onMounted, ref, reactive } from "vue";
import { useRoute } from "vue-router";
import { PNode } from "@/types";

const route = useRoute();
const taskId = route.params.taskId as string;
const currentGraphStore = useCurrentGraphStore();
currentGraphStore.setGraph({ id: taskId as string });

const drawer = ref(false);
const drawerNode = reactive<PNode>(NodeUtil.createNode());

let graph: Graph | undefined;

onMounted(() => {
    graph = new Graph({
        container: "container",
        autoResize: true,
        autoFit: "center",
        data: currentGraphStore.graphData,
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
                                {
                                    name: "删除且保留关系",
                                    value: "combo:delete-keep-edge",
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
                    if (!current) return;
                    switch (value) {
                        case "node:delete-keep-edge":
                        case "combo:delete-keep-edge":
                            {
                                // 删除当前节点但保留当前节点的关系，比如 a->b->c ,当删除b的时候，变成a->c
                                // 如果有 a->c b->c  c->d ,当删除c的时候，变成a->d b->d
                                // 如果有 a->c b->c  c->d c->e ,删除c的时候，变成 a->d b->d a->e b->e
                                const currentNode =
                                    currentGraphStore.graph?.nodes[current.id];
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
                        case "combo:delete":
                            currentGraphStore.removeNode([current.id]);
                            break;
                        case "node:add-next":
                            {
                                const nextNode = NodeUtil.createNode();
                                nextNode.parent =
                                    currentGraphStore.graph?.nodes[
                                        current.id
                                    ].parent;
                                currentGraphStore.addNode(nextNode);
                                currentGraphStore.addEdge(
                                    current.id,
                                    nextNode.id,
                                );
                                graph?.setData(currentGraphStore.graphData);
                                graph?.render();
                            }
                            break;
                        case "node:insert-next":
                            {
                                const nextNode = NodeUtil.createNode();
                                const currentNode =
                                    currentGraphStore.graph?.nodes[current.id];
                                nextNode.parent = currentNode?.parent;
                                currentGraphStore.addNode(nextNode);
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
                                const currentNode =
                                    currentGraphStore.graph?.nodes[current.id];
                                prevNode.parent = currentNode?.parent;
                                currentGraphStore.addNode(prevNode);
                                currentGraphStore.addEdge(
                                    prevNode.id,
                                    current.id,
                                );
                            }
                            break;
                        case "node:insert-prev": // 插入前置节点
                            {
                                const prevNode = NodeUtil.createNode();
                                const currentNode =
                                    currentGraphStore.graph?.nodes[current.id];
                                prevNode.parent = currentNode?.parent;

                                currentGraphStore.addNode(prevNode);

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
                                    currentGraphStore.graph?.nodes[current.id];
                                const newNode = NodeUtil.createNode();
                                currentGraphStore.addNode(newNode);
                                currentGraphStore.setChildWithTravel(
                                    currentNode,
                                    newNode,
                                );
                                graph?.clear();
                            }
                            break;
                        default:
                            console.warn(`Unknown action: ${value}`);
                            break;
                    }
                    renderGraph();
                },
            },
            {
                type: "grid-line",
                size: 20,
            },
        ],

        // 节点配置
        node: {
            type: (value) => value.type ?? "rect",
            style: {
                fill: (d: any) => (d.data.completed ? "#00000050" : "#fff"),
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
        behaviors: [
            "zoom-canvas",
            {
                type: "drag-canvas",
                key: "drag-canvas",
                sensitivity: 1, // 设置拖拽灵敏度
            },
        ],

        // 布局配置 - 使用内置的力导向布局
        layout: {
            type: "antv-dagre",
            rankdir: "LR",
            sortByCombo: true,
        },
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
    graph.render();
});

function renderGraph() {
    graph?.setData(() => currentGraphStore.graphData);
    graph?.render();
}

function saveNode() {
    currentGraphStore.updateNode(drawerNode);
    renderGraph();
    drawer.value = false;
}
</script>
