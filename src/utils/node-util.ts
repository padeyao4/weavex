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

  static traverseAndAddChildren(
    parent: PNode,
    child: PNode,
    nodeMap: Record<string, PNode>,
  ) {
    const visited = new Set<string>([...parent.children]);
    function travel(node: PNode) {
      if (visited.has(node.id)) return;
      visited.add(node.id);
      NodeUtil.addChild(parent, node);
      const nodeIds = [...node.nexts, ...node.prevs];
      for (const nodeId of nodeIds) {
        travel(nodeMap[nodeId]);
      }
    }
    travel(child);
  }

  static addChild(parent: PNode, child: PNode) {
    parent.children.push(child.id);
    child.parent = parent.id;
  }

  static addNext(node: PNode, next: PNode) {
    node.nexts.push(next.id);
    next.prevs.push(node.id);
  }

  static removeNext(node: PNode, next: PNode) {
    const index = node.nexts.indexOf(next.id);
    if (index !== -1) {
      node.nexts.splice(index, 1);
    }
    const prevIndex = next.prevs.indexOf(node.id);
    if (prevIndex !== -1) {
      next.prevs.splice(prevIndex, 1);
    }
  }

  static addPrev(node: PNode, prev: PNode) {
    node.prevs.push(prev.id);
    prev.nexts.push(node.id);
  }

  static removePrev(node: PNode, prev: PNode) {
    const index = node.prevs.indexOf(prev.id);
    if (index !== -1) {
      node.prevs.splice(index, 1);
    }
    const nextIndex = prev.nexts.indexOf(node.id);
    if (nextIndex !== -1) {
      prev.nexts.splice(nextIndex, 1);
    }
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
