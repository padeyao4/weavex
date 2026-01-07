import { BaseLayout, BaseLayoutOptions, GraphData } from "@antv/g6";
import dagre from "dagre";

export interface DagreLayoutOptions extends BaseLayoutOptions {
  rankdir?: string;
  align?: string;
  ranksep?: number;
  nodesep?: number;
}

export class DagreLayout extends BaseLayout<DagreLayoutOptions> {
  id = "custom-dagre";

  async execute(
    model: GraphData,
    options?: DagreLayoutOptions,
  ): Promise<GraphData> {
    const g = new dagre.graphlib.Graph();
    g.setGraph({ ...this.options, ...options });
    g.setDefaultEdgeLabel(() => ({}));

    model?.nodes?.forEach((node) => {
      const size = node?.style?.size ?? [120, 80];
      const width = typeof size === "number" ? size : size[0];
      const height = typeof size === "number" ? size : size[1];
      g.setNode(node.id, {
        width,
        height,
      });
    });

    model?.edges?.forEach((edge) => {
      g.setEdge(edge.source, edge.target);
    });
    dagre.layout(g);

    model?.nodes?.forEach((node) => {
      const nodeData = g.node(node.id);
      node.style = {
        ...node?.style,
        x: nodeData.x,
        y: nodeData.y,
      };
    });

    return {
      nodes: model.nodes,
    };
  }
}
