import { PNode } from "@/types";
import { measureTime } from "@/utils";
import {
  BaseLayout,
  BaseLayoutOptions,
  GraphData,
  NodeData,
  Size,
} from "@antv/g6";
import dagre from "dagre";

export interface DagreLayoutOptions extends BaseLayoutOptions {
  rankdir?: string;
  align?: string;
  ranksep?: number;
  nodesep?: number;
}

const defaultSize: Size = [120, 60];
const margin = 20;

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

  layout(layer: number = 1) {
    this.dependencies?.forEach((dependency) => {
      if (!dependency.size) {
        dependency.layout(layer + 1);
      }
      const node = this.nodeMap.get(dependency.id)!;
      node.style = {
        ...node.style,
        zIndex: layer + 1,
        size: dependency.size!,
      };
    });

    const g = new dagre.graphlib.Graph();
    g.setGraph({ ...this.options });
    g.setDefaultEdgeLabel(() => ({}));
    this.nodeMap.forEach((node) => {
      const size = node.data?.expanded
        ? (node?.style?.size ?? defaultSize)
        : defaultSize;
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

    this.nodeMap.forEach((node) => {
      const data = g.node(node.id);
      const size = node.data?.expanded
        ? (node?.style?.size ?? defaultSize)
        : defaultSize;
      node.style = {
        ...node?.style,
        size,
        zIndex: layer,
        x: data.x,
        y: data.y,
      };
    });
    const { width = 0, height = 0 } = g.graph();
    this.size = [width + margin * 2, height + margin * 2];
  }

  setOffset(offsetX: number, offsetY: number) {
    this.nodeMap.forEach((node) => {
      node.style = {
        ...node.style,
        x: (node.style?.x ?? 0) + offsetX,
        y: (node.style?.y ?? 0) + offsetY,
      };
    });
    this.dependencies?.forEach((dependency) => {
      const node = this.nodeMap.get(dependency.id);
      const size = node?.style?.size ?? 0;
      const [width, height] = typeof size === "number" ? [size, size] : size;
      const nextOffsetX = node?.style?.x ?? 0;
      const nextOffsetY = node?.style?.y ?? 0;
      dependency.setOffset(
        nextOffsetX - width / 2 + margin,
        nextOffsetY - height / 2 + margin,
      );
    });
  }
}

function executeLayout(model: GraphData, options?: DagreLayoutOptions) {
  const graphMap = new Map<string, SubGraph>();
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

  for (const key of graphMap.keys()) {
    if (key === "") continue;
    Array.from(graphMap.values())
      .find((value) => value.id !== key && value.nodeMap.has(key))
      ?.dependencies.push(graphMap.get(key)!);
  }

  const rootGraph = graphMap.get("");
  rootGraph?.layout();
  rootGraph?.setOffset(0, 0);

  const nodeMap = new Map<string, NodeData>();
  model.nodes?.forEach((node) => {
    nodeMap.set(node.id, node);
  });

  model.edges?.forEach((edge) => {
    const source = nodeMap.get(edge.source)!;
    const target = nodeMap.get(edge.target)!;
    const zIndex = Math.max(
      source.style?.zIndex ?? 0,
      target.style?.zIndex ?? 0,
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
    await measureTime(() => {
      executeLayout(model, {
        ...options,
        ...this.options,
      });
    });
    return model;
  }
}
