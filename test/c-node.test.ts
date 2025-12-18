import { describe, test, expect } from "vitest";
import { CNode } from "../src/utils/c-node";

describe("CNode", () => {
  describe("generateRandomSimpleDAG", () => {
    test("should generate a DAG with nodes", () => {
      const root = CNode.generateRandomSimpleDAG();

      // 检查返回的是CNode实例
      expect(root).toBeInstanceOf(CNode);
      expect(root.id).toBeDefined();
      expect(root.title).toBeDefined();
    });

    test("should generate a valid DAG (no cycles)", () => {
      const root = CNode.generateRandomSimpleDAG();

      // 收集所有节点
      const allNodes = new Set<CNode>();
      const visited = new Set<string>();

      function collectNodes(node: CNode) {
        if (visited.has(node.id)) return;
        visited.add(node.id);
        allNodes.add(node);

        // 遍历所有关系
        [...node.children, ...node.nexts, ...node.previous].forEach(
          collectNodes
        );
      }

      collectNodes(root);

      // 检查DAG无环性
      const checkingVisited = new Set<string>();
      const recursionStack = new Set<string>();

      function hasCycle(node: CNode): boolean {
        if (recursionStack.has(node.id)) {
          return true;
        }

        if (checkingVisited.has(node.id)) {
          return false;
        }

        checkingVisited.add(node.id);
        recursionStack.add(node.id);

        // 只检查nexts关系（有向边）
        for (const next of node.nexts) {
          if (hasCycle(next)) {
            return true;
          }
        }

        recursionStack.delete(node.id);
        return false;
      }

      // 对每个节点检查环
      for (const node of allNodes) {
        if (hasCycle(node)) {
          throw new Error("Generated graph contains a cycle!");
        }
      }

      // 如果没有抛出错误，测试通过
      expect(true).toBe(true);
    });

    test("should generate nodes with proper relationships", () => {
      const root = CNode.generateRandomSimpleDAG();

      // 收集所有节点
      const allNodes = new Set<CNode>();
      const visited = new Set<string>();

      function collectNodes(node: CNode) {
        if (visited.has(node.id)) return;
        visited.add(node.id);
        allNodes.add(node);

        [...node.children, ...node.nexts, ...node.previous].forEach(
          collectNodes
        );
      }

      collectNodes(root);

      // 检查关系的一致性
      for (const node of allNodes) {
        // 检查nexts和previous的一致性
        for (const next of node.nexts) {
          expect(next.previous).toContain(node);
        }

        for (const prev of node.previous) {
          expect(prev.nexts).toContain(node);
        }

        // 检查parent和children的一致性
        if (node.parent) {
          expect(node.parent.children).toContain(node);
        }

        for (const child of node.children) {
          expect(child.parent).toBe(node);
        }
      }
    });

    test("should be able to convert to GraphData", () => {
      const root = CNode.generateRandomSimpleDAG();
      const graphData = root.toGraphData();

      // 检查GraphData结构
      expect(graphData).toHaveProperty("nodes");
      expect(graphData).toHaveProperty("edges");
      expect(graphData).toHaveProperty("combos");

      expect(Array.isArray(graphData.nodes)).toBe(true);
      expect(Array.isArray(graphData.edges)).toBe(true);
      expect(Array.isArray(graphData.combos)).toBe(true);

      // 检查节点和边有正确的ID
      for (const node of graphData?.nodes ?? []) {
        expect(node.id).toBeDefined();
      }

      for (const edge of graphData?.edges ?? []) {
        expect(edge.id).toBeDefined();
        expect(edge.source).toBeDefined();
        expect(edge.target).toBeDefined();
      }
    });

    test("should generate different graphs on multiple calls", () => {
      const dag1 = CNode.generateRandomSimpleDAG();
      const dag2 = CNode.generateRandomSimpleDAG();

      // 它们应该是不同的实例
      expect(dag1).not.toBe(dag2);

      // 收集两个图的节点ID
      const ids1 = new Set<string>();
      const ids2 = new Set<string>();

      function collectIds(node: CNode, set: Set<string>) {
        if (set.has(node.id)) return;
        set.add(node.id);
        [...node.children, ...node.nexts, ...node.previous].forEach((n) =>
          collectIds(n, set)
        );
      }

      collectIds(dag1, ids1);
      collectIds(dag2, ids2);

      // 由于使用UUID，ID应该完全不同
      const intersection = new Set([...ids1].filter((id) => ids2.has(id)));
      expect(intersection.size).toBe(0);
    });
  });

  describe("simplifyDAG", () => {
    test("should remove redundant edges in a simple chain", () => {
      // 创建链式结构: A -> B -> C, 加上冗余边 A -> C
      const nodeA = new CNode();
      nodeA.title = "A";
      const nodeB = new CNode();
      nodeB.title = "B";
      const nodeC = new CNode();
      nodeC.title = "C";

      // 添加边: A->B, B->C, A->C (冗余)
      nodeA.addNext(nodeB);
      nodeB.addNext(nodeC);
      nodeA.addNext(nodeC); // 冗余边

      // 简化前验证
      expect(nodeA.nexts).toHaveLength(2);
      expect(nodeA.nexts).toContain(nodeB);
      expect(nodeA.nexts).toContain(nodeC);

      // 执行简化并检查返回值
      const removedEdges = nodeA.simplifyDAG();
      expect(removedEdges).toBe(1); // 应该删除1条冗余边

      // 简化后验证
      expect(nodeA.nexts).toHaveLength(1);
      expect(nodeA.nexts).toContain(nodeB); // 保留 A->B
      expect(nodeA.nexts).not.toContain(nodeC); // 删除 A->C
      expect(nodeC.previous).toHaveLength(1);
      expect(nodeC.previous).toContain(nodeB); // 只保留 B->C
    });

    test("should remove multiple redundant edges", () => {
      // 创建结构: A -> B -> C -> D, 加上冗余边 A->C, A->D, B->D
      const nodeA = new CNode();
      nodeA.title = "A";
      const nodeB = new CNode();
      nodeB.title = "B";
      const nodeC = new CNode();
      nodeC.title = "C";
      const nodeD = new CNode();
      nodeD.title = "D";

      // 添加基础链
      nodeA.addNext(nodeB);
      nodeB.addNext(nodeC);
      nodeC.addNext(nodeD);

      // 添加冗余边
      nodeA.addNext(nodeC); // 冗余: A->C 可以通过 A->B->C
      nodeA.addNext(nodeD); // 冗余: A->D 可以通过 A->B->C->D
      nodeB.addNext(nodeD); // 冗余: B->D 可以通过 B->C->D

      // 简化前验证
      expect(nodeA.nexts).toHaveLength(3);
      expect(nodeB.nexts).toHaveLength(2);
      expect(nodeC.nexts).toHaveLength(1);

      // 执行简化并检查返回值
      const removedEdges = nodeA.simplifyDAG();
      expect(removedEdges).toBe(3); // 应该删除3条冗余边

      // 简化后验证
      expect(nodeA.nexts).toHaveLength(1); // 只保留 A->B
      expect(nodeA.nexts).toContain(nodeB);
      expect(nodeB.nexts).toHaveLength(1); // 只保留 B->C
      expect(nodeB.nexts).toContain(nodeC);
      expect(nodeC.nexts).toHaveLength(1); // 保留 C->D
      expect(nodeC.nexts).toContain(nodeD);
    });

    test("should handle diamond structure correctly", () => {
      // 创建菱形结构: A -> B -> D, A -> C -> D
      // 没有冗余边，因为A到D有两条独立路径
      const nodeA = new CNode();
      nodeA.title = "A";
      const nodeB = new CNode();
      nodeB.title = "B";
      const nodeC = new CNode();
      nodeC.title = "C";
      const nodeD = new CNode();
      nodeD.title = "D";

      // 添加边
      nodeA.addNext(nodeB);
      nodeA.addNext(nodeC);
      nodeB.addNext(nodeD);
      nodeC.addNext(nodeD);

      // 添加冗余边 A->D
      nodeA.addNext(nodeD); // 这条边是冗余的

      // 简化前验证
      expect(nodeA.nexts).toHaveLength(3);

      // 执行简化并检查返回值
      const removedEdges = nodeA.simplifyDAG();
      expect(removedEdges).toBe(1); // 应该删除1条冗余边

      // 简化后验证
      expect(nodeA.nexts).toHaveLength(2); // 删除 A->D
      expect(nodeA.nexts).toContain(nodeB);
      expect(nodeA.nexts).toContain(nodeC);
      expect(nodeA.nexts).not.toContain(nodeD);
    });

    test("should not remove non-redundant edges", () => {
      // 创建简单链: A -> B -> C
      // 没有冗余边
      const nodeA = new CNode();
      nodeA.title = "A";
      const nodeB = new CNode();
      nodeB.title = "B";
      const nodeC = new CNode();
      nodeC.title = "C";

      // 添加边
      nodeA.addNext(nodeB);
      nodeB.addNext(nodeC);

      // 执行简化并检查返回值
      const removedEdges = nodeA.simplifyDAG();
      expect(removedEdges).toBe(0); // 没有冗余边，应该返回0

      // 验证边没有被删除
      expect(nodeA.nexts).toHaveLength(1);
      expect(nodeA.nexts).toContain(nodeB);
      expect(nodeB.nexts).toHaveLength(1);
      expect(nodeB.nexts).toContain(nodeC);
    });

    test("should handle single node graph", () => {
      const nodeA = new CNode();
      nodeA.title = "A";

      // 执行简化（不应该出错）并检查返回值
      const removedEdges = nodeA.simplifyDAG();
      expect(removedEdges).toBe(0); // 单节点图，应该返回0

      // 验证节点状态不变
      expect(nodeA.nexts).toHaveLength(0);
      expect(nodeA.previous).toHaveLength(0);
    });

    test("should handle empty graph (no edges)", () => {
      const nodeA = new CNode();
      nodeA.title = "A";
      const nodeB = new CNode();
      nodeB.title = "B";
      const nodeC = new CNode();
      nodeC.title = "C";

      // 没有添加任何边

      // 执行简化并检查返回值
      const removedEdges = nodeA.simplifyDAG();
      expect(removedEdges).toBe(0); // 空图，应该返回0

      // 验证没有边被添加或删除
      expect(nodeA.nexts).toHaveLength(0);
      expect(nodeB.nexts).toHaveLength(0);
      expect(nodeC.nexts).toHaveLength(0);
    });

    test("should preserve DAG properties after simplification", () => {
      // 生成随机DAG
      const root = CNode.generateRandomSimpleDAG();

      // 收集所有节点
      const allNodes = new Set<CNode>();
      const visited = new Set<string>();

      function collectNodes(node: CNode) {
        if (visited.has(node.id)) return;
        visited.add(node.id);
        allNodes.add(node);
        [...node.children, ...node.nexts, ...node.previous].forEach(
          collectNodes
        );
      }

      collectNodes(root);

      // 记录简化前的边数
      let edgesBefore = 0;
      for (const node of allNodes) {
        edgesBefore += node.nexts.length;
      }

      // 执行简化并检查返回值
      const removedEdges = root.simplifyDAG();
      expect(removedEdges).toBeGreaterThanOrEqual(0); // 应该返回非负数

      // 记录简化后的边数
      let edgesAfter = 0;
      for (const node of allNodes) {
        edgesAfter += node.nexts.length;
      }

      // 验证边数减少或不变
      expect(edgesAfter).toBeLessThanOrEqual(edgesBefore);

      // 验证简化后仍然是DAG（无环）
      const checkingVisited = new Set<string>();
      const recursionStack = new Set<string>();

      function hasCycle(node: CNode): boolean {
        if (recursionStack.has(node.id)) {
          return true;
        }

        if (checkingVisited.has(node.id)) {
          return false;
        }

        checkingVisited.add(node.id);
        recursionStack.add(node.id);

        for (const next of node.nexts) {
          if (hasCycle(next)) {
            return true;
          }
        }

        recursionStack.delete(node.id);
        return false;
      }

      for (const node of allNodes) {
        expect(hasCycle(node)).toBe(false);
      }

      // 验证关系一致性
      for (const node of allNodes) {
        for (const next of node.nexts) {
          expect(next.previous).toContain(node);
        }

        for (const prev of node.previous) {
          expect(prev.nexts).toContain(node);
        }
      }
    });

    test("should work with complex random DAG", () => {
      // 生成随机DAG
      const root = CNode.generateRandomSimpleDAG();

      // 执行简化并检查返回值
      const removedEdges = root.simplifyDAG();
      expect(removedEdges).toBeGreaterThanOrEqual(0); // 应该返回非负数

      // 验证简化后可以转换为GraphData
      const graphData = root.toGraphData();
      expect(graphData).toHaveProperty("nodes");
      expect(graphData).toHaveProperty("edges");
      expect(graphData).toHaveProperty("combos");

      // 验证图数据有效
      expect(Array.isArray(graphData.nodes)).toBe(true);
      expect(Array.isArray(graphData.edges)).toBe(true);
      expect(Array.isArray(graphData.combos)).toBe(true);
    });
  });
});
