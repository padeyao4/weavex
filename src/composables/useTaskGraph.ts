import { useConfigStore, useGraphStore } from "@/stores";
import { measureTime } from "@/utils";
import { debug } from "@tauri-apps/plugin-log";
import {
  EdgeData,
  EdgeEvent,
  Element,
  Graph,
  GraphData,
  GraphEvent,
  IElementEvent,
  NodeData,
  NodeEvent,
} from "@antv/g6";
import { debounce } from "lodash-es";
import {
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  watch,
  type ComputedRef,
  type Ref,
} from "vue";
import type { PGraph, PNode } from "@/types";

/**
 * DAG 画布生命周期管理：Graph 实例创建、数据同步、动画开关、视口保存/恢复、
 * 节点/边 hover 状态、右键菜单操作派发、主题感知渲染。
 * 组件只保留模板绑定与编辑抽屉交互。
 */
export function useTaskGraph(options: {
  container: string;
  graphId: string;
  currentGraph: ComputedRef<PGraph | undefined>;
  drawerNode: Ref<PNode | null>;
}) {
  const { graphId, currentGraph, drawerNode } = options;
  const graphStore = useGraphStore();
  const configStore = useConfigStore();

  const graph = shallowRef<Graph | undefined>(undefined);
  const animationPlaying = ref(false);
  let themeObserver: MutationObserver | undefined;

  // 主题感知取色：亮/暗两套色值，渲染时按 html.dark 解析
  const isDark = () => document.documentElement.classList.contains("dark");
  const themeColor = (light: string, dark: string) =>
    isDark() ? dark : light;

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
    graph.value?.setData(result);
    await graph.value?.render();
    disableEditAnimation(); // 渲染完成：复位动画开关，避免残留影响后续渲染
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

  const EDIT_ANIMATION = { duration: 200 };

  // 编辑操作：开启动画（受设置开关控制）。
  // 初始化/切换项目时 G6 构造不带 animation，直接展示 DAG；只有编辑操作才临时开启。
  const enableEditAnimation = () => {
    graph.value?.setOptions({
      animation: configStore.config.graphAnimation ? EDIT_ANIMATION : false,
    });
  };

  // 渲染完成：复位动画开关，避免残留影响后续渲染
  const disableEditAnimation = () => {
    graph.value?.setOptions({ animation: false });
  };

  const fitView = () => {
    graph.value?.fitView();
  };

  const autoArchive = () => {
    graphStore.autoArchive(graphId);
  };

  const fitCenter = () => {
    graph.value?.fitCenter();
  };

  const toggleArchive = async () => {
    graphStore.updateGraph({
      id: graphId,
      showArchive: !currentGraph.value?.showArchive,
    });
    enableEditAnimation();
    graph.value?.updateTransform({
      key: "archive-transform",
      showArchive: graphStore.getGraph(graphId).showArchive,
    });
    // updateTransform 只更新配置并 refreshData，不触发渲染；
    // 必须显式 render() 才会重新执行 archive-transform 的 beforeDraw
    await graph.value?.render();
    disableEditAnimation();
  };

  // 保存当前画布视口（缩放 + 画布原点在视口的位置）
  const saveViewport = () => {
    if (!graph.value) return;
    const [x, y] = graph.value.getPosition();
    debug(
      `[viewport] save zoom=${graph.value.getZoom()} pos=${JSON.stringify(graph.value.getPosition())}`,
    );
    graphStore.updateGraph(
      {
        id: graphId,
        viewport: { zoom: graph.value.getZoom(), x, y },
      },
      { persist: true }, // persist 走 debouncedSave 防抖写库
    );
  };

  const setNodeStatus = function (nodeId: string, state: string) {
    const states = graph.value?.getElementState(nodeId) ?? [];
    const set = new Set(states);
    set.add(state);
    graph.value?.setElementState(nodeId, Array.from(set));
  };

  const clearNodeStatus = function (nodeId: string, state: string) {
    const states = graph.value?.getElementState(nodeId) ?? [];
    const set = new Set(states);
    set.delete(state);
    graph.value?.setElementState(nodeId, Array.from(set));
  };

  // 重绘（局部数据更新后的 draw）
  const redraw = () => graph.value?.draw();

  // 画布尺寸跟随容器变化
  const resize = () => graph.value?.resize();

  onMounted(async () => {
    // 主题切换（含跟随系统实时变化）时重渲染画布，使节点/边取色生效
    themeObserver = new MutationObserver(() => {
      graph.value?.render();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // 构造时直接携带初始数据，避免"空渲染 + 数据渲染"两次布局
    const initialData = graphStore.toGraphData(graphStore.allGraph[graphId]);
    lastSignature = computeGraphSignature(initialData);

    graph.value = new Graph({
      container: options.container,
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
            // 编辑操作（增删/插入节点、删除边、新建节点等）：开启动画
            enableEditAnimation();
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
                  {
                    text: "归",
                    placement: "left-top",
                    offsetX: 6,
                    offsetY: -2,
                  }, // 默认显示在上方
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
              enableEditAnimation();
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
          hover: {
            stroke: "#3B82F6",
            lineWidth: 1.2,
            shadowColor: "#3B82F6",
            shadowBlur: 8,
            cursor: "pointer",
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
            const source = graph.value?.getNodeData(d.source).data;
            return currentGraph.value?.showArchive || !source?.isArchive
              ? "visible"
              : "hidden";
          },
        },
        state: {
          hover: {
            stroke: "#3B82F6",
            lineWidth: 2,
            shadowColor: "#3B82F6",
            shadowBlur: 8,
            cursor: "pointer",
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
      // 初始化/切换项目不带动画（直接展示 DAG）：
      // 必须显式 false，不传会落到 G6 默认主题动画（duration 1000ms）；
      // 编辑操作时由 enableEditAnimation 临时开启，渲染完成后复位
      animation: false,
    });

    // 点击节点：打开编辑抽屉
    graph.value.on(
      NodeEvent.CLICK,
      (evt: IElementEvent & { target: Element }) => {
        const nodeId = evt.target.id;
        const node = currentGraph.value?.nodes[nodeId];
        drawerNode.value = node ? { ...node } : null;
      },
    );
    // 鼠标悬停节点：添加 hover 样式；移出节点时移除
    graph.value.on(
      NodeEvent.POINTER_ENTER,
      (evt: IElementEvent & { target: Element }) => {
        const id = evt.target.id;
        if (id && graph.value?.getElementType(id) === "node") {
          setNodeStatus(id, "hover");
        }
      },
    );
    graph.value.on(
      NodeEvent.POINTER_LEAVE,
      (evt: IElementEvent & { target: Element }) => {
        const id = evt.target.id;
        if (id && graph.value?.getElementType(id) === "node") {
          clearNodeStatus(id, "hover");
        }
      },
    );
    // 鼠标悬停边：添加 hover 样式；移出边时移除
    graph.value.on(
      EdgeEvent.POINTER_ENTER,
      (evt: IElementEvent & { target: Element }) => {
        const id = evt.target.id;
        if (id && graph.value?.getElementType(id) === "edge") {
          setNodeStatus(id, "hover");
        }
      },
    );
    graph.value.on(
      EdgeEvent.POINTER_LEAVE,
      (evt: IElementEvent & { target: Element }) => {
        const id = evt.target.id;
        if (id && graph.value?.getElementType(id) === "edge") {
          clearNodeStatus(id, "hover");
        }
      },
    );
    graph.value.on(GraphEvent.BEFORE_ANIMATE, () => {
      animationPlaying.value = true;
    });
    graph.value.on(GraphEvent.AFTER_ANIMATE, () => {
      animationPlaying.value = false;
    });
    // 画布视口（拖动/缩放）变化时保存，下次打开恢复
    graph.value.on("canvas:dragend", saveViewport);
    graph.value.on("canvas:wheel", saveViewport);

    await graph.value.render();
    // 恢复上次关闭时的画布视口（缩放 + 平移，无动画）
    const vp = currentGraph.value?.viewport;
    if (vp) {
      debug(`[viewport] restore target=${JSON.stringify(vp)}`);
      await graph.value.zoomTo(vp.zoom, false);
      // 不能用 translateTo（绝对平移）：G6 会把 camera 的 position 与 focalPoint
      // 设为同一点，lookAt 退化导致画面翻转/异常。用 translateBy（相对平移，
      // 与 drag-canvas 同机制）把当前视口偏移到目标位置：
      // 视口坐标差 → 画布相对位移需乘当前 zoom。
      let [px, py] = graph.value.getPosition();
      for (let i = 0; i < 3; i++) {
        const dx = vp.x - px;
        const dy = vp.y - py;
        if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) break;
        await graph.value.translateBy([dx * vp.zoom, dy * vp.zoom], false);
        [px, py] = graph.value.getPosition();
      }
      debug(
        `[viewport] restore after zoom=${graph.value.getZoom()} pos=${JSON.stringify(graph.value.getPosition())}`,
      );
      const b = graph.value.getCanvas()?.getBounds();
      debug(
        `[viewport] bounds=${b ? JSON.stringify({ min: b.min, max: b.max }) : "none"}`,
      );
    }
  });

  onUnmounted(() => {
    // 卸载（切换项目/关闭）前兜底保存一次视口
    saveViewport();
    themeObserver?.disconnect();
    graph.value?.destroy();
  });

  return {
    animationPlaying,
    syncGraphData,
    debounceSyncData,
    enableEditAnimation,
    disableEditAnimation,
    fitView,
    fitCenter,
    autoArchive,
    toggleArchive,
    saveViewport,
    resize,
    redraw,
    setNodeStatus,
    clearNodeStatus,
  };
}
