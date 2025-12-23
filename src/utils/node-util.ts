import { v4 as uuidv4 } from "uuid";
import { faker } from "@faker-js/faker";
import { PNode } from "@/types";

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
      prevs: [],
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
      prevs: [],
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

  static removeChild(parent: PNode, child: PNode) {
    const index = parent.children.indexOf(child.id);
    if (index !== -1) {
      parent.children.splice(index, 1);
    }
    if (child.parent === parent.id) {
      child.parent = undefined;
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
  static noPrev(node: PNode): boolean {
    return node.prevs.length === 0;
  }
  static noNext(node: PNode): boolean {
    return node.nexts.length === 0;
  }
}
