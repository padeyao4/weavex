import { defineStore } from "pinia";
import { createGraphState } from "./state";
import { createNodeActions } from "./nodes";
import { createCompositeActions } from "./composite";
import { createArchiveActions } from "./archive";
import { createToGraphData, generateEdgeId, uniqueById } from "./toGraphData";

export type { Options } from "./state";
export { uniqueById, generateEdgeId };

/**
 * 图数据 store：对外 API 与重构前的 useGraphStore 完全一致。
 * 内部按职责拆分为 state（状态+CRUD+持久化）、nodes（节点/边基础操作）、
 * composite（复合操作）、archive（归档）、toGraphData（G6 数据转换）。
 */
export const useGraphStore = defineStore("graph-storage", () => {
  const state = createGraphState();
  const nodes = createNodeActions(state);
  const composite = createCompositeActions(state, nodes);
  const archive = createArchiveActions(state);
  const toGraphData = createToGraphData(state);

  return {
    ...state,
    ...nodes,
    ...composite,
    ...archive,
    toGraphData,
  };
});
