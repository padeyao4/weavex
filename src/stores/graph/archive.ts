import type { createGraphState } from "./state";
import { updateNodeToDb } from "@/lib/db";
import { error } from "@tauri-apps/plugin-log";

/**
 * 归档逻辑：完成节点满足条件后自动/可归档判断。
 */
export function createArchiveActions(state: ReturnType<typeof createGraphState>) {
  const { allGraph } = state;

  /**
   * 自动将完成的任务添加到archive中（filesystem-first：逐节点细粒度写库）
   * @param graphId
   */
  const autoArchive = function (graphId: string) {
    const graph = allGraph[graphId];
    if (!graph) return;
    const changed: string[] = [];
    Object.values(graph.nodes).forEach((node) => {
      if (node.completed) {
        // 判断prevs是否都是archive
        const prvesIsArchive = node.prevs
          .map((prve) => graph.nodes[prve])
          .every((e) => e.isArchive);
        const childrenIsArchive = node.children
          .map((id) => graph.nodes[id])
          .every((e) => e.isArchive);
        if (prvesIsArchive && childrenIsArchive) {
          node.isArchive = true;
          changed.push(node.id);
        }
      }
    });
    const t = Date.now();
    changed.forEach((id) => {
      updateNodeToDb({
        id,
        graphId,
        isArchive: true,
        updatedAt: t,
      }).catch((e) => error(`Failed to archive node ${id}: ${JSON.stringify(e)}`));
    });
  };

  const canBeArchive = function (
    graphId: string,
    nodeId: string,
    willCompleted?: boolean,
  ): boolean {
    const graph = allGraph[graphId];
    if (!graph) return false;
    const node = graph.nodes[nodeId];
    const prvesIsArchive = node.prevs
      .map((prve) => graph.nodes[prve])
      .every((e) => e.isArchive);
    const childrenIsArchive = node.children
      .map((id) => graph.nodes[id])
      .every((e) => e.isArchive);
    const isComplated = willCompleted ?? node.completed;
    return isComplated && prvesIsArchive && childrenIsArchive;
  };

  return { autoArchive, canBeArchive };
}
