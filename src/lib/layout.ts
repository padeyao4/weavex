import { PNode } from "@/types";
import { BaseLayout, BaseLayoutOptions, GraphData, NodeData } from "@antv/g6";
import { debug } from "@tauri-apps/plugin-log";
import dagre from "dagre";

export interface DagreLayoutOptions extends BaseLayoutOptions {
  rankdir?: string;
  align?: string;
  ranksep?: number;
  nodesep?: number;
}

class SubGraph {
  id: string;
  nodeMap: Map<string, NodeData> = new Map();
  size?: [number, number];
  dependencies: SubGraph[] = [];
  options = {};

  constructor(id: string, options?: DagreLayoutOptions) {
    this.id = id;
    this.options = { ...this.options, ...options };
  }

  layout() {
    const g = new dagre.graphlib.Graph();
    g.setGraph({ ...this.options });
    g.setDefaultEdgeLabel(() => ({}));
    this.dependencies?.forEach((dependency) => {
      if (!dependency.size) {
        dependency.layout();
      }
      const node = this.nodeMap.get(dependency.id)!;
      node.style = {
        ...node.style,
        size: dependency.size!,
      };
    });
    Array.from(this.nodeMap.values()).forEach((node) => {
      const size = node?.style?.size ?? [120, 80];
      const [width, height] = typeof size === "number" ? [size, size] : size;
      g.setNode(node.id, {
        width,
        height,
      });
      (node.data?.nexts as Array<string>).forEach((next) => {
        g.setEdge(node.id, next);
      });
    });
    dagre.layout(g);

    Array.from(this.nodeMap.values()).forEach((node) => {
      const data = g.node(node.id);
      node.style = {
        ...node?.style,
        x: data.x,
        y: data.y,
      };
    });
    const { width = 0, height = 0 } = g.graph();
    this.size = [width, height];
  }

  setOffset(offsetX: number, offsetY: number) {
    Array.from(this.nodeMap.values()).forEach((node) => {
      node.style = {
        ...node.style,
        x: (node.style?.x ?? 0) + offsetX,
        y: (node.style?.y ?? 0) + offsetY,
      };
    });
    this.dependencies?.forEach((dependency) => {
      const node = this.nodeMap.get(dependency.id);
      const nextOffsetX = node?.style?.x ?? 0;
      const nextOffsetY = node?.style?.y ?? 0;
      dependency.setOffset(nextOffsetX, nextOffsetY);
    });
  }
}

function executeLayout(model: GraphData, options?: DagreLayoutOptions) {
  debug("Executing DagreLayout");
  const startTime = performance.now();
  const graphMap = new Map<string, SubGraph>();
  debug("Creating SubGraphs");
  model?.nodes?.forEach((node) => {
    const data = node.data as unknown as PNode;
    if (graphMap.has(data.parent ?? "")) {
      const subGraph = graphMap.get(data.parent ?? "");
      subGraph?.nodeMap.set(node.id, node);
    } else {
      const subGraph = new SubGraph(data.parent ?? "", options);
      subGraph.nodeMap.set(node.id, node);
      graphMap.set(data.parent ?? "", subGraph);
    }
  });

  const rootGraph = graphMap.get("")!;
  debug("Layouting root graph");
  rootGraph.layout();
  debug("DagreLayout layout completed");
  rootGraph.setOffset(100, 100);
  const endTime = performance.now();
  debug(`DagreLayout execution time: ${endTime - startTime} ms`);
}

export class DagreLayout extends BaseLayout<DagreLayoutOptions> {
  id = "custom-dagre";

  async execute(
    model: GraphData,
    options?: DagreLayoutOptions,
  ): Promise<GraphData> {
    const config = {
      ...options,
      ...this.options,
    };
    executeLayout(model, config);
    return model;
  }
}
