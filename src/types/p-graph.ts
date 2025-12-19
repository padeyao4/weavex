import { PNode } from "./p-node";

export interface PGraph {
  id: string; // 图的唯一 ID
  name: string; // 图名称（用于列表展示）
  createdAt: string; // 创建时间
  rootNodeIds: string[]; // 多根支持（DAG 可能有多个入口）
  nodes: Record<string, PNode>; // 扁平化节点映射
}
