import { v4 as uuidv4 } from "uuid";
import { faker } from "@faker-js/faker";

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

export class NodeUtil {
  static createNode(node: Partial<PNode> = {}): PNode {
    const defaultNode = {
      id: uuidv4(),
      title: "",
      description: "",
      record: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      startAt: Date.now(),
      endAt: Date.now(),
      children: [],
      nexts: [],
      previous: [],
      completedAt: 0,
      completed: false,
    };

    return {
      ...defaultNode,
      ...node,
    };
  }

  static fakerNode(): PNode {
    const defaultNode = {
      id: uuidv4(),
      title: faker.lorem.words(3),
      description: faker.lorem.sentences(2),
      record: faker.lorem.paragraphs(3),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      startAt: Date.now(),
      endAt: Date.now(),
      children: [],
      nexts: [],
      previous: [],
      completedAt: 0,
      completed: false,
    };

    return {
      ...defaultNode,
    };
  }

  static addChild(parent: PNode, child: PNode) {
    parent.children.push(child.id);
    child.parent = parent.id;
  }
  static addNext(parent: PNode, next: PNode) {
    parent.nexts.push(next.id);
    next.previous.push(parent.id);
  }
  static addPrevious(parent: PNode, previous: PNode) {
    parent.previous.push(previous.id);
    previous.nexts.push(parent.id);
  }
  static removeChild(parent: PNode, child: PNode) {
    const index = parent.children.indexOf(child.id);
    if (index !== -1) {
      parent.children.splice(index, 1);
    }
    if (child.parent === parent.id) {
      child.parent = undefined;
    }
  }
  static removeNext(parent: PNode, next: PNode) {
    const index = parent.nexts.indexOf(next.id);
    if (index !== -1) {
      parent.nexts.splice(index, 1);
    }
    if (next.previous.indexOf(parent.id) !== -1) {
      next.previous.splice(next.previous.indexOf(parent.id), 1);
    }
  }
  static removePrevious(parent: PNode, previous: PNode) {
    const index = parent.previous.indexOf(previous.id);
    if (index !== -1) {
      parent.previous.splice(index, 1);
    }
    if (previous.nexts.indexOf(parent.id) !== -1) {
      previous.nexts.splice(previous.nexts.indexOf(parent.id), 1);
    }
  }
  static isChild(node: PNode): boolean {
    return node.parent !== undefined;
  }
  static isCombo(node: PNode): boolean {
    return node.children.length > 0;
  }
  static isLeaf(node: PNode): boolean {
    return node.children.length === 0;
  }
}
