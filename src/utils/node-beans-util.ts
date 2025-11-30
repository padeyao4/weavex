import { v4 } from "uuid";
export interface PNode {
  id: string;
  title: string;
  description: string;
  record: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  startAt: Date;
  endAt: Date;
  parents: PNode[];
  children: PNode[];
  nexts: PNode[];
  previous: PNode[];
  completedAt: Date;
  completed: boolean;
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
