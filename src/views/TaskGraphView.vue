<template>
  <div>
    <div style="height: 56px">header {{ taskId }}</div>
    <div
      style="height: calc(100% - 56px)"
      id="container"
      @contextmenu.prevent
    />
    <el-drawer v-model="drawer" title="I am the title" :with-header="false">
      <span>Hi there!</span>
      <!-- todo  -->
    </el-drawer>
  </div>
</template>
<script setup lang="ts">
import { useCurrentGraphStore, useGraphsStore } from "@/stores";
import { GraphUtils, NodeUtil } from "@/utils";
import { Element, Graph, IElementEvent, NodeEvent } from "@antv/g6";
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const taskId = route.params.taskId;
const currentGraphStore = useCurrentGraphStore();
currentGraphStore.setGraph({ id: taskId as string });
const graphsStore = useGraphsStore();

const data = computed(() => {
  return GraphUtils.toGraphData(graphsStore.currentGraph);
});

const drawer = ref(false);

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
              return [{ name: "添加节点", value: "canvas:add-node" }];
            default:
              return [];
          }
        },
        onClick: (value: any, _target: HTMLElement, current?: Element) => {
          if (!current) return;
          switch (value) {
            case "node:delete-keep-edge":
            case "combo:delete-keep-edge":
              if (current) {
                const currentNode = graphsStore.currentGraph?.nodes[current.id];
                // 删除当前节点但保留当前节点的关系，比如 a->b->c ,当删除b的时候，变成a->c
                // 如果有 a->c b->c  c->d ,当删除c的时候，变成a->d b->d
                // 如果有 a->c b->c  c->d c->e ,删除c的时候，变成 a->d b->d a->e b->e

                if (currentNode) {
                  const prevs = [...currentNode.prevs];
                  const nexts = [...currentNode.nexts];

                  // 为每一对（前驱，后继）建立新的边
                  for (const prevId of prevs) {
                    for (const nextId of nexts) {
                      // 避免创建重复的边
                      const prevNode = graphsStore.currentGraph?.nodes[prevId];
                      const nextNode = graphsStore.currentGraph?.nodes[nextId];
                      if (
                        prevNode &&
                        nextNode &&
                        !prevNode.nexts.includes(nextId)
                      ) {
                        graphsStore.addEdge(
                          graphsStore.currentGraph,
                          prevId,
                          nextId
                        );
                      }
                    }
                  }

                  // 删除当前节点
                  graphsStore.removeNode(graphsStore.currentGraph, [
                    current.id,
                  ]);
                }

                graph.setData(data.value);
                graph.render();
              }
              break;
            case "node:delete":
            case "combo:delete":
              if (current) {
                graphsStore.removeNode(graphsStore.currentGraph, [current.id]);
                graph.setData(data.value);
                graph.render();
              }
              break;
            case "node:add-next":
              if (current) {
                const nextNode = NodeUtil.fakerNode();

                nextNode.parent =
                  graphsStore.currentGraph?.nodes[current.id].parent;

                graphsStore.addNode(graphsStore.currentGraph, nextNode);
                graphsStore.addEdge(
                  graphsStore.currentGraph,
                  current.id,
                  nextNode.id
                );
                graph.setData(data.value);
                graph.render();
              }
              break;
            case "node:insert-next":
              if (current) {
                const nextNode = NodeUtil.fakerNode();
                const currentNode = graphsStore.currentGraph?.nodes[current.id];
                nextNode.parent = currentNode?.parent;
                graphsStore.addNode(graphsStore.currentGraph, nextNode);
                currentNode?.nexts.forEach((id) => {
                  graphsStore.addEdge(
                    graphsStore.currentGraph,
                    nextNode.id,
                    id
                  );
                  graphsStore.removeEdge(graphsStore.currentGraph, [
                    { from: currentNode?.id, to: id },
                  ]);
                });

                graphsStore.addEdge(
                  graphsStore.currentGraph,
                  currentNode?.id,
                  nextNode.id
                );
                // 添加边
                graph.setData(data.value);
                graph.render();
              }
              break;
            case "node:add-prev":
              // 添加前置节点
              if (current) {
                const prevNode = NodeUtil.fakerNode();
                const currentNode = graphsStore.currentGraph?.nodes[current.id];
                prevNode.parent = currentNode?.parent;

                graphsStore.addNode(graphsStore.currentGraph, prevNode);
                graphsStore.addEdge(
                  graphsStore.currentGraph,
                  prevNode.id,
                  current.id
                );
                graph.setData(data.value);
                graph.render();
              }
              break;
            case "node:insert-prev":
              // 插入前置节点
              if (current) {
                const prevNode = NodeUtil.fakerNode();
                const currentNode = graphsStore.currentGraph?.nodes[current.id];
                prevNode.parent = currentNode?.parent;

                graphsStore.addNode(graphsStore.currentGraph, prevNode);

                // 将当前节点的所有前驱节点转移到新节点前面
                currentNode?.prevs.forEach((id) => {
                  graphsStore.addEdge(
                    graphsStore.currentGraph,
                    id,
                    prevNode.id
                  );
                  graphsStore.removeEdge(graphsStore.currentGraph, [
                    { from: id, to: currentNode?.id },
                  ]);
                });

                graphsStore.addEdge(
                  graphsStore.currentGraph,
                  prevNode.id,
                  current.id
                );
                graph.setData(data.value);
                graph.render();
              }
              break;
            case "node:delete-prev-edge":
              // 删除当前节点的所有前置节点（实际上是删除边）
              if (current) {
                const currentNode = graphsStore.currentGraph?.nodes[current.id];
                // 创建要删除的边列表
                const edgesToDelete =
                  currentNode?.prevs.map((id) => ({
                    from: id,
                    to: current.id,
                  })) || [];

                if (edgesToDelete.length > 0) {
                  graphsStore.removeEdge(
                    graphsStore.currentGraph,
                    edgesToDelete
                  );
                  graph.setData(data.value);
                  graph.render();
                }
              }
              break;
            case "node:delete-next-edge":
              // 删除当前节点的所有后续节点（实际上是删除边）
              if (current) {
                const currentNode = graphsStore.currentGraph?.nodes[current.id];
                // 创建要删除的边列表
                const edgesToDelete =
                  currentNode?.nexts.map((id) => ({
                    from: current.id,
                    to: id,
                  })) || [];

                if (edgesToDelete.length > 0) {
                  graphsStore.removeEdge(
                    graphsStore.currentGraph,
                    edgesToDelete
                  );
                  graph.setData(data.value);
                  graph.render();
                }
              }
              break;
            case "edge:delete":
              if (current) {
                graphsStore.removeEdge(graphsStore.currentGraph, [current.id]);
                graph.setData(data.value);
                graph.render();
              }
              break;
            case "canvas:add-node":
              const node = NodeUtil.fakerNode();
              graphsStore.addNode(graphsStore.currentGraph, node);
              graph.setData(data.value);
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
    const node = graphsStore.currentGraph?.nodes[nodeId];
    drawer.value = true;
    // todo 将node信息填入el-drawer内用于展示,并且可以编辑
  });
  graph.render();
});
</script>
