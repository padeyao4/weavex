import { PGraph, PNode } from "@/types";
import { v4 } from "uuid";
import { ComboData, EdgeData, GraphData, NodeData } from "@antv/g6";
import { NodeUtil } from "./node-util";
import { faker } from "@faker-js/faker";
import cloneDeep from "lodash-es/cloneDeep";

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

  /**
   * 将子节点添加到父节点中，并更新子节点的父节点信息。
   * 会递归处理子节点的前置节点和后置节点
   * @param graph
   * @param parent
   * @param child
   * @returns
   */
  static addChildWidthTravel(
    graph: PGraph,
    parent: PNode | string,
    child: PNode | string,
  ) {
    const parentNode =
      typeof parent === "string" ? graph.nodes[parent] : parent;
    const childNode = typeof child === "string" ? graph.nodes[child] : child;
    if (!parentNode || !childNode) return;
    const set = new Set<string>();
    function travel(id: string) {
      if (set.has(id)) return;
      set.add(id);
      const node = graph.nodes[id];
      const nodeIds = [...node.nexts, ...node.prevs];
      nodeIds.forEach(travel);
    }
    travel(childNode.id);
    set.forEach((id) => {
      const node = graph.nodes[id];
      node.parent = parentNode.id;
      parentNode.children = [...new Set([...parentNode.children, node.id])];
    });
  }

  static removeNode(graph: PGraph, id: string) {
    graph.updatedAt = Date.now();
    // 查找当前节点，
    const node: PNode | undefined = graph.nodes[id];
    // 重建rootIds
    graph.rootNodeIds = [
      ...new Set([...graph.rootNodeIds, ...node.nexts]),
    ].filter((nodeId) => nodeId !== id);
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
    graph.rootNodeIds = graph.rootNodeIds.filter(
      (nodeId) => nodeId !== target.id,
    );
  }

  static removeEdge(graph: PGraph, from: PNode | string, to: PNode | string) {
    graph.updatedAt = Date.now();
    const source: PNode = typeof from === "string" ? graph.nodes[from] : from;
    const target: PNode = typeof to === "string" ? graph.nodes[to] : to;
    source.nexts = source.nexts.filter((id) => id !== target.id);
    target.prevs = target.prevs.filter((id) => id !== source.id);
    graph.rootNodeIds = [...new Set([...graph.rootNodeIds, target.id])];
  }

  private static buildRootIds(nodes?: PNode[]): string[] {
    if (!nodes) return [];
    const nodeMap = new Map<string | undefined, PNode>();
    const rootIds = new Set<string>();
    nodes.forEach((node) => {
      nodeMap.set(node.id, node);
      rootIds.add(node.id);
    });

    nodes.forEach((node) => {
      if (node.parent && nodeMap.has(node.parent)) {
        rootIds.delete(node.id);
        return;
      }
      if (node.prevs.find((prevId) => nodeMap.has(prevId))) {
        rootIds.delete(node.id);
      }
    });

    return Array.from(rootIds);
  }

  static transform(graph?: PGraph): GraphData {
    if (!graph) return {};
    if (graph.hideCompleted) {
      const clone = cloneDeep(graph);
      const nodeArray = this.traverseGraph(clone, (n, g) =>
        GraphUtils.fillerNode(n, g),
      );
      clone.rootNodeIds = this.buildRootIds(nodeArray);
      clone.nodes = nodeArray.reduce(
        (acc, node) => {
          acc[node.id] = node;
          return acc;
        },
        {} as Record<string, PNode>,
      );
      return this.toGraphData(clone);
    } else {
      return this.toGraphData(graph);
    }
  }

  private static fillerNode(node: PNode, graph: PGraph): boolean {
    if (node.completed && node.children.length === 0 && !node.parent) {
      const prevsComplated = node.prevs
        .map((id) => graph.nodes[id])
        .every((prev) => prev.completed);
      if (prevsComplated) {
        return false;
      }
    }
    return true;
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
      if (!node || visited.has(node.id)) return;
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
          type: "circle",
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
      if (visited.has(node.id)) return;
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
