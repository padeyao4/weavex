import { PNode } from "@/types";
import { pull } from "lodash-es";
import type { createGraphState } from "./state";

/**
 * 节点/边基础操作：直接修改 allGraph 中单个节点/边的字段与关系。
 * 复合操作（插入前置/后续、删除保边等）见 composite.ts。
 */
export function createNodeActions(state: ReturnType<typeof createGraphState>) {
  const { allGraph, extraProcess } = state;

  const updateNode = function (
    graphId: string,
    node: Partial<PNode> & Pick<PNode, "id">,
    options?: Parameters<typeof extraProcess>[1],
  ) {
    const graph = allGraph[graphId];
    if (graph) {
      const oldNode = graph.nodes[node.id];
      if (oldNode) {
        graph.nodes[node.id] = {
          ...oldNode,
          ...node,
        };
        extraProcess(graph, options);
      }
    }
  };

  /**
   * 设置节点是展开还是折叠
   * @param graphId
   * @param nodeId
   * @param expanded
   * @param options
   * @returns
   */
  const setNodeExpanded = function (
    graphId: string,
    nodeId: string,
    expanded: boolean,
    options?: Parameters<typeof extraProcess>[1],
  ) {
    if (graphId && nodeId && allGraph[graphId]) {
      const graph = allGraph[graphId];
      if (graph.nodes[nodeId]) {
        graph.nodes[nodeId].expanded = expanded;
        extraProcess(graph, options);
      }
    }
  };

  const toggleNodeExpanded = function (
    graphId: string,
    nodeId: string,
    options?: Parameters<typeof extraProcess>[1],
  ) {
    setNodeExpanded(
      graphId,
      nodeId,
      !allGraph[graphId].nodes[nodeId].expanded,
      options,
    );
  };

  /**
   * 关联父子关系,子节点不能有prevs和nexts. 否则关系错误
   * @param graphId
   * @param parentId
   * @param childId
   * @param options
   * @returns
   */
  const setChild = function (
    graphId: string,
    parentId: string,
    childId: string,
    options?: Parameters<typeof extraProcess>[1],
  ) {
    if (allGraph[graphId]) {
      const graph = allGraph[graphId];
      const parentNode = graph.nodes[parentId];
      const childNode = graph.nodes[childId];
      if (
        parentNode &&
        childNode &&
        childNode.prevs.length === 0 &&
        childNode.nexts.length === 0 &&
        !childNode.parent
      ) {
        parentNode.children = [
          ...new Set([...parentNode.children, childNode.id]),
        ];
        childNode.parent = parentNode.id;
        extraProcess(graph, options);
      }
    }
  };

  const addNode = function (
    graphId: string,
    node: PNode,
    options?: Parameters<typeof extraProcess>[1],
  ) {
    if (allGraph[graphId]) {
      const graph = allGraph[graphId];
      graph.nodes[node.id] = node;
      extraProcess(graph, options);
    }
  };

  /**
   * 将一个节点从父子关系中脱离.
   * 要求这个节点不能有prevs和nexts关系.
   */
  const detachNode = function (
    graph: (typeof allGraph)[string],
    parentNode: PNode,
    childNode: PNode,
    options?: Parameters<typeof extraProcess>[1],
  ) {
    pull(parentNode.children, childNode.id);
    childNode.parent = undefined;
    extraProcess(graph, options);
  };

  const removeEdge = function (
    graphId: string,
    from: string,
    to: string,
    options?: Parameters<typeof extraProcess>[1],
  ) {
    const graph = allGraph[graphId];
    if (graph) {
      const fromNode = graph.nodes[from];
      const toNode = graph.nodes[to];
      if (fromNode && toNode) {
        fromNode.nexts = fromNode.nexts.filter((nextId) => nextId !== to);
        toNode.prevs = toNode.prevs.filter((prevId) => prevId !== from);
        extraProcess(graph, options);
      }
    }
  };

  /**
   * 删除当前节点的前置边
   * @param graphId
   * @param nodeId
   * @param options
   * @returns
   */
  const deletePrevsNodeEdge = function (
    graphId: string,
    nodeId: string,
    options?: Parameters<typeof extraProcess>[1],
  ) {
    const graph = allGraph[graphId];
    if (!graph) return;
    const currentNode = graph.nodes[nodeId];
    if (!currentNode) return;

    currentNode.prevs.forEach((id) => {
      removeEdge(graphId, id, currentNode.id);
    });
    extraProcess(graph, options);
  };

  /**
   * 删除当前节点的后置边
   * @param graphId
   * @param nodeId
   * @param options
   * @returns
   */
  const deleteNextsNodeEdge = function (
    graphId: string,
    nodeId: string,
    options?: Parameters<typeof extraProcess>[1],
  ) {
    const graph = allGraph[graphId];
    if (!graph) return;
    const currentNode = graph.nodes[nodeId];
    if (!currentNode) return;

    currentNode.nexts.forEach((id) => {
      removeEdge(graphId, currentNode.id, id);
    });
    extraProcess(graph, options);
  };

  /**
   * 递归删除一个节点
   * @param graphId
   * @param nodeId
   * @returns
   */
  const removeNode = function (graphId: string, nodeId: string) {
    const graph = allGraph[graphId];
    if (graph) {
      const node = graph.nodes[nodeId];
      if (node) {
        deletePrevsNodeEdge(graphId, nodeId);
        deleteNextsNodeEdge(graphId, nodeId);
        const parentNode = graph.nodes[node.parent ?? ""];
        if (parentNode) {
          detachNode(graph, parentNode, node);
        }
        // 递归删除节点children关系
        node.children.forEach((childId) => {
          removeNode(graphId, childId);
        });
        // 从graph中删除
        delete graph.nodes[nodeId];
      }
    }
  };

  const addEdge = function (
    graphId: string,
    from: string,
    to: string,
    options?: Parameters<typeof extraProcess>[1],
  ) {
    const graph = allGraph[graphId];
    if (graph) {
      const fromNode = graph.nodes[from];
      const toNode = graph.nodes[to];
      if (fromNode && toNode) {
        fromNode.nexts.push(to);
        toNode.prevs.push(from);
        extraProcess(graph, options);
      }
    }
  };

  return {
    updateNode,
    setNodeExpanded,
    toggleNodeExpanded,
    setChild,
    addNode,
    detachNode,
    removeNode,
    addEdge,
    removeEdge,
    deletePrevsNodeEdge,
    deleteNextsNodeEdge,
  };
}
