export interface PNode {
  id: string; // 节点的唯一标识符
  title: string; // 节点标题
  description: string; // 节点描述
  record: string; // 节点详细记录
  createdAt: number; // 节点创建时间
  updatedAt: number; // 节点最后更新时间
  startAt: number; // 节点开始时间
  endAt: number; // 节点结束时间
  parent?: string; // 父节点
  children: string[]; // 子节点列表
  nexts: string[]; // 后续节点列表
  previous: string[]; // 前驱节点列表
  completedAt: number; // 节点完成时间
  completed: boolean; // 节点是否已完成
}
