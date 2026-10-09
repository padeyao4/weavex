import { measureTime } from "@/utils";
import {
  BaseLayout,
  BaseLayoutOptions,
  GraphData,
  NodeData,
} from "@antv/g6";
import {
  computeLayout,
  computeSignature,
  LayoutPosition,
  LayoutResult,
  toSlimNodes,
} from "./layout-core";

export interface DagreLayoutOptions extends BaseLayoutOptions {
  rankdir?: string;
  align?: string;
  ranksep?: number;
  nodesep?: number;
}

/** 节点数超过该阈值时，布局计算放 Web Worker，避免阻塞主线程 */
const WORKER_THRESHOLD = 120;
/** 布局缓存上限（按结构签名），超过时淘汰最旧 */
const CACHE_MAX = 100;

const layoutCache = new Map<string, LayoutResult>();

let worker: Worker | undefined;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("./dagre-worker.ts", import.meta.url), {
      type: "module",
    });
  }
  return worker;
}

function runWorker(
  slimNodes: Parameters<typeof computeLayout>[0],
  options: DagreLayoutOptions,
): Promise<LayoutResult> {
  return new Promise((resolve, reject) => {
    const w = getWorker();
    const handler = (e: MessageEvent) => {
      w.removeEventListener("message", handler);
      w.removeEventListener("error", errorHandler);
      resolve(e.data as LayoutResult);
    };
    const errorHandler = (e: ErrorEvent) => {
      w.removeEventListener("message", handler);
      w.removeEventListener("error", errorHandler);
      reject(e);
    };
    w.addEventListener("message", handler);
    w.addEventListener("error", errorHandler);
    w.postMessage({
      slimNodes,
      options: {
        rankdir: options.rankdir,
        align: options.align,
        ranksep: options.ranksep,
        nodesep: options.nodesep,
      },
    });
  });
}

function applyPositions(model: GraphData, positions: Record<string, LayoutPosition>) {
  model.nodes?.forEach((node) => {
    const pos = positions[node.id];
    if (!pos) return;
    node.style = {
      ...node.style,
      size: [pos.size[0], pos.size[1]],
      zIndex: pos.zIndex,
      x: pos.x,
      y: pos.y,
    };
  });
}

function applyEdgeZIndex(model: GraphData) {
  const nodeMap = new Map<string, NodeData>();
  model.nodes?.forEach((node) => {
    nodeMap.set(node.id, node);
  });
  model.edges?.forEach((edge) => {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    const zIndex = Math.max(
      source?.style?.zIndex ?? 0,
      target?.style?.zIndex ?? 0,
    );
    edge.style = {
      ...edge.style,
      zIndex,
    };
  });
}

export class DagreLayout extends BaseLayout<DagreLayoutOptions> {
  id = "custom-dagre";

  async execute(
    model: GraphData,
    options?: DagreLayoutOptions,
  ): Promise<GraphData> {
    const merged = { ...this.options, ...options };
    await measureTime(async () => {
      const slimNodes = toSlimNodes(model);
      const edges = (model.edges ?? []).map((e) => ({
        source: e.source,
        target: e.target,
      }));
      const signature = computeSignature(slimNodes, edges);

      // 命中缓存：结构未变，直接复用坐标，不重跑 dagre
      const cached = layoutCache.get(signature);
      if (cached) {
        applyPositions(model, cached.positions);
        applyEdgeZIndex(model);
        return;
      }

      // 未命中：小图同步计算，大图丢 Worker
      let result: LayoutResult;
      if (slimNodes.length > WORKER_THRESHOLD) {
        try {
          result = await runWorker(slimNodes, merged);
        } catch {
          // Worker 不可用时回退到主线程同步计算
          result = computeLayout(slimNodes, merged);
        }
      } else {
        result = computeLayout(slimNodes, merged);
      }

      if (layoutCache.size >= CACHE_MAX) {
        layoutCache.delete(layoutCache.keys().next().value as string);
      }
      layoutCache.set(signature, result);
      applyPositions(model, result.positions);
      applyEdgeZIndex(model);
    });
    return model;
  }
}
