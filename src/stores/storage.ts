import { PGraph, PNode } from "@/types";
import { defineStore } from "pinia";
import { computed, reactive } from "vue";
import { useContextStore } from "./context";
import { NodeUtil, readFile, writeFile } from "@/utils";
import { resolve } from "@tauri-apps/api/path";
import { debug } from "@tauri-apps/plugin-log";
import { debounce, keyBy, pull, values } from "lodash-es";
import { EdgeData, GraphData, NodeData } from "@antv/g6";

export type Options = {
  persist?: boolean;
  update?: boolean;
  buildRoots?: boolean;
};

const GRAPH_FILE_NAME = "graphs.json";

/**
 * 给数组按id去重,只保留最后一个
 * @param arr
 * @returns
 */
export const uniqueById = function <T extends { id: string }>(arr: T[]) {
  return values(keyBy(arr, "id"));
};

/**
 * 生成edge id
 * @param source
 * @param target
 * @returns
 */
export const generateEdgeId = (source: string, target: string) =>
  `${source}_${target}`;

export const useGraphStore = defineStore("graph-storage", () => {
  const allGraph = reactive<Record<string, PGraph>>({});

  function clear() {
    Object.keys(allGraph).forEach((key) => {
      delete allGraph[key];
    });
  }

  async function loadGraphs() {
    const contextStore = useContextStore();
    const path = await resolve(
      contextStore.context.workDir ?? "",
      GRAPH_FILE_NAME,
    );
    debug(`Loading graphs from ${path}`);
    let jsonStr = (await readFile(path)).trim();
    jsonStr = jsonStr === "" ? "{}" : jsonStr;
    const obj = JSON.parse(jsonStr);
    Object.keys(obj).forEach((key) => {
      allGraph[key] = obj[key];
    });
  }

  async function saveGraphs() {
    const contextStore = useContextStore();
    const data = JSON.stringify(allGraph);
    if (contextStore.context.workDir) {
      const filePath = await resolve(
        contextStore.context.workDir,
        GRAPH_FILE_NAME,
      );
      debug(`save graphs, path : ${filePath}`);
      await writeFile(filePath, data)
        .then(() => {
          debug(`Graphs saved successfully`);
        })
        .catch((error) => {
          debug(`Failed to save graphs: ${error}`);
        });
    }
  }

  const debouncedSave = debounce(saveGraphs, 1000);

  const addGraph = function (graph: PGraph, options?: Options) {
    allGraph[graph.id] = graph;
    extraProcess(allGraph[graph.id], options);
  };

  const updateGraph = function (
    updates: Partial<PGraph> & Pick<PGraph, "id">,
    options?: Options,
  ) {
    if (allGraph[updates.id]) {
      allGraph[updates.id] = {
        ...allGraph[updates.id],
        ...updates,
      };
      extraProcess(allGraph[updates.id], options);
    }
  };

  const removeGraph = function (graphId: string, options?: Options) {
    if (allGraph[graphId]) {
      delete allGraph[graphId];
      extraProcess(undefined, options);
    }
  };

  const buildRoots = function (graphId: string | PGraph) {
    const graph = typeof graphId === "string" ? allGraph[graphId] : graphId;
    if (!graph) return;
    const nodeMap = new Map<string | undefined, PNode>();
    const rootIds = new Set<string>();
    const nodes = Object.values(graph.nodes);
    nodes.forEach((node) => {
      nodeMap.set(node.id, node);
      rootIds.add(node.id);
    });
    for (const node of nodes) {
      if (node.parent && nodeMap.has(node.parent)) {
        rootIds.delete(node.id);
        continue;
      }
      if (node.prevs.find((prevId) => nodeMap.has(prevId))) {
        rootIds.delete(node.id);
      }
    }
    graph.rootNodeIds = Array.from(rootIds);
  };

  const extraProcess = function (graph?: PGraph, options?: Options) {
    if (options?.buildRoots && graph) {
      buildRoots(graph.id);
    }
    if (options?.update && graph) {
      graph.updatedAt = Date.now();
    }
    if (options?.persist) {
      saveGraphs();
    }
  };

  //---------------------------------------------------------对节点的基础操作 -------------------------------------------------

  const updateNode = function (
    graphId: string,
    node: Partial<PNode> & Pick<PNode, "id">,
    options?: Options,
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
    options?: Options,
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
    options?: Options,
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
    options?: Options,
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

  const addNode = function (graphId: string, node: PNode, options?: Options) {
    if (allGraph[graphId]) {
      const graph = allGraph[graphId];
      graph.nodes[node.id] = node;
      extraProcess(graph, options);
    }
  };

  /**
   * 将一个节点冲父子关系中脱离.
   * 要求这个节点不能有prevs和nexts关系.
   */
  const detachNode = function (
    graph: PGraph,
    parentNode: PNode,
    childNode: PNode,
    options?: Options,
  ) {
    pull(parentNode.children, childNode.id);
    childNode.parent = undefined;
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
    options?: Options,
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

  const removeEdge = function (
    graphId: string,
    from: string,
    to: string,
    options?: Options,
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

  const toGraphData = function (graph: PGraph | string): GraphData {
    graph = typeof graph === "string" ? allGraph[graph] : graph;
    if (!graph) return {};
    const nodeMap = graph.nodes;
    const nodes: NodeData[] = [];
    const edges: EdgeData[] = [];
    const visited = new Set<string>();

    function getInitStates(node: PNode): string[] {
      return node.isFollowed && !node.completed && !node.isArchive
        ? ["followed"]
        : [];
    }

    function travel(node: PNode) {
      if (!node || visited.has(node.id)) {
        return;
      }
      visited.add(node.id);
      nodes.push({
        id: node.id,
        data: { ...node },
        states: getInitStates(node),
        combo: undefined,
      });
      node.nexts.forEach((next) => {
        edges.push({
          id: generateEdgeId(node.id, next),
          source: node.id,
          target: next,
        });
      });
      for (const nodeId of [...node.nexts, ...node.children]) {
        travel(nodeMap[nodeId]);
      }
    }

    for (const rootId of graph.rootNodeIds) {
      travel(nodeMap[rootId]);
    }

    return {
      nodes,
      edges,
    };
  };

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
    options?: Options,
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
    options?: Options,
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
    options?: Options,
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
    options?: Options,
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
    options?: Options,
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
    options?: Options,
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
    options?: Options,
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

  const deleteEdgeById = function (
    _graphId: string,
    _edgeId: string,
    _options?: Options,
  ) {
    // todo
  };

  const addNewChildNode = function (
    graphId: string,
    parentId: string,
    options?: Options,
  ) {
    const graph = allGraph[graphId];
    if (!graph) return;
    if (!graph.nodes[parentId]) return;
    const newNode = NodeUtil.createNode();
    graph.nodes[newNode.id] = newNode;
    setChild(graphId, parentId, newNode.id);
    extraProcess(graph, options);
  };

  const addNewNode = function (graphId: string, options?: Options) {
    const graph = allGraph[graphId];
    if (!graph) return;
    const newNode = NodeUtil.createNode();
    graph.nodes[newNode.id] = newNode;
    extraProcess(graph, options);
  };

  const getGraph = function (graphId: string) {
    return allGraph[graphId];
  };

  const graphsMeta = computed(() => {
    return Object.values(allGraph).sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
    );
  });

  return {
    allGraph,
    graphsMeta,
    addNode,
    addEdge,
    removeNode,
    removeEdge,
    updateNode,
    updateGraph,
    addGraph,
    removeGraph,
    loadGraphs,
    debouncedSave,
    setChild,
    toggleNodeExpanded,
    clear,
    toGraphData,
    deleteNodeKeepEdges,
    appendNewNode,
    insertNewNode,
    addFrontNewNode,
    insertFrontNewNode,
    deletePrevsNodeEdge,
    deleteNextsNodeEdge,
    deleteEdgeById,
    addNewNode,
    addNewChildNode,
    getGraph,
    setNodeExpanded,
  };
});
