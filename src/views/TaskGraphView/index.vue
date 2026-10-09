<template>
  <div class="flex h-full min-w-0 flex-1 flex-row" ref="containerRef">
    <div class="flex min-w-0 flex-1 flex-col pt-7.5">
      <div
        class="flex h-12 items-center pl-4 select-none"
        data-tauri-drag-region
      >
        <div
          class="overflow-hidden font-sans text-xl text-ellipsis whitespace-nowrap"
        >
          {{ currentGraph?.name }}
        </div>
      </div>
      <div
        id="canvas"
        ref="canvasRef"
        @contextmenu.prevent
        class="min-h-0 min-w-0 flex-1 overflow-hidden border-t border-border bg-canvas"
      />
      <footer
        class="flex h-12 flex-row items-center justify-center gap-2 border-t border-border"
      >
        <el-button
          circle
          icon="Open"
          :type="currentGraph?.showArchive ? 'default' : 'info'"
          @click="toggleArchive"
          :loading="animationPlaying"
          title="归档节点显示"
        />
        <el-button
          circle
          @click="fitView()"
          :loading="animationPlaying"
          title="适应画布大小"
          icon="FullScreen"
        >
        </el-button>
        <el-button
          circle
          @click="fitCenter()"
          :loading="animationPlaying"
          title="居中显示"
          icon="Aim"
        >
        </el-button>
        <el-button
          title="自动归档"
          circle
          icon="Box"
          @click="autoArchive()"
          :loading="animationPlaying"
        />
      </footer>
    </div>
    <template v-if="!isMobile && drawerNode">
      <NodeDetailForm
        :node="drawerNode"
        :graphId="graphId"
        :enableArchive="enableArchive"
        @save="handleSave"
        @cancel="handleCancel"
        class="w-90 border-l border-border bg-surface"
      />
    </template>
    <teleport to="body" v-else-if="drawerNode">
      <NodeDetailDrawer
        :model-value="true"
        :node="drawerNode"
        :graphId="graphId"
        @update:model-value="handleDrawerClose"
        @save="updateNode"
      />
    </teleport>
  </div>
</template>
<script setup lang="ts">
import { useConfigStore, useGraphStore } from "@/stores";
import { measureTime } from "@/utils";
import {
  EdgeData,
  Element,
  Graph,
  GraphData,
  GraphEvent,
  IElementEvent,
  NodeData,
  NodeEvent,
} from "@antv/g6";
import {
  onMounted,
  ref,
  onUnmounted,
  computed,
  watch,
  useTemplateRef,
} from "vue";
import { useRoute } from "vue-router";
import { PNode } from "@/types";
import { debug } from "@tauri-apps/plugin-log";
import NodeDetailDrawer from "./NodeDetailDrawer.vue";
import NodeDetailForm from "@/components/NodeDetailForm.vue";
import { debounce } from "lodash-es";
import { useEventListener, useResizeObserver } from "@vueuse/core";

const containerRef = useTemplateRef("containerRef");
const canvasRef = useTemplateRef("canvasRef");
const route = useRoute();
const graphId = route.params.taskId as string;
const graphStore = useGraphStore();
const configStore = useConfigStore();
const currentGraph = computed(() => graphStore.getGraph(graphId));

const drawerNode = ref<PNode | null>(null);
const isMobile = ref(false);

// 主题感知取色：亮/暗两套色值，渲染时按 html.dark 解析
const isDark = () => document.documentElement.classList.contains("dark");
const themeColor = (light: string, dark: string) =>
  isDark() ? dark : light;

const checkScreenWidth = () => {
  isMobile.value = window.innerWidth < 1000;
};

const enableArchive = computed(() => {
  if (!drawerNode.value) return false;
  return graphStore.canBeArchive(
    graphId,
    drawerNode.value.id,
    drawerNode.value.completed,
  );
});

let graph: Graph | undefined;
let themeObserver: MutationObserver | undefined;

// 内容签名：任何影响画布展示的字段（名称/完成态/归档/结构等）变化都触发重绘；
// 布局是否重排由 layout.ts 的内部结构签名缓存兜底（改名等不重排，坐标保持不变）
let lastSignature = "";
const computeGraphSignature = (data: GraphData) => JSON.stringify(data);

const syncGraphData = async function () {
  if (animationPlaying.value) return;
  const { result } = await measureTime(() => {
    return graphStore.toGraphData(graphStore.allGraph[graphId]);
  }, "to graph data cost time");
  const signature = computeGraphSignature(result);
  if (signature === lastSignature) return; // 结构未变，跳过全量重绘
  lastSignature = signature;
  graph?.setData(result);
  graph?.render();
};

const debounceSyncData = debounce(() => {
  syncGraphData();
}, 50);

watch(
  [graphStore.allGraph],
  () => {
    debounceSyncData();
  },
  { immediate: true },
);

const fitView = () => {
  graph?.fitView();
};

