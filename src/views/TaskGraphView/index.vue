<template>
  <div class="flex flex-col pt-6">
    <div class="flex h-14 items-center pl-4 font-sans text-xl select-none">
      {{ currentGraph?.name }}
    </div>
    <div
      id="container"
      @contextmenu.prevent
      class="min-h-0 min-w-0 flex-1 border-t border-gray-200"
    />
    <footer
      class="flex h-12 flex-row items-center justify-center gap-2 border-t border-gray-200"
    >
      <!-- <div
        class="flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-200 hover:bg-gray-100"
        @click="toggleGraphView"
        title="切换视图"
      >
        <div class="relative h-6 w-6">
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
              hidden: !currentGraph?.hideCompleted,
            }"
          />
        </div>
      </div> -->
      <el-button
        circle
        :icon="View"
        :type="currentGraph?.showArchive ? 'default' : 'primary'"
        @click="toggleArchive"
        :loading="animationPlaying"
      />
      <div
        class="flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-200 hover:bg-gray-100"
        @click="fitView()"
        title="适应画布大小"
      >
        <div class="relative h-6 w-6">
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
        class="flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-200 hover:bg-gray-100"
        @click="fitCenter()"
        title="居中显示"
      >
        <div class="relative h-6 w-6">
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
    <NodeDetailDrawer v-model="drawer" :node="drawerNode" @save="updateNode" />
  </div>
</template>
<script setup lang="ts">
import { useConfigStore, useGraphStore } from "@/stores";
import { NodeUtil } from "@/utils";
import {
  EdgeData,
  Element,
  Graph,
  GraphEvent,
  IElementEvent,
  NodeData,
  NodeEvent,
} from "@antv/g6";
import { onMounted, ref, reactive, onUnmounted, computed, watch } from "vue";
import { useRoute } from "vue-router";
import { PNode } from "@/types";
import { debug } from "@tauri-apps/plugin-log";
import NodeDetailDrawer from "./NodeDetailDrawer.vue";
import { View } from "@element-plus/icons-vue";
import { debounce } from "lodash-es";

const route = useRoute();
const graphId = route.params.taskId as string;
const graphStore = useGraphStore();
const configStore = useConfigStore();
const currentGraph = computed(() => graphStore.getGraph(graphId));

const drawer = ref(false);
const drawerNode = reactive<PNode>(NodeUtil.createNode());

let graph: Graph | undefined;

const syncGraphData = function () {
  if (animationPlaying.value) return;
  graph?.setData(graphStore.toGraphData(graphStore.allGraph[graphId]));
  graph?.render();
};

const debounceSyncData = debounce(() => {
  syncGraphData();
}, 50);

watch([graphStore.allGraph], () => {
  debounceSyncData();
});

const fitView = () => {
  graph?.fitView();
};

const fitCenter = () => {
  graph?.fitCenter();
};

const animationPlaying = ref(false);

const toggleArchive = () => {
  graphStore.updateGraph({
    id: graphId,
    showArchive: !currentGraph.value.showArchive,
  });
  graph?.updateTransform({
    key: "archive-transform",
    showArchive: graphStore.getGraph(graphId).showArchive,
  });
};

