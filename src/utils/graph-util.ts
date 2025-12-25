import { PGraph, PNode } from "@/types";
import { v4 } from "uuid";
import { ComboData, EdgeData, GraphData, NodeData } from "@antv/g6";
import { NodeUtil } from "./node-util";
import { faker } from "@faker-js/faker";

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

  static fakerGraph() {
    return this.createGraph({
      name: faker.book.title(),
    });
  }

  static updateGraph(
    graph: PGraph,
    name: string,
    rootNodeIds: string[],
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
  static toGraphData(graph?: Partial<PGraph>): GraphData {
    const mapper = graph?.nodes ?? {};
    const rootNodeIds = graph?.rootNodeIds ?? [];

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
          data: { ...node },
          combo: node.parent,
        });

        nodes.push({
          id: `${node.id}-head`,
          data: { ...node },
          type: "circle",
          combo: node.id,
        });

        nodes.push({
          id: `${node.id}-tail`,
          data: { ...node },
          type: "triangle",
          combo: node.id,
        });
      } else {
        nodes.push({
          id: node.id,
          data: { ...node },
          combo: node.parent,
        });
      }

      if (NodeUtil.isChild(node)) {
        // 如果是子节点，并且没有前驱节点
        if (NodeUtil.noPrev(node)) {
          edges.push({
            id: `${node.parent}-head_${node.id}`,
            source: `${node.parent}-head`,
            target: node.id,
          });
        }
        // 如果是子节点，并且没有后继节点
        if (NodeUtil.noNext(node)) {
          edges.push({
            id: `${node.id}_${node.parent}-tail`,
            source: node.id,
            target: `${node.parent}-tail`,
          });
        }
      }

      for (const next of node.nexts) {
        const sourceId = NodeUtil.isCombo(node) ? `${node.id}-tail` : node.id;
        const targetId = NodeUtil.isCombo(mapper[next]) ? `${next}-head` : next;
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

    for (const rootId of rootNodeIds) {
      const root = mapper[rootId];
      travel(root);
    }

    return {
      nodes,
      edges,
      combos,
    };
  }

  static generateMackGraph(): PGraph {
    const graph = this.fakerGraph();
    const nodeA = NodeUtil.createNode({ title: "a" });
    const nodeB = NodeUtil.createNode({ title: "b" });
    const nodeC = NodeUtil.createNode({ title: "c" });
    const nodeD = NodeUtil.createNode({ title: "d" });
    const node1 = NodeUtil.createNode({ title: "1" });
    const node2 = NodeUtil.createNode({ title: "2" });
    const node3 = NodeUtil.createNode({ title: "3" });
    graph.nodes[nodeA.id] = nodeA;
    graph.nodes[nodeB.id] = nodeB;
    graph.nodes[nodeC.id] = nodeC;
    graph.nodes[nodeD.id] = nodeD;
    graph.nodes[node1.id] = node1;
    graph.nodes[node2.id] = node2;
    graph.nodes[node3.id] = node3;
    NodeUtil.addNext(nodeA, nodeB);
    NodeUtil.addNext(nodeB, nodeC);
    NodeUtil.addNext(nodeC, nodeD);
    NodeUtil.addNext(node1, node2);
    NodeUtil.addNext(node1, node3);
    NodeUtil.traverseAndAddChildren(nodeB, node1, graph.nodes);
    graph.rootNodeIds.push(nodeA.id);
    return graph;
  }

  static generateMackGraph2(): PGraph {
    const graph = this.fakerGraph();
    const nodeA = NodeUtil.createNode({ title: "a" });
    const nodeB = NodeUtil.createNode({ title: "b" });
    graph.nodes[nodeA.id] = nodeA;
    graph.nodes[nodeB.id] = nodeB;
    NodeUtil.addChild(nodeA, nodeB);
    // NodeUtil.traverseAndAddChildren(nodeA, nodeB, graph.nodes);
    graph.rootNodeIds.push(nodeA.id);
    return graph;
  }

  static generateMackGraph3(): PGraph {
    const graph = this.fakerGraph();
    const nodeA = NodeUtil.createNode({ title: "a" });
    const nodeB = NodeUtil.createNode({ title: "b" });
    const nodeC = NodeUtil.createNode({ title: "c" });
    graph.nodes[nodeA.id] = nodeA;
    graph.nodes[nodeB.id] = nodeB;
    graph.nodes[nodeC.id] = nodeC;
    NodeUtil.addNext(nodeA, nodeC);
    NodeUtil.addChild(nodeA, nodeB);
    // NodeUtil.traverseAndAddChildren(nodeA, nodeB, graph.nodes);
    graph.rootNodeIds.push(nodeA.id);
    return graph;
  }

  /**
   * 随机生成一个简单的一层DAG图
   * @param size 节点数量（默认 10）
   * @param maxEdge 每个源节点最大出边数（默认 3）
   * @returns 生成的 PGraph
   */
  static randomSampleGraph(size: number = 10, maxEdge: number = 3): PGraph {
    const graph = this.fakerGraph(); // 假设 createGraph() 返回 { id, name, createdAt 等基础字段 }

    const nodes: PNode[] = [];

    // 1. 创建所有节点（使用 createNode 或 fakerNode）
    for (let i = 0; i < size; i++) {
      // 你可以根据需要切换为 NodeUtil.fakerNode()
      const node = NodeUtil.createNode();
      graph.nodes[node.id] = node;
      nodes.push(node);
    }

    if (size <= 1) {
      // 单个节点或空图：它自己就是根
      if (size === 1) {
        graph.rootNodeIds = [nodes[0].id];
      }
      return graph;
    }

    // 2. 划分 source（前半）和 sink（后半）
    const mid = Math.max(1, Math.floor(size / 2));
    const sources = nodes.slice(0, mid);
    const sinks = nodes.slice(mid);

    // 3. 从 sources 向 sinks 随机连边（保证无环、单层）
    for (const source of sources) {
      const maxPossible = Math.min(maxEdge, sinks.length);
      const edgeCount =
        maxPossible > 0 ? Math.floor(Math.random() * (maxPossible + 1)) : 0;

      const shuffled = [...sinks].sort(() => 0.5 - Math.random());
      const targets = shuffled.slice(0, edgeCount);

      for (const sink of targets) {
        source.nexts.push(sink.id);
        sink.prevs.push(source.id);
        // 注意：不设置 parent/children，保持扁平 DAG
      }
    }

    // 4. 收集所有 rootNodeIds（即 prevs 为空的节点）
    graph.rootNodeIds = nodes
      .filter((node) => node.prevs.length === 0)
      .map((node) => node.id);

    return graph;
  }
}
