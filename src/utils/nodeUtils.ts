import { v4 as uuidv4 } from "uuid";
import { faker } from "@faker-js/faker";
import { PNode } from "@/types";

export class NodeUtil {
  static createNode(node: Partial<PNode> = {}): PNode {
    const defaultNode = {
      id: uuidv4(),
      name: "",
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
      expanded: false,
      priority: Date.now(),
      isFollowed: false,
    };

    return {
      ...defaultNode,
      ...node,
    };
  }

  static fakerNode(): PNode {
    const defaultNode = {
      id: uuidv4(),
      name: faker.lorem.words(3),
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
}
