import { PNode, NodeUtil } from "./p-node";
import { v4 } from "uuid";

export interface PGraph {
  id: string; // 图的唯一 ID
  name: string; // 图名称（用于列表展示）
  createdAt: number; // 创建时间
  updatedAt: number; // 更新时间
  rootNodeIds: string[]; // 多根支持（DAG 可能有多个入口）
  nodes: Record<string, PNode>[]; // 扁平化节点映射
}

export class GraphUtils {
  static createGraph(graph: Partial<PGraph> = {}): PGraph {
    const {
      id = v4(),
      name = "",
      createdAt = Date.now(),
      updatedAt = Date.now(),
      rootNodeIds = [],
      nodes = [],
    } = graph;
    return {
      id,
      name,
      createdAt,
      updatedAt,
      rootNodeIds,
      nodes,
    };
  }

  static updateGraph(
    graph: PGraph,
    name: string,
    rootNodeIds: string[]
  ): PGraph {
    return {
      ...graph,
      name,
      rootNodeIds,
      updatedAt: Date.now(),
    };
  }

  static fakerGraph(): PGraph {
    const defaultGraph = this.createGraph();

    function createRandomDAG(num: number = 10): {
      roots: PNode[];
      allNodes: PNode[];
    } {
      // 创建一个随机的DAG图,返回图的根节点和所有节点,num表示当前图的最大节点数量
      if (num <= 0) return { roots: [], allNodes: [] };

      // 创建所有节点
      const nodes: PNode[] = [];
      for (let i = 0; i < num; i++) {
        nodes.push(NodeUtil.fakerNode());
      }

      // 为每个节点分配一个随机层级（拓扑排序顺序）
      // 确保后面的节点只能连接到前面的节点，避免环
      const levels: number[] = [];
      for (let i = 0; i < num; i++) {
        levels.push(Math.floor(Math.random() * 5) + 1); // 1-5层
      }

      // 按层级排序，确保低层级节点在前
      const sortedIndices = Array.from({ length: num }, (_, i) => i).sort(
        (a, b) => levels[a] - levels[b]
      );

      // 创建连接
      const maxEdgesPerNode = Math.min(3, Math.floor(num / 2)); // 每个节点最多3条出边

      for (let i = 0; i < sortedIndices.length; i++) {
        const currentNodeIdx = sortedIndices[i];
        const currentNode = nodes[currentNodeIdx];
        const currentLevel = levels[currentNodeIdx];

        // 随机决定要连接多少个后续节点
        const numEdges = Math.floor(Math.random() * (maxEdgesPerNode + 1));

        // 从当前节点后面的节点中选择（确保无环）
        const possibleTargets = sortedIndices
          .slice(i + 1)
          .filter((idx) => levels[idx] > currentLevel) // 只连接到更高层级的节点
          .filter((idx) => {
            // 避免重复连接
            return !currentNode.nexts.includes(nodes[idx].id);
          });

        // 随机选择目标节点
        const selectedTargets = [];
        for (let j = 0; j < Math.min(numEdges, possibleTargets.length); j++) {
          const randomIdx = Math.floor(Math.random() * possibleTargets.length);
          selectedTargets.push(possibleTargets[randomIdx]);
          // 移除已选中的，避免重复
          possibleTargets.splice(randomIdx, 1);
        }

        // 创建连接
        for (const targetIdx of selectedTargets) {
          const targetNode = nodes[targetIdx];
          NodeUtil.addNext(currentNode, targetNode);
        }
      }

      // 找出根节点（没有前驱节点的节点）
      const roots: PNode[] = [];
      for (const node of nodes) {
        if (node.previous.length === 0) {
          roots.push(node);
        }
      }

      // 如果没有根节点（所有节点都有前驱），选择第一个节点作为根
      if (roots.length === 0 && nodes.length > 0) {
        roots.push(nodes[0]);
      }

      return { roots, allNodes: nodes };
    }

    function simplifyDAG(roots: PNode[], allNodes: PNode[]): PNode[] {
      // 简化DAG图，返回简化后的图
      // 简化原理: 如果有abc三个节点,有a->b->c,a->c,则去掉a->c的边,因为a节点可以通过b节点到达c,所以a到c的边是多余的

      if (roots.length === 0) return [];

      // 创建节点映射
      const nodeMap = new Map<string, PNode>();
      for (const node of allNodes) {
        nodeMap.set(node.id, node);
      }

      // 收集从根节点可达的所有节点
      const reachableNodes = new Map<string, PNode>();
      const visited = new Set<string>();

      function collectNodes(node: PNode) {
        if (visited.has(node.id)) return;
        visited.add(node.id);
        reachableNodes.set(node.id, node);

        // 遍历所有nexts关系
        for (const nextId of node.nexts) {
          const nextNode = nodeMap.get(nextId);
          if (nextNode) {
            collectNodes(nextNode);
          }
        }
      }

      for (const root of roots) {
        collectNodes(root);
      }

      // 计算每个节点的可达节点集合
      const reachable = new Map<string, Set<string>>();

      // 初始化可达集合
      for (const node of reachableNodes.values()) {
        reachable.set(node.id, new Set());
      }

      // 使用拓扑排序计算可达性
      // 首先计算入度
      const inDegree = new Map<string, number>();
      for (const node of reachableNodes.values()) {
        inDegree.set(node.id, node.previous.length);
      }

      // 拓扑排序队列
      const queue: PNode[] = [];
      for (const node of reachableNodes.values()) {
        if (inDegree.get(node.id) === 0) {
          queue.push(node);
        }
      }

      // 执行拓扑排序并计算可达性
      while (queue.length > 0) {
        const node = queue.shift()!;
        const nodeReachable = reachable.get(node.id)!;

        // 将节点自身加入可达集合
        nodeReachable.add(node.id);

        // 处理每个后续节点
        for (const nextId of node.nexts) {
          const nextNode = reachableNodes.get(nextId);
          if (!nextNode) continue;

          // 将当前节点的可达集合传递给后续节点
          const nextReachable = reachable.get(nextId)!;
          for (const reachableId of nodeReachable) {
            nextReachable.add(reachableId);
          }

          // 更新入度
          const newInDegree = inDegree.get(nextId)! - 1;
          inDegree.set(nextId, newInDegree);

          if (newInDegree === 0) {
            queue.push(nextNode);
          }
        }
      }

      // 移除冗余边
      let removedEdges = 0;
      for (const node of reachableNodes.values()) {
        const nodeReachable = reachable.get(node.id)!;

        // 检查每个出边是否冗余
        const nextsToRemove: string[] = [];
        for (const nextId of node.nexts) {
          // 如果通过其他路径可以到达nextId，则这条边是冗余的
          let isRedundant = false;

          // 检查通过其他nexts是否能到达nextId
          for (const otherNextId of node.nexts) {
            if (otherNextId === nextId) continue;

            const otherNextReachable = reachable.get(otherNextId);
            if (otherNextReachable && otherNextReachable.has(nextId)) {
              isRedundant = true;
              break;
            }
          }

          if (isRedundant) {
            nextsToRemove.push(nextId);
          }
        }

        // 移除冗余边
        for (const nextId of nextsToRemove) {
          const nextNode = reachableNodes.get(nextId);
          if (nextNode) {
            NodeUtil.removeNext(node, nextNode);
            removedEdges++;
          }
        }
      }

      console.log(`简化DAG: 移除了 ${removedEdges} 条冗余边`);

      return roots;
    }

    // 创建随机DAG
    const { roots, allNodes } = createRandomDAG(15);

    // 简化DAG
    const simplifiedRoots = simplifyDAG(roots, allNodes);

    // 收集所有可达节点
    const nodesRecord: Record<string, PNode> = {};
    const visited = new Set<string>();

    function collectReachableNodes(node: PNode) {
      if (visited.has(node.id)) return;
      visited.add(node.id);
      nodesRecord[node.id] = node;

      for (const nextId of node.nexts) {
        const nextNode = allNodes.find((n) => n.id === nextId);
        if (nextNode) {
          collectReachableNodes(nextNode);
        }
      }
    }

    for (const root of simplifiedRoots) {
      collectReachableNodes(root);
    }

    // 获取根节点ID
    const rootNodeIds = simplifiedRoots.map((root) => root.id);

    return {
      ...defaultGraph,
      name: `随机图_${Date.now()}`,
      rootNodeIds,
      nodes: [nodesRecord],
    };
  }
}