const autoArchive = () => {
  graphStore.autoArchive(graphId);
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
  // updateTransform 只更新配置并 refreshData，不触发渲染；
  // 必须显式 render() 才会重新执行 archive-transform 的 beforeDraw
  graph?.render();
};

useEventListener("resize", checkScreenWidth);

onMounted(() => {
  checkScreenWidth();

  // 主题切换（含跟随系统实时变化）时重渲染画布，使节点/边取色生效
  themeObserver = new MutationObserver(() => {
    graph?.render();
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  // 构造时直接携带初始数据，避免"空渲染 + 数据渲染"两次布局
  const initialData = graphStore.toGraphData(graphStore.allGraph[graphId]);
  lastSignature = computeGraphSignature(initialData);

  graph = new Graph({
    container: "canvas",
    autoResize: false,
    data: initialData,
    transforms: [
      "collapsed-transform",
      {
        type: "archive-transform",
        key: "archive-transform",
        showArchive: graphStore.getGraph(graphId).showArchive,
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
              graphStore.debouncedSave();
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
        fill: (d: NodeData) =>
          d.data?.completed
            ? themeColor("#00000050", "#232930")
            : themeColor("#fff", "#2b323d"),
        stroke: themeColor("#00000080", "#47505e"),
        lineWidth: 0.5,
        lineDash: (d: NodeData) => (d.data?.expanded ? [4, 4] : []),
        radius: 8,
        labelText: (d: NodeData) => d.data?.name as string,
        labelFill: themeColor("#000000", "#e5e7eb"),
        labelBackground: true,
        labelBackgroundFill: themeColor("#fff", "#333b47"),
        labelBackgroundOpacity: (d: NodeData) => (d.data?.expanded ? 1 : 0),
        labelBackgroundRadius: 6,
        labelPlacement: (d: NodeData) => (d.data?.expanded ? "top" : "center"),
        labelFontSize: 12,
        labelFontWeight: "lighter",
        labelBackgroundFillOpacity: (d: NodeData) => (d.data?.expanded ? 1 : 0),
        labelOffsetY: (d: NodeData) => (d.data?.expanded ? 8 : 0),
        labelWordWrap: true,
        labelMaxWidth: (d: NodeData) => (d.data?.expanded ? "70%" : "90%"),
        labelPadding: 4,
        labelMaxLines: (d: NodeData) => (d.data?.expanded ? 1 : 3),
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
        showExpandedButton: (d: NodeData) => d.data?.expanded,
        button: {
          r: 12,
          onClick: (id: string | undefined) => {
            if (animationPlaying.value || !id) return;
            graphStore.toggleNodeExpanded(graphId, id);
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
        chosen: {
          lineWidth: 1,
          shadowBlur: 5,
        },
      },
      animation: {
        exit: [
          {
            fields: ["opacity"],
          },
          {
            fields: ["opacity"],
            shape: "button-background",
          },
          {
            fields: ["opacity"],
            shape: "counter",
          },
        ],
      },
    },
    // 边配置
    edge: {
      type: "cubic-horizontal",
      style: {
        stroke: themeColor("#00000080", "#4b5563"),
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
    ],
    layout: {
      type: "custom-layout",
      rankdir: "LR",
      marginx: 0,
      marginy: 0,
    },
    animation: configStore.config.graphAnimation && {
      duration: 200,
    },
  });
  graph.on(NodeEvent.CLICK, (evt: IElementEvent & { target: Element }) => {
    const nodeId = evt.target.id;
    const node = currentGraph.value.nodes[nodeId];
    drawerNode.value = node ? { ...node } : null;
  });
  graph.on(GraphEvent.BEFORE_ANIMATE, () => {
    animationPlaying.value = true;
  });
  graph.on(GraphEvent.AFTER_ANIMATE, () => {
    animationPlaying.value = false;
  });

  graph.render();
});

useResizeObserver([containerRef, canvasRef], (entries) => {
  if (entries[0].target == containerRef.value) {
    graph?.resize();
  } else {
    !drawerNode.value && graph?.resize();
  }
});

watch(drawerNode, (v, ov) => {
  if (ov) {
    clearNodeStatus(ov.id!, "chosen");
  }
  if (v) {
    setNodeStatus(v.id!, "chosen");
  }
});

const setNodeStatus = function (nodeId: string, state: string) {
  const states = graph?.getElementState(nodeId) ?? [];
  const set = new Set(states);
  set.add(state);
  graph?.setElementState(nodeId, Array.from(set));
};

const clearNodeStatus = function (nodeId: string, state: string) {
  const states = graph?.getElementState(nodeId) ?? [];
  const set = new Set(states);
  set.delete(state);
  graph?.setElementState(nodeId, Array.from(set));
};

onUnmounted(() => {
  themeObserver?.disconnect();
  graph?.destroy();
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
  drawerNode.value = null;
}

function handleSave(node: PNode) {
  updateNode(node);
}

function handleCancel() {
  drawerNode.value = null;
}

function handleDrawerClose() {
  drawerNode.value = null;
}
</script>
