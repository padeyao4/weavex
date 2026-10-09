import { NodeUtil } from "@/utils";
import type { createGraphState } from "./state";
import type { createNodeActions } from "./nodes";

/**
 * 复合节点操作：在基础节点/边操作之上组合出业务动作
 * （追加/插入前置后续、删除保边、新增子节点等）。
 */
export function createCompositeActions(
  state: ReturnType<typeof createGraphState>,
  nodes: ReturnType<typeof createNodeActions>,
) {
  const { allGraph, extraProcess } = state;
  const { addNode, addEdge, removeEdge, setChild, removeNode } = nodes;

  /**
   * 删除当前节点但保留当前节点的关系，比如 a->b->c ,当删除b的时候，变成a->c
   * 如果有 a->c b->c  c->d ,当删除c的时候，变成a->d b->d
   * 如果有 a->c b->c  c->d c->e ,删除c的时候，变成 a->d b->d a->e b->e
   * @param graphId
   * @param nodeId
   * @param options
   * @returns
   */
  const deleteNodeKeepEdges = function (
    graphId: string,
    nodeId: string,
    options?: Parameters<typeof extraProcess>[1],
  ) {
    const graph = allGraph[graphId];
    if (!graph) return;

    const currentNode = graph.nodes[nodeId];
    const prevs = [...(currentNode?.prevs ?? [])];
    const nexts = [...(currentNode?.nexts ?? [])];
    // 为每一对（前驱，后继）建立新的边
    for (const prevId of prevs) {
      for (const nextId of nexts) {
        // 避免创建重复的边
        const prevNode = graph.nodes[prevId];
        const nextNode = graph.nodes[nextId];
        if (prevNode && nextNode && !prevNode.nexts.includes(nextId)) {
          addEdge(graphId, prevId, nextId);
        }
      }
    }
    // 删除当前节点
    removeNode(graphId, nodeId);
    extraProcess(graph, options);
  };

  /**
   * 在指定节点后添加新节点
   */
  const appendNewNode = function (
    graphId: string,
    nodeId: string,
    options?: Parameters<typeof extraProcess>[1],
  ) {
    const graph = allGraph[graphId];
    if (!graph) return;
    const nextNode = NodeUtil.createNode();
    const parentId = graph.nodes[nodeId].parent;

    addNode(graphId, nextNode);
    if (parentId) {
      setChild(graphId, parentId, nextNode.id);
    }
    addEdge(graphId, nodeId, nextNode.id);
    extraProcess(graph, options);
  };

  /**
   * 在节点后面插入一个节点
   * @param graphId
   * @param nodeId
   */
  const insertNewNode = function (
    graphId: string,
    nodeId: string,
    options?: Parameters<typeof extraProcess>[1],
  ) {
    const graph = allGraph[graphId];
    if (!graph) return;
    const nextNode = NodeUtil.createNode();
    const currentNode = graph.nodes[nodeId];
    if (!currentNode) return;

    addNode(graphId, nextNode);
    if (currentNode.parent) {
      setChild(graphId, currentNode.parent, nextNode.id);
    }
    currentNode.nexts.forEach((id) => {
      addEdge(graphId, nextNode.id, id);
      removeEdge(graphId, currentNode.id, id);
    });
    addEdge(graphId, currentNode.id, nextNode.id);
    extraProcess(graph, options);
  };

  /**
   * 在节点Prev中添加一个节点
   */
  const addFrontNewNode = function (
    graphId: string,
    nodeId: string,
    options?: Parameters<typeof extraProcess>[1],
  ) {
    const graph = allGraph[graphId];
    if (!graph) return;
    const currentNode = graph.nodes[nodeId];
    if (!currentNode) return;

    const prevNode = NodeUtil.createNode();
    const parentId = graph.nodes[nodeId].parent;

    addNode(graphId, prevNode);

    parentId && setChild(graphId, parentId, prevNode.id);
    addEdge(graphId, prevNode.id, nodeId);
    extraProcess(graph, options);
  };

  /**
   * 插入前置节点
   * @param graphId
   * @param nodeId
   * @param options
   * @returns
   */
  const insertFrontNewNode = function (
    graphId: string,
    nodeId: string,
    options?: Parameters<typeof extraProcess>[1],
  ) {
    const graph = allGraph[graphId];
    if (!graph) return;
    const currentNode = graph.nodes[nodeId];
    const prevNode = NodeUtil.createNode();

    addNode(graphId, prevNode);
    if (currentNode.parent) {
      setChild(graphId, currentNode.parent, prevNode.id);
    }

    // 将当前节点的所有前驱节点转移到新节点前面
    currentNode.prevs.forEach((id) => {
      addEdge(graphId, id, prevNode.id);
      removeEdge(graphId, id, currentNode.id);
    });

    addEdge(graphId, prevNode.id, currentNode.id);
    extraProcess(graph, options);
  };

  const deleteEdgeById = function (
    _graphId: string,
    _edgeId: string,
    _options?: Parameters<typeof extraProcess>[1],
  ) {
    // todo
  };

  const addNewChildNode = function (
    graphId: string,
    parentId: string,
    options?: Parameters<typeof extraProcess>[1],
  ) {
    const graph = allGraph[graphId];
    if (!graph) return;
    if (!graph.nodes[parentId]) return;
    const newNode = NodeUtil.createNode();
    graph.nodes[newNode.id] = newNode;
    setChild(graphId, parentId, newNode.id);
    extraProcess(graph, options);
  };

  const addNewNode = function (
    graphId: string,
    options?: Parameters<typeof extraProcess>[1],
  ) {
    const graph = allGraph[graphId];
    if (!graph) return;
    const newNode = NodeUtil.createNode();
    graph.nodes[newNode.id] = newNode;
    extraProcess(graph, options);
  };

  return {
    deleteNodeKeepEdges,
    appendNewNode,
    insertNewNode,
    addFrontNewNode,
    insertFrontNewNode,
    deleteEdgeById,
    addNewChildNode,
    addNewNode,
  };
}
