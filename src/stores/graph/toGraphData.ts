import { PGraph } from "@/types";
import { keyBy, values } from "lodash-es";
import type { EdgeData, GraphData, NodeData } from "@antv/g6";
import type { createGraphState } from "./state";

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

/**
 * PGraph → G6 GraphData 转换（纯函数，不依赖 store 状态）。
 * 支持直接传入 PGraph 对象或图 id（id 解析依赖传入的 allGraph）。
 */
export function createToGraphData(state: ReturnType<typeof createGraphState>) {
  const { allGraph } = state;

  return function toGraphData(graph: PGraph | string): GraphData {
    graph = typeof graph === "string" ? allGraph[graph] : graph;
    if (!graph) return { nodes: [], edges: [] };

    const nodeMap = graph.nodes;
    const nodes: NodeData[] = [];
    const edges: EdgeData[] = [];

    //  直接遍历所有节点（保证完整性）
    Object.values(nodeMap).forEach((node) => {
      const childrenTodoNum = node.children
        .map((childId) => nodeMap[childId])
        .filter((child) => !child.completed).length;

      nodes.push({
        id: node.id,
        data: { ...node },
        style: {
          childrenTodoNum, // 待完成的子任务数量
        },
        states:
          node.isFollowed && !node.completed && !node.isArchive
            ? ["followed"]
            : [],
        combo: undefined,
      });
    });

    //  遍历所有节点的 nexts，生成边（防御性检查 target 是否存在）
    Object.values(nodeMap).forEach((node) => {
      node.nexts.forEach((targetId) => {
        if (nodeMap[targetId]) {
          edges.push({
            id: generateEdgeId(node.id, targetId),
            source: node.id,
            target: targetId,
            style: {
              sourcePort: "out",
              targetPort: "in",
            },
          });
        }
      });
    });

    return { nodes, edges };
  };
}
