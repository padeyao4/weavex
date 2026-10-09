import dagre from "dagre";

/**
 * 纯布局计算模块（无 G6 依赖），供主线程与 Web Worker 共用。
 * 输入精简后的节点结构，输出各节点坐标；不直接修改任何外部对象。
 */

export interface SlimNode {
  id: string;
  parent: string;
  nexts: string[];
  expanded: boolean;
  // 布局中间产物（内部使用，不进缓存）
  placeholderSize?: [number, number];
  pos?: LayoutPosition;
}

export interface SlimEdge {
  source: string;
  target: string;
}

export interface LayoutPosition {
  x: number;
  y: number;
  zIndex: number;
  size: [number, number];
}

export interface LayoutResult {
  positions: Record<string, LayoutPosition>;
  graphSize: [number, number];
}

export interface LayoutOptions {
  rankdir?: string;
  align?: string;
  ranksep?: number;
  nodesep?: number;
}

const defaultSize: [number, number] = [120, 60];
const margin = 20;

class SubGraph {
  id: string;
  nodeMap: Map<string, SlimNode> = new Map();
  size?: [number, number];
  dependencies: SubGraph[] = [];
  options: LayoutOptions = {};

  constructor(id: string, options?: LayoutOptions) {
    this.id = id;
    this.options = { ...options };
  }

  layout(layer: number = 1) {
    this.dependencies.forEach((dependency) => {
      if (!dependency.size) {
        dependency.layout(layer + 1);
      }
      const node = this.nodeMap.get(dependency.id)!;
      node.placeholderSize = dependency.size;
    });

    const g = new dagre.graphlib.Graph();
    g.setGraph({ ...this.options });
    g.setDefaultEdgeLabel(() => ({}));
    this.nodeMap.forEach((node) => {
      const size = node.expanded
        ? (node.placeholderSize ?? defaultSize)
        : defaultSize;
      g.setNode(node.id, { width: size[0], height: size[1] });
      node.nexts.forEach((next) => {
        g.setEdge(node.id, next);
      });
    });
    dagre.layout(g);

    this.nodeMap.forEach((node) => {
      const data = g.node(node.id);
      const size = node.expanded
        ? (node.placeholderSize ?? defaultSize)
        : defaultSize;
      node.placeholderSize = size;
      // 临时位置存回 node（setOffset 阶段再平移）
      node.pos = {
        x: data.x,
        y: data.y,
        zIndex: layer,
        size,
      };
    });
    const { width = 0, height = 0 } = g.graph();
    this.size = [width + margin * 2, height + margin * 2];
  }

  setOffset(offsetX: number, offsetY: number) {
    this.nodeMap.forEach((node) => {
      if (!node.pos) return;
      node.pos = {
        ...node.pos,
        x: node.pos.x + offsetX,
        y: node.pos.y + offsetY,
      };
    });
    this.dependencies.forEach((dependency) => {
      const node = this.nodeMap.get(dependency.id);
      if (!node?.pos) return;
      dependency.setOffset(
        node.pos.x - node.pos.size[0] / 2 + margin,
        node.pos.y - node.pos.size[1] / 2 + margin,
      );
    });
  }
}

/** 计算布局：返回纯坐标结果，不修改输入 */
export function computeLayout(
  nodes: SlimNode[],
  options?: LayoutOptions,
): LayoutResult {
  const graphMap = new Map<string, SubGraph>();
  nodes.forEach((node) => {
    const key = node.parent ?? "";
    let subGraph = graphMap.get(key);
    if (!subGraph) {
      subGraph = new SubGraph(key, options);
      graphMap.set(key, subGraph);
    }
    subGraph.nodeMap.set(node.id, node);
  });

  for (const key of graphMap.keys()) {
    if (key === "") continue;
    Array.from(graphMap.values())
      .find((value) => value.id !== key && value.nodeMap.has(key))
      ?.dependencies.push(graphMap.get(key)!);
  }

  const rootGraph = graphMap.get("");
  rootGraph?.layout();
  rootGraph?.setOffset(0, 0);

  const positions: Record<string, LayoutPosition> = {};
  nodes.forEach((node) => {
    if (node.pos) {
      positions[node.id] = node.pos;
    }
  });
  const size = rootGraph?.size ?? [0, 0];
  return { positions, graphSize: size };
}

/** 从 G6 GraphData 提取精简结构（供签名/计算/Worker 传输使用） */
export function toSlimNodes(
  model: { nodes?: { id: string; data?: Record<string, unknown> }[] },
): SlimNode[] {
  return (model.nodes ?? []).map((node) => {
    const data = (node.data ?? {}) as {
      parent?: string;
      nexts?: string[];
      expanded?: boolean;
    };
    return {
      id: node.id,
      parent: data.parent ?? "",
      nexts: data.nexts ?? [],
      expanded: !!data.expanded,
    };
  });
}

/** 结构签名：布局只依赖 节点(id/parent/nexts/expanded) + 边，其余字段变化不触发重排 */
export function computeSignature(
  nodes: SlimNode[],
  edges: SlimEdge[],
): string {
  const nodePart = nodes
    .map(
      (n) =>
        `${n.id}|${n.parent}|${n.nexts.join(",")}|${n.expanded ? 1 : 0}`,
    )
    .sort()
    .join(";");
  const edgePart = edges
    .map((e) => `${e.source}>${e.target}`)
    .sort()
    .join(";");
  return `${nodes.length}#${nodePart}#${edgePart}`;
}
