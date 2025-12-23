import { PGraph, PNode } from "@/types";
import { v4 } from "uuid";
import { ComboData, EdgeData, GraphData, NodeData } from "@antv/g6";
import { NodeUtil } from "./node-util";

export class GraphUtils {
  static createGraph(graph: Partial<PGraph> = {}): PGraph {
    const {
      id = v4(),
      name = "",
      createdAt = Date.now(),
      updatedAt = Date.now(),
      rootNodeIds = [],
      nodes = {},
    } = graph;
    return { id, name, createdAt, updatedAt, rootNodeIds, nodes };
  }

  static updateGraph(
    graph: PGraph,
    name: string,
    rootNodeIds: string[]
  ): PGraph {
    return {
      ...graph,
      name,
      rootNodeIds,
      updatedAt: Date.now(),
    };
  }

  static createNodeData(node: PNode): NodeData {
    return {
      id: node.id,
      label: node.title,
      data: { ...node },
      combo: node.parent,
    };
  }

  /**
   * 将graph中的nodes数据转为GraphData数据
   * @returns
   */
  static toGraphData(graph: PGraph): GraphData {
    const mapper = graph.nodes;
    const nodes: NodeData[] = [];
    const edges: EdgeData[] = [];
    const combos: ComboData[] = [];
    const visited = new Set<string>();

    function travel(node: PNode) {
      if (visited.has(node.id)) return;
      visited.add(node.id);

      if (NodeUtil.isCombo(node)) {
        combos.push({
          id: node.id,
          combo: node.parent,
        });

        nodes.push({
          id: `${node.id}_head`,
          combo: node.id,
        });

        nodes.push({
          id: `${node.id}_tail`,
          combo: node.id,
        });
      }

      if (NodeUtil.isChild(node)) {
        nodes.push({
          id: node.id,
          combo: node.parent,
        });
        // 如果是子节点，并且没有前驱节点
        if (NodeUtil.noPrev(node)) {
          edges.push({
            id: `${node.id}_head_${node.id}`,
            source: `${node.id}_head`,
            target: node.id,
          });
        }
        // 如果是子节点，并且没有后继节点
        if (NodeUtil.noNext(node)) {
          edges.push({
            id: `${node.id}_${node.id}_tail`,
            source: node.id,
            target: `${node.id}_tail`,
          });
        }
      }

      for (const next of node.nexts) {
        const sourceId = NodeUtil.isCombo(node) ? `${node.id}_tail` : node.id;
        const targetId = NodeUtil.isCombo(mapper[next]) ? `${next}_head` : next;
        edges.push({
          id: `${sourceId}_${targetId}`,
          source: sourceId,
          target: targetId,
        });
      }

      const nodeIds = [...node.children, ...node.prevs, ...node.nexts];
      for (const nodeId of nodeIds) {
        travel(mapper[nodeId]);
      }
    }

    for (const rootId of graph.rootNodeIds) {
      const root = mapper[rootId];
      travel(root);
    }

    return {
      nodes,
      edges,
      combos,
    };
  }
}
