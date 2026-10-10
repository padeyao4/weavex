import { PNode } from "@/types";
import { pull } from "lodash-es";
import type { createGraphState } from "./state";
import {
  addEdgeToDb,
  createNodeToDb,
  deleteNodeFromDb,
  removeEdgeFromDb,
  toNodePatch,
  updateNodeToDb,
} from "@/lib/db";
import { error } from "@tauri-apps/plugin-log";

/** 异步写失败只记日志，不打断 UI 操作（存储是真相源，下次广播/操作会纠正）。 */
function quiet(p: Promise<unknown>, what: string) {
  p.catch((e) => error(`${what}: ${JSON.stringify(e)}`));
}

/**
 * 节点/边基础操作：直接修改 allGraph 中单个节点/边的字段与关系。
 * filesystem-first：options.persist 时按操作粒度立即写库（不再全量写回）。
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
        if (options?.persist) {
          quiet(
            updateNodeToDb(toNodePatch(graphId, node)),
            `Failed to update node ${node.id}`,
          );
        }
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
        if (options?.persist) {
          quiet(
            updateNodeToDb(toNodePatch(graphId, { id: nodeId, expanded })),
            `Failed to save expanded ${nodeId}`,
          );
        }
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
        if (options?.persist) {
          // 子节点挂到父级：写 parent 字段（Rust 侧联动 root_node_ids 移出根列表）
          quiet(
            updateNodeToDb(
              toNodePatch(graphId, { id: childId, parent: parentNode.id }),
            ),
            `Failed to set child ${childId}`,
          );
        }
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
      if (options?.persist) {
        // 新节点落库（Rust 侧：parent 为空时自动进 root_node_ids）
        quiet(createNodeToDb(graphId, node), `Failed to create node ${node.id}`);
      }
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
    if (options?.persist) {
      // 脱离父级变根：parent 置空（Rust 侧联动 root_node_ids 加回根列表）
      quiet(
        updateNodeToDb(
          toNodePatch(graph.id, { id: childNode.id, parent: null }),
        ),
        `Failed to detach node ${childNode.id}`,
      );
    }
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
        if (options?.persist) {
          quiet(
            removeEdgeFromDb(graphId, from, to),
            `Failed to remove edge ${from}-${to}`,
          );
        }
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

    const persistOpts = options?.persist ? { persist: true } : undefined;
    currentNode.prevs.forEach((id) => {
      removeEdge(graphId, id, currentNode.id, persistOpts);
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

    const persistOpts = options?.persist ? { persist: true } : undefined;
    currentNode.nexts.forEach((id) => {
      removeEdge(graphId, currentNode.id, id, persistOpts);
    });
    extraProcess(graph, options);
  };

  /**
   * 递归删除一个节点
   * @param graphId
   * @param nodeId
   * @param options persist 时向存储删除该节点及其子树（Rust 侧递归 + 连带边 + 根列表清理）
   */
  const removeNode = function (
    graphId: string,
    nodeId: string,
    options?: Parameters<typeof extraProcess>[1],
  ) {
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
        extraProcess(graph, options);
        if (options?.persist) {
          quiet(
            deleteNodeFromDb(graphId, nodeId),
            `Failed to delete node ${nodeId}`,
          );
        }
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
        if (options?.persist) {
          quiet(
            addEdgeToDb(graphId, from, to),
            `Failed to add edge ${from}-${to}`,
          );
        }
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
