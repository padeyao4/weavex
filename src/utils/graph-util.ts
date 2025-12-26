import { PGraph, PNode } from "@/types";
import { v4 } from "uuid";
import { ComboData, EdgeData, GraphData, NodeData } from "@antv/g6";
import { NodeUtil } from "./node-util";
import { faker } from "@faker-js/faker";

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

  static addNode(graph: PGraph, node: PNode) {
    graph.updatedAt = Date.now();
    graph.nodes[node.id] = node;
    if (!graph.rootNodeIds.includes(node.id)) {
      graph.rootNodeIds.push(node.id);
    }
  }

  static removeNode(graph: PGraph, id: string) {
    graph.updatedAt = Date.now();
    graph.rootNodeIds = graph.rootNodeIds.filter((nodeId) => nodeId !== id);
    // 查找当前节点，
    const node: PNode | undefined = graph.nodes[id];
    // 删除节点prevs关系
    node?.prevs.forEach((prevId) => {
      const prevNode = graph.nodes[prevId];
      prevNode.nexts = prevNode.nexts.filter((nextId) => nextId !== id);
    });
    // 删除节点nexts关系
    node?.nexts.forEach((nextId) => {
      const nextNode = graph.nodes[nextId];
      nextNode.prevs = nextNode.prevs.filter((prevId) => prevId !== id);
    });
    // 删除节点parent关系
    if (node?.parent) {
      const parentNode = graph.nodes[node.parent];
      parentNode.children = parentNode.children.filter(
        (childId) => childId !== id,
      );
    }
    // 递归删除节点children关系
    node?.children.forEach((childId) => {
      this.removeNode(graph, childId);
    });
    // 从graph中删除
    delete graph.nodes[id];
  }

  static addEdge(graph: PGraph, from: PNode | string, to: PNode | string) {
    const source: PNode = typeof from === "string" ? graph.nodes[from] : from;
    const target: PNode = typeof to === "string" ? graph.nodes[to] : to;
    source.nexts.push(target.id);
    target.prevs.push(source.id);
  }

  static removeEdge(graph: PGraph, from: PNode | string, to: PNode | string) {
    graph.updatedAt = Date.now();
    const source: PNode = typeof from === "string" ? graph.nodes[from] : from;
    const target: PNode = typeof to === "string" ? graph.nodes[to] : to;
    source.nexts = source.nexts.filter((id) => id !== target.id);
    target.prevs = target.prevs.filter((id) => id !== source.id);
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

  // static generateMackGraph(): PGraph {
  //   const graph = this.fakerGraph();
  //   const nodeA = NodeUtil.createNode({ title: "a" });
  //   const nodeB = NodeUtil.createNode({ title: "b" });
  //   const nodeC = NodeUtil.createNode({ title: "c" });
  //   const nodeD = NodeUtil.createNode({ title: "d" });
  //   const node1 = NodeUtil.createNode({ title: "1" });
  //   const node2 = NodeUtil.createNode({ title: "2" });
  //   const node3 = NodeUtil.createNode({ title: "3" });
  //   graph.nodes[nodeA.id] = nodeA;
  //   graph.nodes[nodeB.id] = nodeB;
  //   graph.nodes[nodeC.id] = nodeC;
  //   graph.nodes[nodeD.id] = nodeD;
  //   graph.nodes[node1.id] = node1;
  //   graph.nodes[node2.id] = node2;
  //   graph.nodes[node3.id] = node3;
  //   NodeUtil.addNext(nodeA, nodeB);
  //   NodeUtil.addNext(nodeB, nodeC);
  //   NodeUtil.addNext(nodeC, nodeD);
  //   NodeUtil.addNext(node1, node2);
  //   NodeUtil.addNext(node1, node3);
  //   NodeUtil.traverseAndAddChildren(nodeB, node1, graph.nodes);
  //   graph.rootNodeIds.push(nodeA.id);
  //   return graph;
  // }

  // static generateMackGraph2(): PGraph {
  //   const graph = this.fakerGraph();
  //   const nodeA = NodeUtil.createNode({ title: "a" });
  //   const nodeB = NodeUtil.createNode({ title: "b" });
  //   graph.nodes[nodeA.id] = nodeA;
  //   graph.nodes[nodeB.id] = nodeB;
  //   NodeUtil.addChild(nodeA, nodeB);
  //   // NodeUtil.traverseAndAddChildren(nodeA, nodeB, graph.nodes);
  //   graph.rootNodeIds.push(nodeA.id);
  //   return graph;
  // }

  // static generateMackGraph3(): PGraph {
  //   const graph = this.fakerGraph();
  //   const nodeA = NodeUtil.createNode({ title: "a" });
  //   const nodeB = NodeUtil.createNode({ title: "b" });
  //   const nodeC = NodeUtil.createNode({ title: "c" });
  //   graph.nodes[nodeA.id] = nodeA;
  //   graph.nodes[nodeB.id] = nodeB;
  //   graph.nodes[nodeC.id] = nodeC;
  //   NodeUtil.addNext(nodeA, nodeC);
  //   NodeUtil.addChild(nodeA, nodeB);
  //   // NodeUtil.traverseAndAddChildren(nodeA, nodeB, graph.nodes);
  //   graph.rootNodeIds.push(nodeA.id);
  //   return graph;
  // }

  // static generateMackGraph4(): PGraph {
  //   const graph = this.fakerGraph();
  //   const nodeA = NodeUtil.createNode({ title: "a" });
  //   graph.nodes[nodeA.id] = nodeA;
  //   graph.rootNodeIds.push(nodeA.id);
  //   return graph;
  // }
}
