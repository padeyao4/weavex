import { PGraph, PNode } from "@/types";
import { defineStore } from "pinia";
import { computed, reactive } from "vue";
import { useContextStore } from "./context";
import { NodeUtil, readFile, writeFile } from "@/utils";
import { resolve } from "@tauri-apps/api/path";
import { debug } from "@tauri-apps/plugin-log";
import { cloneDeep, debounce } from "lodash-es";
import { EdgeData, GraphData, NodeData } from "@antv/g6";

export type Options = {
  persist?: boolean;
  update?: boolean;
  buildRoots?: boolean;
};

const GRAPH_FILE_NAME = "graphs.json";

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
  ) {
    const graph = allGraph[graphId];
    if (graph) {
      const oldNode = graph.nodes[node.id];
      if (oldNode) {
        graph.nodes[node.id] = {
          ...oldNode,
          ...node,
          updatedAt: Date.now(),
        };
        extraProcess(graph, options);
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
    if (graphId && nodeId && allGraph[graphId]) {
      const graph = allGraph[graphId];
      if (graph.nodes[nodeId]) {
        graph.nodes[nodeId].expanded = !graph.nodes[nodeId].expanded;
        extraProcess(graph, options);
      }
    }
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

  const addChild = function (
    graphId: string,
    parentId: string,
    childId: string,
    options?: Options,
  ) {
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
  ) {
    const graph = allGraph[graphId];
    if (graph) {
      const node = graph.nodes[nodeId];
      if (node) {
        // 删除节点prevs关系
        node.prevs.forEach((prevId) => {
          const prevNode = graph.nodes[prevId];
          prevNode.nexts = prevNode.nexts.filter((nextId) => nextId !== nodeId);
        });
        // 删除节点nexts关系
        node.nexts.forEach((nextId) => {
          const nextNode = graph.nodes[nextId];
          nextNode.prevs = nextNode.prevs.filter((prevId) => prevId !== nodeId);
        });
        // 删除节点parent关系
        const parentNode = graph.nodes[node.parent ?? ""];
        if (parentNode) {
          parentNode.children = parentNode.children.filter(
            (childId) => childId !== nodeId,
          );
        }
        // 递归删除节点children关系
        node.children.forEach((childId) => {
          removeNode(graphId, childId);
        });
        // 从graph中删除
        delete graph.nodes[nodeId];

        extraProcess(graph, options);
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
          id: `${node.id}_${next}`,
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
    removeNode(graphId, nodeId, options);
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
      addChild(graphId, parentId, nextNode.id);
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
      addChild(graphId, currentNode.parent, nextNode.id);
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
    if (parentId) {
      addChild(graphId, parentId, prevNode.id);
    }
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
      addChild(graphId, currentNode.parent, prevNode.id);
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
    addChild(graphId, parentId, newNode.id);
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
    addChild,
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
