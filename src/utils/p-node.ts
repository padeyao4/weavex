export interface PNode {
  id: string; // 节点的唯一标识符
  title: string; // 节点标题
  row: number; // 节点行数
  column: number; // 节点列数
  description: string; // 节点描述
  record: string; // 节点详细记录
  readonly createdAt: Date; // 节点创建时间（只读）
  readonly updatedAt: Date; // 节点最后更新时间（只读）
  startAt: Date; // 节点开始时间
  endAt: Date; // 节点结束时间
  parent?: PNode; // 父节点
  children: PNode[]; // 子节点列表
  nexts: PNode[]; // 后续节点列表
  previous: PNode[]; // 前驱节点列表
  completedAt: Date; // 节点完成时间
  completed: boolean; // 节点是否已完成
}
