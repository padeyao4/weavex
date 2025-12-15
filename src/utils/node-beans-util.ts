import { v4 } from "uuid";
import { PNode } from "./p-node";

// 创建节点
export function createNode(): PNode {
  return {
    id: v4(),
    title: "",
    description: "",
    record: "",
    row: 0,
    column: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    startAt: new Date(),
    endAt: new Date(),
    parent: undefined,
    children: [],
    nexts: [],
    previous: [],
    completedAt: new Date(0),
    completed: false,
  };
}

export function addChild(parent: PNode, child: PNode): void {
  parent.children.push(child);
  child.parent = parent;
  // todo 所有子节点都需要添加parent
}

export function removeChild(parent: PNode, child: PNode): void {
  const index = parent.children.indexOf(child);
  if (index !== -1) {
    parent.children.splice(index, 1);
    child.parent = undefined;
  }
  // todo 所有子节点都需要移除parent
}

export function addPrevious(parent: PNode, child: PNode): void {
  parent.previous.push(child);
  child.nexts.push(parent);
}

export function addNext(parent: PNode, child: PNode): void {
  parent.nexts.push(child);
  child.previous.push(parent);
}

export function removePrevious(parent: PNode, child: PNode): void {
  const index = parent.previous.indexOf(child);
  if (index !== -1) {
    parent.previous.splice(index, 1);
    child.nexts.splice(child.nexts.indexOf(parent), 1);
  }
}

export function removeNext(parent: PNode, child: PNode): void {
  const index = parent.nexts.indexOf(child);
  if (index !== -1) {
    parent.nexts.splice(index, 1);
    child.previous.splice(child.previous.indexOf(parent), 1);
  }
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
