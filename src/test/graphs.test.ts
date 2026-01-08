import { describe, it, expect } from "vitest";
import { GraphUtils } from "@/utils/graphUtils";
import { PGraph, PNode } from "@/types";

describe("GraphUtils", () => {
  describe("filterByCompleted", () => {
    it("应该隐藏已完成且所有前驱和子节点都已隐藏的节点", () => {
      // 创建两个节点：A（父节点，未完成）和B（子节点，已完成）
      const nodeA: PNode = {
        id: "node-a",
        name: "Node A",
        description: "",
        record: "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        startAt: 0,
        endAt: 0,
        parent: undefined,
        children: ["node-b"],
        nexts: [],
        prevs: [],
        completedAt: 0,
        completed: false,
        expanded: true,
      };

      const nodeB: PNode = {
        id: "node-b",
        name: "Node B",
        description: "",
        record: "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        startAt: 0,
        endAt: 0,
        parent: "node-a",
        children: [],
        nexts: [],
        prevs: [],
        completedAt: Date.now(),
        completed: true,
        expanded: true,
      };

      const graph: PGraph = {
        id: "test-graph",
        name: "Test Graph",
        createdAt: Date.now(),
        updatedAt: Date.now(),