onMounted(() => {
  graph = new Graph({
    container: "container",
    autoResize: true,
    data: graphStore.toGraphData(graphId),
    transforms: [
      {
        type: "expanded-transform",
        showArchive: graphStore.getGraph(graphId).showArchive,
      },
      {
        type: "archive-transform",
        key: "archive-transform",
        showArchive: graphStore.getGraph(graphId).showArchive,
      },
      {
        type: "custom-transform",
        graphId: graphId,
      },
    ],
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
              return [{ name: "添加节点", value: "canvas:add-new-node" }];
            default:
              debug("getItems : " + e.targetType);
              return [];
          }
        },
        onClick: (value: any, _target: HTMLElement, current?: Element) => {
          if (!current || animationPlaying.value) return;
          const options = {
            persist: true,
            buildRoots: true,
            update: true,
          };

          switch (value) {
            case "node:delete-keep-edge": // 删除节点保持前后边的关系
              graphStore.deleteNodeKeepEdges(graphId, current.id, options);
              break;
            case "node:delete":
              graphStore.removeNode(graphId, current.id);
              break;
            case "node:add-next":
              graphStore.appendNewNode(graphId, current.id, options);
              break;
            case "node:insert-next":
              graphStore.insertNewNode(graphId, current.id, {
                persist: true,
                buildRoots: true,
                update: true,
              });
              break;
            case "node:add-prev":
              graphStore.addFrontNewNode(graphId, current.id, {
                persist: true,
                buildRoots: true,
                update: true,
              });
              break;
            case "node:insert-prev": // 插入前置节点
              graphStore.insertFrontNewNode(graphId, current.id, {
                persist: true,
                buildRoots: true,
                update: true,
              });
              break;
            case "node:delete-prev-edge": // 删除当前节点的所有前置节点（实际上是删除边）
              graphStore.deletePrevsNodeEdge(graphId, current.id, {
                persist: true,
                buildRoots: true,
                update: true,
              });
              break;
            case "node:delete-next-edge":
              graphStore.deleteNextsNodeEdge(graphId, current.id, {
                persist: true,
                buildRoots: true,
                update: true,
              });
              break;
            case "edge:delete":
              graphStore.deleteEdgeById(graphId, current.id);
              break;
            case "canvas:add-new-node":
              graphStore.addNewNode(graphId, {
                persist: true,
                update: true,
                buildRoots: true,
              });
              break;
            case "node:add-child":
              graphStore.addNewChildNode(graphId, current.id, {
                buildRoots: true,
              });
              graphStore.setNodeExpanded(graphId, current.id, true, {
                update: true,
                persist: true,
              });
              break;
            case "node:test":
              break;
            default:
              console.warn(`Unknown action: ${value}`);
              break;
          }
        },
      },
    ],

    // 节点配置
    node: {
      type: "custom-node",
      style: {
        fill: (d: NodeData) => (d.data?.completed ? "#00000050" : "#fff"),
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
        shadowColor: "#000",
        shadowBlur: 0,
        labelTextOverflow: "ellipsis",
        badges: (d: NodeData) => {
          return d.data?.isArchive
            ? [
                { text: "归", placement: "left-top", offsetX: 6, offsetY: -2 }, // 默认显示在上方
              ]
            : undefined;
        },
        badgeFontSize: 6,
        badgePadding: [1, 3],
        port: false,
        ports: [
          { key: "in", placement: "left" },
          { key: "out", placement: "right" },
        ],
        countChildren: (d?: NodeData) =>
          ((d?.data?.children as string[]) || []).length,
        button: {
          r: 12,
          onClick: (id: string | undefined) => {
            if (animationPlaying.value || !id) return;
            graphStore.toggleNodeExpanded(graphId, id);
            // todo
          },
        },
      },
      state: {
        followed: {
          stroke: "#3B82F6",
          lineWidth: 0.5,
          shadowColor: "#3B82F6",
          shadowBlur: 5,
        },
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
        visibility: (d: EdgeData) => {
          const source = graph?.getNodeData(d.source).data;
          return currentGraph?.value.showArchive || !source?.isArchive
            ? "visible"
            : "hidden";
        },
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
      "drag-element",
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
    const node = currentGraph.value.nodes[nodeId];
    Object.keys(drawerNode).forEach(
      (key) => delete drawerNode[key as keyof PNode],
    );
    Object.assign(drawerNode, node ?? {});
    drawer.value = true;
  });
  graph.on(GraphEvent.BEFORE_ANIMATE, () => {
    animationPlaying.value = true;
  });
  graph.on(GraphEvent.AFTER_ANIMATE, () => {
    animationPlaying.value = false;
  });

  graph.render();
});
/**
 * 更新节点
 * @param node
 */
function updateNode(node: PNode) {
  const states = graph?.getElementState(node.id) ?? [];
  const set = new Set(states);
  if (node.isFollowed && !node.completed) {
    set.add("followed");
  } else {
    set.delete("followed");
  }
  graph?.setElementState(node.id, Array.from(set));

  graphStore.updateNode(graphId, node, {
    persist: true,
    update: true,
  });
  graph?.draw();
}

onUnmounted(() => {
  graph?.destroy();
});
</script>
