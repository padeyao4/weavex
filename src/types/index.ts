export interface PNode {
  id: string; // 节点的唯一标识符
  name: string; // 节点标题
  description: string; // 节点描述
  record: string; // 节点详细记录
  createdAt: number; // 节点创建时间
  updatedAt: number; // 节点最后更新时间
  startAt: number; // 节点开始时间
  endAt: number; // 节点结束时间
  parent?: string; // 父节点
  children: string[]; // 子节点列表
  nexts: string[]; // 后续节点列表
  prevs: string[]; // 前驱节点列表
  completedAt: number; // 节点完成时间
  completed: boolean; // 节点是否已完成
  expanded?: boolean; // 节点是否已展开,默认不展开
  priority?: number; // 节点优先级，数字越大优先级越高
  isFollowed?: boolean; // 节点是否已关注
}

export interface PGraph {
  id: string; // 图的唯一 ID
  name: string; // 图名称（用于列表展示）
  createdAt: number; // 创建时间
  updatedAt: number; // 更新时间
  rootNodeIds: string[]; // 多根支持（DAG 可能有多个入口）
  hideCompleted?: boolean; // 是否显示已完成节点
  nodes: Record<string, PNode>; // 扁平化节点映射
  priority?: number; // 图优先级，数字越大优先级越高
}
