import { PGraph, PNode } from "@/types";
import { v4 } from "uuid";
import { EdgeData, GraphData, NodeData } from "@antv/g6";
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
    graph.rootNodeIds = GraphUtils.buildRootIds(graph.nodes);
  }

  static addChild(
    graph: PGraph,
    parent: PNode | string,
    child: PNode | string,
  ) {
    const parentNode =
      typeof parent === "string" ? graph.nodes[parent] : parent;
    const childNode = typeof child === "string" ? graph.nodes[child] : child;
    if (!parentNode || !childNode) return;
    parentNode.children = [...new Set([...parentNode.children, childNode.id])];
    childNode.parent = parentNode.id;
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

  /**
   * 处理删除节点的逻辑,
   * 删除节点的前置关系,后续关系,子孙节点,父节点关系,并且更新时间
   * @param graph
   * @param id
   */
  static removeNode(graph: PGraph, id: string) {
    graph.updatedAt = Date.now();
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
    // 重建root ids
    graph.rootNodeIds = GraphUtils.buildRootIds(graph.nodes);
  }

  static addEdge(graph: PGraph, from: PNode | string, to: PNode | string) {
    const source: PNode = typeof from === "string" ? graph.nodes[from] : from;
    const target: PNode = typeof to === "string" ? graph.nodes[to] : to;
    source.nexts.push(target.id);
    target.prevs.push(source.id);
    graph.rootNodeIds = GraphUtils.buildRootIds(graph.nodes);
  }

  static removeEdge(graph: PGraph, from: PNode | string, to: PNode | string) {
    graph.updatedAt = Date.now();
    const source: PNode = typeof from === "string" ? graph.nodes[from] : from;
    const target: PNode = typeof to === "string" ? graph.nodes[to] : to;
    source.nexts = source.nexts.filter((id) => id !== target.id);
    target.prevs = target.prevs.filter((id) => id !== source.id);
    graph.rootNodeIds = GraphUtils.buildRootIds(graph.nodes);
  }

  static buildRootIds(nodes?: PNode[] | Record<string, PNode>): string[] {
    if (!nodes) return [];
    const nodeMap = new Map<string | undefined, PNode>();
    const rootIds = new Set<string>();
    nodes = Array.isArray(nodes) ? nodes : Object.values(nodes);
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
      clone.nodes = nodeArray.reduce(
        (acc, node) => {
          acc[node.id] = node;
          return acc;
        },
        {} as Record<string, PNode>,
      );
      clone.rootNodeIds = this.buildRootIds(clone.nodes);
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
   * 将pgraph转为graphData
   * @param graph
   * @returns
   */
  static toGraphData(graph?: Partial<PGraph>): GraphData {
    const nodeMap = graph?.nodes ?? {};

    const nodes: NodeData[] = [];
    const edges: EdgeData[] = [];
    const visited = new Set<string>();
    const collapsed = new Set<string>();

    function travel(node: PNode) {
      if (!node || visited.has(node.id) || collapsed.has(node.parent ?? "")) {
        return;
      }
      if (!node.expanded) {
        collapsed.add(node.id);
      }
      visited.add(node.id);
      nodes.push({
        id: node.id,
        data: { ...node },
        combo: undefined,
      });
      node.nexts?.forEach((next) => {
        edges.push({
          id: `${node.id}_${next}`,
          source: node.id,
          target: next,
        });
      });
      for (const nodeId of [...node.nexts, ...node.children]) {
        travel(nodeMap[nodeId]);
      }
    }

    for (const rootId of graph?.rootNodeIds ?? []) {
      travel(nodeMap[rootId]);
    }

    return {
      nodes,
      edges,
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
