import { PGraph, PNode } from "@/types";
import { v4 } from "uuid";

export class GraphUtils {
  static createGraph(graph?: Partial<PGraph>): PGraph {
    const {
      id = v4(),
      name = "",
      createdAt = Date.now(),
      updatedAt = Date.now(),
      rootNodeIds = [],
      nodes = {},
    } = graph || {};
    return { id, name, createdAt, updatedAt, rootNodeIds, nodes };
  }

  /**
   * Traverse the graph using depth-first search.
   * @param graph
   * @param func
   * @returns
   */
  static traverseGraph(
    graph: PGraph,
    func: (node: PNode, graph: PGraph) => boolean,
  ): PNode[] {
    const visited = new Set<string>();
    const result: PNode[] = [];

    function dfs(node: PNode) {
      if (!node || visited.has(node.id)) return;
      visited.add(node.id);
      if (func(node, graph)) {
        result.push(node);
      }

      const nodeIds = [...node.children, ...node.prevs, ...node.nexts];

      for (const childId of nodeIds) {
        const childNode = graph.nodes[childId];
        dfs(childNode);
      }
    }

    for (const rootId of graph.rootNodeIds) {
      const root = graph.nodes[rootId];
      dfs(root);
    }

    return result;
  }
}
