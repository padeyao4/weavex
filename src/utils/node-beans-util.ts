import { v4 } from "uuid";
export interface PNode {
  id: string; // 节点的唯一标识符
  title: string; // 节点标题
  description: string; // 节点描述
  record: string; // 节点详细记录
  readonly createdAt: Date; // 节点创建时间（只读）
  readonly updatedAt: Date; // 节点最后更新时间（只读）
  startAt: Date; // 节点开始时间
  endAt: Date; // 节点结束时间
  parents: PNode[]; // 父节点列表
  children: PNode[]; // 子节点列表
  nexts: PNode[]; // 后续节点列表
  previous: PNode[]; // 前驱节点列表
  completedAt: Date; // 节点完成时间
  completed: boolean; // 节点是否已完成
}

// 创建节点
export function createNode(): PNode {
  return {
    id: v4(),
    title: "",
    description: "",
    record: "",
    createdAt: new Date(),
    updatedAt: new Date(),
    startAt: new Date(),
    endAt: new Date(),
    parents: [],
    children: [],
    nexts: [],
    previous: [],
    completedAt: new Date(0),
    completed: false,
  };
}

// 更新节点
export function updateNode(
  node: PNode,
  title: string,
  description: string,
  record: string,
): PNode {
  const updatedNode = { ...node };
  updatedNode.title = title;
  updatedNode.description = description;
  updatedNode.record = record;
  updatedNode.updatedAt = new Date();
  return updatedNode;
}

// 完成节点
export function completeNode(node: PNode): PNode {
  const completedNode = { ...node };
  completedNode.completedAt = new Date();
  completedNode.completed = true;
  return completedNode;
}

// 重置节点
export function resetNode(node: PNode): PNode {
  const resetNode = { ...node };
  resetNode.completedAt = new Date(0);
  resetNode.completed = false;
  return resetNode;
}
// 生成假数据
export function generateMockData(count: number): PNode[] {
  const mockNodes: PNode[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const id = v4();
    const createdAt = new Date(
      now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000,
    ); // 过去30天内随机时间
    const startAt = new Date(
      createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000,
    ); // 创建后7天内开始
    const endAt = new Date(
      startAt.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000,
    ); // 开始后14天内结束

    const node: PNode = {
      id,
      title: `任务 ${i + 1}`,
      description: `这是第 ${i + 1} 个任务的描述`,
      record: `任务 ${i + 1} 的详细记录`,
      createdAt,
      updatedAt: new Date(
        createdAt.getTime() + Math.random() * 10 * 24 * 60 * 60 * 1000,
      ),
      startAt,
      endAt,
      parents: [],
      children: [],
      nexts: [],
      previous: [],
      completedAt:
        Math.random() > 0.5
          ? new Date(endAt.getTime() - Math.random() * 3 * 24 * 60 * 60 * 1000)
          : new Date(0),
      completed: Math.random() > 0.5,
    };

    mockNodes.push(node);
  }

  // 随机建立一些关系
  for (let i = 0; i < mockNodes.length; i++) {
    const node = mockNodes[i];

    // 随机添加父节点
    if (i > 0 && Math.random() > 0.7) {
      const parentIndex = Math.floor(Math.random() * i);
      node.parents.push(mockNodes[parentIndex]);
      mockNodes[parentIndex].children.push(node);
    }

    // 随机添加上一个节点
    if (i > 0 && Math.random() > 0.6) {
      const prevIndex = Math.floor(Math.random() * i);
      node.previous.push(mockNodes[prevIndex]);
      mockNodes[prevIndex].nexts.push(node);
    }
  }

  return mockNodes;
}
