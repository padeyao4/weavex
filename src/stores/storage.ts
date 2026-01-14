import { PGraph, PNode } from "@/types";
import { defineStore } from "pinia";
import { computed, reactive } from "vue";
import { useContextStore } from "./context";
import { NodeUtil, readFile, writeFile } from "@/utils";
import { resolve } from "@tauri-apps/api/path";
import { debug } from "@tauri-apps/plugin-log";
import { cloneDeep, debounce, keyBy, values } from "lodash-es";
import { EdgeData, GraphData, NodeData } from "@antv/g6";

export type Options = {
  persist?: boolean;
  update?: boolean;
  buildRoots?: boolean;
};

const GRAPH_FILE_NAME = "graphs.json";

export type ResultEdge = {
  id: string;
  source: string;
  target: string;
};

export interface GraphResult {
  nodes?: {
    add?: PNode[];
    update?: PNode[];
    remove?: PNode[];
  };
  edges?: {
    add?: ResultEdge[];
    remove?: ResultEdge[];
  };
}

/**
 * 给数组按id去重,只保留最后一个
 * @param arr
 * @returns
 */
export const uniqueById = function <T extends { id: string }>(arr: T[]) {
  return values(keyBy(arr, "id"));
};

/**
 * 合并结果
 * @param a
 * @param b
 * @returns
 */
export const mergeResult = (...rest: ResultAble[]): GraphResult => {
  return {
    nodes: {
      add: [...rest.map((r) => r?.nodes?.add ?? []).flat()],
      update: [...rest.map((r) => r?.nodes?.update ?? []).flat()],
      remove: [...rest.map((r) => r?.nodes?.remove ?? []).flat()],
    },
    edges: {
      add: [...rest.map((r) => r?.edges?.add ?? []).flat()],
      remove: [...rest.map((r) => r?.edges?.remove ?? []).flat()],
    },
  };
};

/**
 * 给结果去重
 * @param result
 * @returns
 */
export const uniqueGraphResult = (result?: GraphResult): GraphResult => {
  return {
    nodes: {
      add: uniqueById([...(result?.nodes?.add ?? [])]),
      update: uniqueById([...(result?.nodes?.update ?? [])]),
      remove: uniqueById([...(result?.nodes?.remove ?? [])]),
    },
    edges: {
      add: uniqueById([...(result?.edges?.add ?? [])]),
      remove: uniqueById([...(result?.edges?.remove ?? [])]),
    },
  };
};

/**
 * 生成edge id
 * @param source
 * @param target
 * @returns
 */
export const generateEdgeId = (source: string, target: string) =>
  `${source}_${target}`;

