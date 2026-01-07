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
  id?: string;
  nodeMap: Map<string | undefined, NodeData> = new Map();
  size?: [number, number];
  dependencies: SubGraph[] = [];
  g: dagre.graphlib.Graph = new dagre.graphlib.Graph();

  constructor(id?: string, options?: DagreLayoutOptions) {
    this.id = id;
    this.g.setGraph({ ...options });
    this.g.setDefaultEdgeLabel(() => ({}));
  }

  layout() {
    this.dependencies?.forEach((dependency) => {
      if (!dependency.size) {
        dependency.layout();
      }
      const node = this.nodeMap.get(dependency.id);
      if (node) {
        node.style = {
          ...node.style,
          width: dependency.size![0],
          height: dependency.size![1],
        };
      }
    });
    Array.from(this.nodeMap.values()).forEach((node) => {
      this.g.setNode(node.id, {
        width: node.style!.width,
        height: node.style!.height,
      });
      (node.data?.nexts as Array<string>).forEach((next) => {
        this.g.setEdge(node.id, next);
      });
    });
    dagre.layout(this.g);
    Array.from(this.nodeMap.values()).forEach((node) => {
      const data = this.g.node(node.id);
      node.style = {
        ...node?.style,
        x: data.x,
        y: data.y,
      };
    });
    const { width = 0, height = 0 } = this.g.graph();
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

export class DagreLayout extends BaseLayout<DagreLayoutOptions> {
  id = "custom-dagre";

  async execute(
    model: GraphData,
    options?: DagreLayoutOptions,
  ): Promise<GraphData> {
    debug("Executing DagreLayout");
    const startTime = performance.now();
    const config = {
      ...this.options,
      ...options,
    };
    const graphMap = new Map<string | undefined, SubGraph>();
    debug("Creating SubGraphs");
    model?.nodes?.forEach((node) => {
      const data = node.data as unknown as PNode;
      if (graphMap.has(data.parent)) {
        const subGraph = graphMap.get(data.parent);
        subGraph?.nodeMap.set(node.id, node);
      } else {
        const subGraph = new SubGraph(data.parent, config);
        subGraph.nodeMap.set(node.id, node);
        graphMap.set(data.parent, subGraph);
      }
    });

    const rootGraph = graphMap.get(undefined);

    if (!rootGraph) {
      debug("No root graph found");
      return model;
    }
    debug("Layouting root graph");
    rootGraph.layout();
    debug("DagreLayout layout completed");
    rootGraph.setOffset(0, 0);
    const endTime = performance.now();
    debug(`DagreLayout execution time: ${endTime - startTime} ms`);
    return model;
  }
}
