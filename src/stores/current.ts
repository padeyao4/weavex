import { PartialGraph, PartialNode, PGraph, PNode } from "@/types";
import { useGraphStore } from "./storage";
import { ref } from "vue";
import { computed } from "vue";
import { GraphUtils } from "@/utils";
import { defineStore } from "pinia";

/**
 * 当前选中的图谱存储
 * 用于管理当前正在查看或编辑的图谱ID
 */
export const useCurrentGraphStore = defineStore("graph-detail", () => {
  const graphId = ref<string | undefined>();
  const graphStore = useGraphStore();

  const graph = computed(() => {
    if (graphId.value) {
      return graphStore.allGraph[graphId.value];
    }
  });

  const graphData = computed(() => {
    return GraphUtils.transform(graph.value);
  });

  function buildRoots() {
    if (graph.value) {
      graph.value.rootNodeIds = GraphUtils.buildRootIds(graph.value?.nodes);
    }
  }

  /**
   * 设置当前图谱
   * @param graph - 图谱对象（可选），如果提供则使用其ID，否则清空当前选中
   */
  function setGraph(graph?: Partial<PGraph>) {
    graphId.value = graph?.id;
  }

  function addEdge(prevId?: string, nextId?: string) {
    graphStore.addEdge(graph.value, prevId, nextId);
  }

  function removeNode(ids?: string[] | string) {
    const param = typeof ids === "string" ? [ids] : ids;
    graphStore.removeNode(graph.value, param ?? []);
  }

  function addNode(node?: PNode) {
    graphStore.addNode(graph.value, node);
  }

  function removeEdge(ids?: string[] | { from: string; to: string }[]) {
    graphStore.removeEdge(graph.value, ids);
  }

  function updateNode(node?: PartialNode) {
    graphStore.updateNode(graph.value, node);
  }

  function updateGraph(partialGraph?: PartialGraph) {
    graphStore.updateGraph(graph.value?.id, partialGraph);
  }

  function addChild(parentId?: string, childId?: string) {
    graphStore.addChild(graph.value, parentId, childId);
  }

  function toggleNodeExpanded(nodeId: string) {
    graphStore.toggleNodeExpanded(graph.value?.id, nodeId);
  }

  return {
    graphId,
    graph,
    setGraph,
    graphData,
    addEdge,
    removeNode,
    addNode,
    removeEdge,
    updateNode,
    updateGraph,
    addChild,
    toggleNodeExpanded,
    buildRoots,
  };
});