export type ResultAble = GraphResult | undefined;

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

  const updateNode = function (
    graphId: string,
    node: Partial<PNode> & Pick<PNode, "id">,
    options?: Options,
  ): ResultAble {
    const graph = allGraph[graphId];
    if (graph) {
      const oldNode = graph.nodes[node.id];
      if (oldNode) {
        graph.nodes[node.id] = {
          ...oldNode,
          ...node,
        };
        extraProcess(graph, options);
        return {
          nodes: {
            update: [graph.nodes[node.id]],
          },
        };
      }
    }
  };

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
  ): ResultAble {
    if (graphId && nodeId && allGraph[graphId]) {
      const graph = allGraph[graphId];
      if (graph.nodes[nodeId]) {
        graph.nodes[nodeId].expanded = expanded;
        extraProcess(graph, options);
        return expanded
          ? {
              nodes: {
                update: [graph.nodes[nodeId]],
                add: [...findAllChildren(graph, graph.nodes[nodeId])],
              },
            }
          : {
              nodes: {
                update: [graph.nodes[nodeId]],
                remove: [...findAllChildren(graph, graph.nodes[nodeId])],
              },
            };
      }
    }
  };

  /**
   * 找到所有的子孙节点
   * @param graph
   * @param node
   * @returns
   */
  const findAllChildren = function (graph: PGraph, node: PNode): PNode[] {
    const children: PNode[] = [];
    const stack: PNode[] = [node];
    while (stack.length > 0) {
      const currentNode = stack.pop()!;
      for (const childId of currentNode.children) {
        const childNode = graph.nodes[childId];
        if (childNode) {
          children.push(childNode);
          stack.push(childNode);
        }
      }
    }
    return children;
  };

  const toggleNodeExpanded = function (
    graphId: string,
    nodeId: string,
    options?: Options,
  ): ResultAble {
    return setNodeExpanded(
      graphId,
      nodeId,
      !allGraph[graphId].nodes[nodeId].expanded,
      options,
    );
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

  const setChild = function (
    graphId: string,
    parentId: string,
    childId: string,
    options?: Options,
  ): ResultAble {
    if (allGraph[graphId]) {
      const graph = allGraph[graphId];
      const parentNode = graph.nodes[parentId];
      const childNode = graph.nodes[childId];
      if (parentNode && childNode) {
        parentNode.children = [
          ...new Set([...parentNode.children, childNode.id]),
        ];
        childNode.parent = parentNode.id;
        extraProcess(graph, options);
        return {
          nodes: {
            update: [parentNode, childNode],
          },
        };
      }
    }
  };

  const addNode = function (
    graphId: string,
    node: PNode,
    options?: Options,
  ): ResultAble {
    if (allGraph[graphId]) {
      const graph = allGraph[graphId];
      graph.nodes[node.id] = node;
      extraProcess(graph, options);
      return {
        nodes: {
          add: [node],
        },
      };
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

  const removeNode = function (
    graphId: string,
    nodeId: string,
    options?: Options,
  ): ResultAble {
    const graph = allGraph[graphId];
    if (graph) {
      const node = graph.nodes[nodeId];
      if (node) {
        const result: GraphResult = {
          nodes: {
            remove: [],
            update: [],
          },
        };
        // 删除节点prevs关系
        node.prevs.forEach((prevId) => {
          const prevNode = graph.nodes[prevId];
          result.nodes?.update?.push(prevNode);
          prevNode.nexts = prevNode.nexts.filter((nextId) => nextId !== nodeId);
        });
        // 删除节点nexts关系
        node.nexts.forEach((nextId) => {
          const nextNode = graph.nodes[nextId];
          result.nodes?.update?.push(nextNode);
          nextNode.prevs = nextNode.prevs.filter((prevId) => prevId !== nodeId);
        });
        // 删除节点parent关系
        const parentNode = graph.nodes[node.parent ?? ""];
        if (parentNode) {
          result.nodes?.update?.push(parentNode);
          parentNode.children = parentNode.children.filter(
            (childId) => childId !== nodeId,
          );
        }
        // 递归删除节点children关系
        node.children.forEach((childId) => {
          const subReult = removeNode(graphId, childId);
          result.nodes?.remove?.push(...(subReult?.nodes?.remove ?? []));
        });
        // 从graph中删除
        delete graph.nodes[nodeId];
        result.nodes?.remove?.push(node);
        extraProcess(graph, options);
        return result;
      }
    }
  };

  const addEdge = function (
    graphId: string,
    from: string,
    to: string,
    options?: Options,
  ): ResultAble {
    const graph = allGraph[graphId];
    if (graph) {
      const fromNode = graph.nodes[from];
      const toNode = graph.nodes[to];
      if (fromNode && toNode) {
        fromNode.nexts.push(to);
        toNode.prevs.push(from);
        extraProcess(graph, options);
        return {
          nodes: {
            update: [fromNode, toNode],
          },
          edges: {
            add: [
              {
                id: generateEdgeId(from, to),
                source: from,
                target: to,
              },
            ],
          },
        };
      }
    }
  };

  const removeEdge = function (
    graphId: string,
    from: string,
    to: string,
    options?: Options,
  ): ResultAble {
    const graph = allGraph[graphId];
    if (graph) {
      const fromNode = graph.nodes[from];
      const toNode = graph.nodes[to];
      if (fromNode && toNode) {
        fromNode.nexts = fromNode.nexts.filter((nextId) => nextId !== to);
        toNode.prevs = toNode.prevs.filter((prevId) => prevId !== from);
        extraProcess(graph, options);
        return {
          nodes: {
            update: [fromNode, toNode],
          },
          edges: {
            remove: [
              {
                id: generateEdgeId(from, to),
                source: from,
                target: to,
              },
            ],
          },
        };
      }
    }
  };

  const transform = function (graphId: string): GraphData {
    const graph = allGraph[graphId];
    if (!graph) return {};
    if (graph.hideCompleted) {
      const clone = cloneDeep(graph);
      filterByCompleted(clone);
      return toGraphData(clone);
    } else {
      return toGraphData(graph);
    }
  };

  const filterByCompleted = function (clone: PGraph) {
    const visited = new Set<string>();
    const hideNodes = new Set<string>();

    function bfs(node: PNode) {
      if (!node || visited.has(node.id)) return;
      visited.add(node.id);

      // 先递归遍历所有相关节点
      for (const id of [...node.children, ...node.prevs]) {
        bfs(clone.nodes[id]);
      }

      // 只对已完成的节点检查隐藏条件
      if (node.completed) {
        const allPrevHidden = node.prevs
          .map((prevId) => {
            const prevNode = clone.nodes[prevId];
            return !prevNode || hideNodes.has(prevNode.id);
          })
          .every((isHidden) => isHidden);
        const allChildrenHidden = node.children
          .map((childId) => {
            const childNode = clone.nodes[childId];
            return !childNode || hideNodes.has(childNode.id);
          })
          .every((isHidden) => isHidden);
        if (allPrevHidden && allChildrenHidden) {
          hideNodes.add(node.id);
        }
      }

      // 继续遍历后续节点
      for (const id of [...node.nexts]) {
        bfs(clone.nodes[id]);
      }
    }

    for (const id of clone.rootNodeIds) {
      bfs(clone.nodes[id]);
    }

    const nodes: Record<string, PNode> = {};
    for (const node of Object.values(clone.nodes)) {
      if (!hideNodes.has(node.id)) {
        nodes[node.id] = node;
      }
    }
    clone.nodes = nodes;
    buildRoots(clone);
  };

  const toGraphData = function (graph: PGraph | string): GraphData {
    graph = typeof graph === "string" ? allGraph[graph] : graph;
    if (!graph) return {};
    const nodeMap = graph.nodes;
    const nodes: NodeData[] = [];
    const edges: EdgeData[] = [];
    const visited = new Set<string>();

    function ancestorsCollapsed(node: PNode): boolean {
      let currentNode = node;
      while (currentNode.parent) {
        const parentNode = nodeMap[currentNode.parent];
        if (!parentNode.expanded) {
          return true;
        }
        currentNode = parentNode;
      }
      return false;
    }

    function travel(node: PNode) {
      if (!node || visited.has(node.id) || ancestorsCollapsed(node)) {
        return;
      }
      visited.add(node.id);
      nodes.push({
        id: node.id,
        data: { ...node },
        states: node.isFollowed && !node.completed ? ["followed"] : [],
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

  /*
  删除当前节点但保留当前节点的关系，比如 a->b->c ,当删除b的时候，变成a->c
  如果有 a->c b->c  c->d ,当删除c的时候，变成a->d b->d
  如果有 a->c b->c  c->d c->e ,删除c的时候，变成 a->d b->d a->e b->e
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
    const arr = [];
    // 为每一对（前驱，后继）建立新的边
    for (const prevId of prevs) {
      for (const nextId of nexts) {
        // 避免创建重复的边
        const prevNode = graph.nodes[prevId];
        const nextNode = graph.nodes[nextId];
        if (prevNode && nextNode && !prevNode.nexts.includes(nextId)) {
          arr.push(addEdge(graphId, prevId, nextId));
        }
      }
    }
    // 删除当前节点
    arr.push(removeNode(graphId, nodeId, options));
    return mergeResult(...arr);
  };

  /**
   * 在指定节点后添加新节点
   */
  const appendNewNode = function (
    graphId: string,
    nodeId: string,
    options?: Options,
  ): ResultAble {
    const graph = allGraph[graphId];
    if (!graph) return;
    const nextNode = NodeUtil.createNode();
    const parentId = graph.nodes[nodeId].parent;
    const arr = [];
    const r = addNode(graphId, nextNode);
    arr.push(r);
    if (parentId) {
      const b = setChild(graphId, parentId, nextNode.id);
      arr.push(b);
    }
    const c = addEdge(graphId, nodeId, nextNode.id);
    arr.push(c);
    extraProcess(graph, options);
    return mergeResult(...arr);
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
    const arr = [];
    arr.push(addNode(graphId, nextNode));
    if (currentNode.parent) {
      arr.push(setChild(graphId, currentNode.parent, nextNode.id));
    }
    currentNode.nexts.forEach((id) => {
      arr.push(addEdge(graphId, nextNode.id, id));
      arr.push(removeEdge(graphId, currentNode.id, id));
    });
    arr.push(addEdge(graphId, currentNode.id, nextNode.id));
    extraProcess(graph, options);
    return mergeResult(...arr);
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

    const arr = [];
    arr.push(addNode(graphId, prevNode));

    parentId && arr.push(setChild(graphId, parentId, prevNode.id));
    arr.push(addEdge(graphId, prevNode.id, nodeId));
    extraProcess(graph, options);
    return mergeResult(...arr);
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
    const arr = [];
    arr.push(addNode(graphId, prevNode));
    if (currentNode.parent) {
      arr.push(setChild(graphId, currentNode.parent, prevNode.id));
    }

    // 将当前节点的所有前驱节点转移到新节点前面
    currentNode.prevs.forEach((id) => {
      arr.push(addEdge(graphId, id, prevNode.id));
      arr.push(removeEdge(graphId, id, currentNode.id));
    });

    arr.push(addEdge(graphId, prevNode.id, currentNode.id));
    extraProcess(graph, options);
    return mergeResult(...arr);
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
  ): ResultAble {
    const graph = allGraph[graphId];
    if (!graph) return;
    const currentNode = graph.nodes[nodeId];
    if (!currentNode) return;
    const arr: ResultAble[] = [];
    currentNode.prevs.forEach((id) => {
      arr.push(removeEdge(graphId, id, currentNode.id));
    });
    extraProcess(graph, options);
    return mergeResult(...arr);
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
  ): ResultAble {
    const graph = allGraph[graphId];
    if (!graph) return;
    const currentNode = graph.nodes[nodeId];
    if (!currentNode) return;
    const arr: ResultAble[] = [];
    currentNode.nexts.forEach((id) => {
      arr.push(removeEdge(graphId, currentNode.id, id));
    });
    extraProcess(graph, options);
    return mergeResult(...arr);
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
  ): ResultAble {
    const graph = allGraph[graphId];
    if (!graph) return;
    if (!graph.nodes[parentId]) return;
    const newNode = NodeUtil.createNode();
    graph.nodes[newNode.id] = newNode;
    const r = setChild(graphId, parentId, newNode.id);
    extraProcess(graph, options);
    return mergeResult(r, {
      nodes: {
        add: [graph.nodes[newNode.id]],
      },
    });
  };

  const addNewNode = function (graphId: string, options?: Options): ResultAble {
    const graph = allGraph[graphId];
    if (!graph) return;
    const newNode = NodeUtil.createNode();
    graph.nodes[newNode.id] = newNode;
    extraProcess(graph, options);
    return {
      nodes: {
        add: [newNode],
      },
    };
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
    transform,
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
