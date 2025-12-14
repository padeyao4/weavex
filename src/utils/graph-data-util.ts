import { GraphData } from "@antv/g6";
import { PNode } from "./p-node";

export function convert2Data(nodes: PNode[]): GraphData {
  const data: GraphData = {
    nodes: nodes.map((node) => ({
      id: node.id,
      label: node.title,
      x: node.column,
      y: node.row,
      data: { ...node },
    })),
    edges: nodes.flatMap((node) => {
      return node.nexts.map((next) => ({
        id: `${node.id}-${next.id}`,
        source: node.id,
        target: next.id,
        label: next.title,
      }));
    }),
  };
  return data;
}
