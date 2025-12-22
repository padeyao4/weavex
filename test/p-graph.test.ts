import { describe, test, expect } from "vitest";
import { GraphUtils } from "../src/types/p-graph";
import { PNode } from "../src/types/p-node";

describe("GraphUtils", () => {
  describe("fakerGraph", () => {
    test("should create a graph with valid structure", () => {
      const graph = GraphUtils.fakerGraph();

      // 检查基本属性
      expect(graph).toBeDefined();
      expect(graph.id).toBeDefined();
      expect(graph.name).toBeDefined();
      expect(graph.createdAt).toBeDefined();
      expect(graph.updatedAt).toBeDefined();
      expect(graph.rootNodeIds).toBeDefined();
      expect(graph.nodes).toBeDefined();

      // 检查类型
      expect(typeof graph.id).toBe("string");
      expect(typeof graph.name).toBe("string");
      expect(typeof graph.createdAt).toBe("number");
      expect(typeof graph.updatedAt).toBe("number");
      expect(Array.isArray(graph.rootNodeIds)).toBe(true);
      expect(Array.isArray(graph.nodes)).toBe(true);
    });

    test("should have valid nodes array", () => {
      const graph = GraphUtils.fakerGraph();

      // 检查 nodes 数组
      expect(graph.nodes).toHaveLength(1);
      expect(typeof graph.nodes[0]).toBe("object");

      const nodesRecord = graph.nodes[0];
      const nodeIds = Object.keys(nodesRecord);

      // 应该有节点
      expect(nodeIds.length).toBeGreaterThan(0);

      // 检查每个节点
      for (const nodeId of nodeIds) {
        const node = nodesRecord[nodeId];
        expect(node).toBeDefined();
        expect(node.id).toBe(nodeId);
        expect(typeof node.title).toBe("string");
        expect(typeof node.description).toBe("string");
        expect(Array.isArray(node.nexts)).toBe(true);
        expect(Array.isArray(node.previous)).toBe(true);
      }
    });

    test("should have valid root node IDs", () => {
      const graph = GraphUtils.fakerGraph();

      // 检查根节点ID
      expect(graph.rootNodeIds.length).toBeGreaterThan(0);

      const nodesRecord = graph.nodes[0];

      // 每个根节点ID都应该在节点记录中存在
      for (const rootId of graph.rootNodeIds) {
        expect(nodesRecord[rootId]).toBeDefined();
        const rootNode = nodesRecord[rootId];
        // 根节点应该没有前驱节点
        expect(rootNode.previous.length).toBe(0);
      }
    });
  });

  describe("createRandomDAG (internal function)", () => {
    test("should generate DAG roots", () => {
      // 通过 fakerGraph 间接测试 createRandomDAG
      const graph = GraphUtils.fakerGraph();
      const nodesRecord = graph.nodes[0];

      // 收集所有节点
      const allNodes = Object.values(nodesRecord);

      // 验证DAG无环性
      const visited = new Set<string>();
      const recursionStack = new Set<string>();
      let hasCycle = false;

      function checkCycle(node: PNode): boolean {
        if (recursionStack.has(node.id)) {
          return true;
        }

        if (visited.has(node.id)) {
          return false;
        }

        visited.add(node.id);
        recursionStack.add(node.id);

        for (const nextId of node.nexts) {
          const nextNode = allNodes.find((n) => n.id === nextId);
          if (nextNode && checkCycle(nextNode)) {
            return true;
          }
        }

        recursionStack.delete(node.id);
        return false;
      }

      // 从每个根节点开始检查
      for (const rootId of graph.rootNodeIds) {
        const rootNode = nodesRecord[rootId];
        if (checkCycle(rootNode)) {
          hasCycle = true;
          break;
        }
      }

      expect(hasCycle).toBe(false);
    });

    test("should generate nodes with proper relationships", () => {
      const graph = GraphUtils.fakerGraph();
      const nodesRecord = graph.nodes[0];
      const allNodes = Object.values(nodesRecord);

      // 检查关系的一致性
      for (const node of allNodes) {
        // 检查 nexts 的一致性
        for (const nextId of node.nexts) {
          const nextNode = nodesRecord[nextId];
          // 只检查可达节点中的关系
          if (nextNode) {
            expect(nextNode.previous).toContain(node.id);
          }
        }

        // 检查 previous 的一致性
        for (const prevId of node.previous) {
          const prevNode = nodesRecord[prevId];
          // 只检查可达节点中的关系
          if (prevNode) {
            expect(prevNode.nexts).toContain(node.id);
          }
        }
      }
    });

    test("should generate different graphs on multiple calls", () => {
      const graph1 = GraphUtils.fakerGraph();
      const graph2 = GraphUtils.fakerGraph();

      // 它们应该是不同的实例
      expect(graph1).not.toBe(graph2);
      expect(graph1.id).not.toBe(graph2.id);

      // 节点ID应该完全不同（由于使用UUID）
      const nodeIds1 = Object.keys(graph1.nodes[0]);
      const nodeIds2 = Object.keys(graph2.nodes[0]);

      const intersection = nodeIds1.filter((id) => nodeIds2.includes(id));
      expect(intersection.length).toBe(0);
    });
  });

  describe("simplifyDAG (internal function)", () => {
    test("should remove redundant edges", () => {
      // 通过 fakerGraph 测试简化功能
      const graph = GraphUtils.fakerGraph();
      const nodesRecord = graph.nodes[0];
      const allNodes = Object.values(nodesRecord);

      // 计算简化前的边数
      let edgesBefore = 0;
      for (const node of allNodes) {
        edgesBefore += node.nexts.length;
      }

      // 验证简化后没有冗余边
      // 通过检查每个节点的出边是否都是必要的
      for (const node of allNodes) {
        const nodeReachable = new Set<string>();
        const stack: PNode[] = [node];

        // 计算通过其他路径可达的节点
        while (stack.length > 0) {
          const currentNode = stack.pop()!;
          if (currentNode !== node) {
            nodeReachable.add(currentNode.id);
          }

          for (const nextId of currentNode.nexts) {
            const nextNode = allNodes.find((n) => n.id === nextId);
            if (nextNode && !nodeReachable.has(nextId)) {
              stack.push(nextNode);
            }
          }
        }

        // 检查是否有直接边指向可达节点（这应该是冗余的）
        for (const nextId of node.nexts) {
          // 如果通过其他路径也能到达这个节点，那么这条边可能是冗余的
          // 但在简化后的图中，不应该有这样的冗余边
          let reachableThroughOthers = false;

          for (const otherNextId of node.nexts) {
            if (otherNextId === nextId) continue;

            const otherNextNode = allNodes.find((n) => n.id === otherNextId);
            if (otherNextNode) {
              // 检查是否通过 otherNextNode 可以到达 nextId
              const visited = new Set<string>();
              const queue: PNode[] = [otherNextNode];

              while (queue.length > 0) {
                const current = queue.shift()!;
                if (current.id === nextId) {
                  reachableThroughOthers = true;
                  break;
                }

                for (const nId of current.nexts) {
                  const nNode = allNodes.find((n) => n.id === nId);
                  if (nNode && !visited.has(nId)) {
                    visited.add(nId);
                    queue.push(nNode);
                  }
                }
              }
            }

            if (reachableThroughOthers) break;
          }

          // 在简化后的图中，不应该有通过其他路径可达的直接边
          expect(reachableThroughOthers).toBe(false);
        }
      }
    });

    test("should preserve DAG properties after simplification", () => {
      const graph = GraphUtils.fakerGraph();
      const nodesRecord = graph.nodes[0];
      const allNodes = Object.values(nodesRecord);

      // 验证仍然是DAG（无环）
      const visited = new Set<string>();
      const recursionStack = new Set<string>();
      let hasCycle = false;

      function checkCycle(node: PNode): boolean {
        if (recursionStack.has(node.id)) {
          return true;
        }

        if (visited.has(node.id)) {
          return false;
        }

        visited.add(node.id);
        recursionStack.add(node.id);

        for (const nextId of node.nexts) {
          const nextNode = allNodes.find((n) => n.id === nextId);
          if (nextNode && checkCycle(nextNode)) {
            return true;
          }
        }

        recursionStack.delete(node.id);
        return false;
      }

      // 从每个根节点开始检查
      for (const rootId of graph.rootNodeIds) {
        const rootNode = nodesRecord[rootId];
        if (checkCycle(rootNode)) {
          hasCycle = true;
          break;
        }
      }

      expect(hasCycle).toBe(false);
    });
  });

  describe("createGraph", () => {
    test("should create graph with default values", () => {
      const graph = GraphUtils.createGraph();

      expect(graph.id).toBeDefined();
      expect(graph.name).toBe("");
      expect(graph.createdAt).toBeDefined();
      expect(graph.updatedAt).toBeDefined();
      expect(Array.isArray(graph.rootNodeIds)).toBe(true);
      expect(graph.rootNodeIds.length).toBe(0);
      expect(Array.isArray(graph.nodes)).toBe(true);
      expect(graph.nodes.length).toBe(0);
    });

    test("should create graph with custom values", () => {
      const customGraph = {
        id: "custom-id",
        name: "Custom Graph",
        createdAt: 1234567890,
        updatedAt: 1234567891,
        rootNodeIds: ["root1", "root2"],
        nodes: [{ node1: { id: "node1", title: "Node 1" } as PNode }],
      };

      const graph = GraphUtils.createGraph(customGraph);

      expect(graph.id).toBe("custom-id");
      expect(graph.name).toBe("Custom Graph");
      expect(graph.createdAt).toBe(1234567890);
      expect(graph.updatedAt).toBe(1234567891);
      expect(graph.rootNodeIds).toEqual(["root1", "root2"]);
      expect(graph.nodes).toEqual([{ node1: customGraph.nodes[0].node1 }]);
    });
  });

  describe("updateGraph", () => {
    test("should update graph name and root node IDs", () => {
      const originalGraph = GraphUtils.createGraph({
        name: "Original Graph",
        rootNodeIds: ["old-root"],
      });

      const updatedGraph = GraphUtils.updateGraph(
        originalGraph,
        "Updated Graph",
        ["new-root1", "new-root2"]
      );

      expect(updatedGraph.id).toBe(originalGraph.id);
      expect(updatedGraph.name).toBe("Updated Graph");
      expect(updatedGraph.rootNodeIds).toEqual(["new-root1", "new-root2"]);
      expect(updatedGraph.createdAt).toBe(originalGraph.createdAt);
      expect(updatedGraph.updatedAt).toBeGreaterThanOrEqual(
        originalGraph.updatedAt
      );
      expect(updatedGraph.nodes).toEqual(originalGraph.nodes);
    });

    test("should update timestamp", () => {
      const originalGraph = GraphUtils.createGraph();
      const originalUpdatedAt = originalGraph.updatedAt;

      // 直接更新并检查时间戳是否更新
      const updatedGraph = GraphUtils.updateGraph(
        originalGraph,
        "New Name",
        []
      );

      expect(updatedGraph.updatedAt).toBeGreaterThanOrEqual(originalUpdatedAt);
    });
  });
});
