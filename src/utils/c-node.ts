import { ComboData, EdgeData, GraphData, NodeData } from "@antv/g6";
import { v4 as uuidv4 } from "uuid";
import { faker } from "@faker-js/faker";
/**
 * 表示一个节点，包含节点的基本信息和关系
 * 支持构建树形结构和图结构，可转换为G6图数据
 */
export class CNode {
  id: string = ""; // 节点的唯一标识符
  title: string = ""; // 节点标题
  description: string = ""; // 节点描述
  record: string = ""; // 节点详细记录
  createdAt: Date = new Date(); // 节点创建时间
  updatedAt: Date = new Date(); // 节点最后更新时间
  startAt: Date = new Date(); // 节点开始时间
  endAt: Date = new Date(); // 节点结束时间
  parent?: CNode = undefined; // 父节点
  children: CNode[] = []; // 子节点列表
  nexts: CNode[] = []; // 后续节点列表
  previous: CNode[] = []; // 前驱节点列表
  completedAt: Date = new Date(); // 节点完成时间
  completed: boolean = false; // 节点是否已完成

  constructor() {
    this.id = uuidv4();
  }

  static from(node: Partial<CNode>): CNode {
    const newNode = new CNode();
    Object.assign(newNode, node);
    return newNode;
  }

  /**
   * 生成一个模拟的CNode实例，使用faker库填充随机数据
   * 用于测试和演示目的
   * @returns {CNode} 一个填充了随机数据的CNode实例
   */
  static faker(): CNode {
    const node = new CNode();
    node.title = faker.lorem.words(3);
    node.description = faker.lorem.sentences(2);
    node.record = faker.lorem.paragraphs(2);
    node.createdAt = faker.date.past();
    node.updatedAt = faker.date.recent();
    node.startAt = faker.date.past();
    node.endAt = faker.date.future();
    node.completedAt = faker.date.future();
    node.completed = false;
    return node;
  }

  addNext(node: CNode) {
    this.nexts.push(node);
    node.previous.push(this);
  }

  addPrevious(node: CNode) {
    this.previous.push(node);
    node.nexts.push(this);
  }

  addChild(node: CNode) {
    this.children.push(node);
    node.parent = this;
  }

  addParent(node: CNode) {
    this.parent = node;
    node.children.push(this);
  }

  removeNext(node: CNode) {
    const index = this.nexts.indexOf(node);
    if (index !== -1) {
      this.nexts.splice(index, 1);
      node.previous.splice(node.previous.indexOf(this), 1);
    }
  }

  removePrevious(node: CNode) {
    const index = this.previous.indexOf(node);
    if (index !== -1) {
      this.previous.splice(index, 1);
      node.nexts.splice(node.nexts.indexOf(this), 1);
    }
  }

  removeChild(node: CNode) {
    const index = this.children.indexOf(node);
    if (index !== -1) {
      this.children.splice(index, 1);
      node.parent = undefined;
    }
  }

  removeParent(node: CNode) {
    if (this.parent === node) {
      this.parent = undefined;
      node.children.splice(node.children.indexOf(this), 1);
    }
  }

  isCombo(): boolean {
    return this.children.length > 0;
  }

  isChild(): boolean {
    return this.parent !== undefined;
  }

  isLeaf(): boolean {
    return this.children.length === 0;
  }

  /**
   * 将CNode及其关系转换为G6图数据格式
   * 该方法会遍历节点树，生成节点、边和组合（分组）数据
   * 对于有子节点的节点，会创建组合（combo）并在组合内添加代理节点
   * 对于节点之间的关系，会创建相应的边
   *
   * @returns {GraphData} G6图数据对象，包含nodes、edges和combos数组
   */
  toGraphData(): GraphData {
    // 使用Set记录已访问的节点，防止在循环引用或重复关系中无限递归
    const visited = new Set<string>();

    // 初始化数据结构
    const nodeDatas: NodeData[] = []; // 普通节点数据
    const edgeDatas: EdgeData[] = []; // 边数据
    const comboDatas: ComboData[] = []; // 组合（分组）数据
    const nodeMap = new Map<string, NodeData>();
    const comboMap = new Map<string, ComboData>();

    /**
     * 深度优先遍历函数
     * 递归遍历节点及其关系，构建图数据结构
     *
     * @param {CNode} node - 当前遍历的节点
     */
    function dfs(node: CNode) {
      // 如果节点已访问过，直接返回，避免重复处理
      if (visited.has(node.id)) return;

      // 标记当前节点为已访问
      visited.add(node.id);

      // 处理组合（分组）逻辑
      // 如果一个节点有子节点，它应该被视为一个组合（分组）
      if (node.isCombo()) {
        const comboData = {
          id: node.id, // 组合ID
          combo: node.parent?.id, // 父组合ID（如果有的话）
        };
        comboDatas.push(comboData);
        comboMap.set(comboData.id, comboData);

        // 代理头节点
        const headNode = {
          id: `${node.id}_head`,
          label: "Head",
          type: "triangle",
          combo: node.id,
        };
        nodeDatas.push(headNode);
        nodeMap.set(headNode.id, headNode);

        // 代理尾部节点
        const tailNode = {
          id: `${node.id}_tail`,
          label: "Tail",
          type: "circle",
          combo: node.id,
          style: {
            fill: "#bbb",
          },
        };
        nodeDatas.push(tailNode);
        nodeMap.set(tailNode.id, tailNode);
      } else {
        // 处理普通节点（没有子节点的节点）
        const nodeData = {
          id: node.id, // 节点唯一标识
          label: node.title, // 节点显示标签
          combo: node.parent?.id, // 所属组合ID（如果有父节点）
        };
        nodeDatas.push(nodeData);
        nodeMap.set(node.id, nodeData);
      }

      // 处理节点的后续关系（边）
      for (const next of node.nexts) {
        // 取尾部节点作为source
        const source = node.isCombo() ? `${node.id}_tail` : node.id;
        const target = next.isCombo() ? `${next.id}_head` : next.id;

        // 创建从当前节点到后续节点的边
        const edgeData = {
          id: `${source}_${target}`, // 边ID：源节点ID-目标节点ID
          source, // 边的源节点ID
          target, // 边的目标节点ID
        };
        edgeDatas.push(edgeData);
      }

      if (node.isChild()) {
        if (node.previous.length == 0) {
          const source = `${node.parent!.id}_head`;
          const target = node.id;
          const edgeData = {
            id: `${source}_${target}`, // 边ID：源节点ID-目标节点ID
            source, // 边的源节点ID
            target, // 边的目标节点ID
          };
          edgeDatas.push(edgeData);
        }

        if (node.nexts.length == 0) {
          const source = node.id;
          const target = `${node.parent!.id}_tail`;
          const edgeData = {
            id: `${source}_${target}`, // 边ID：源节点ID-目标节点ID
            source, // 边的源节点ID
            target, // 边的目标节点ID
          };
          edgeDatas.push(edgeData);
        }
      }

      const arr = [...node.children, ...node.nexts, ...node.previous];
      // 递归处理
      for (const item of arr) {
        dfs(item);
      }
    }

    // 从根节点开始深度优先遍历
    dfs(this);

    // 返回完整的图数据结构
    return {
      nodes: nodeDatas, // 节点数组
      edges: edgeDatas, // 边数组
      combos: comboDatas, // 组合数组
    };
  }

  /**
   * 创建随机的简单有向无环图（DAG）
   * @returns {CNode} 随机生成的CNode对象，表示根节点
   */
  static generateRandomSimpleDAG(): CNode {
    // 生成3到10个随机节点
    const nodeCount = Math.floor(Math.random() * 8) + 3;
    const nodes: CNode[] = [];

    // 创建所有节点
    for (let i = 0; i < nodeCount; i++) {
      const node = CNode.faker();
      node.title = `Node ${i + 1}`;
      nodes.push(node);
    }

    // 随机添加边，确保不形成环
    // 使用邻接表来跟踪边
    const adjacencyList: Map<string, string[]> = new Map();
    nodes.forEach((node) => adjacencyList.set(node.id, []));

    // 最大边数，避免图过于稠密
    const maxEdges = Math.min(nodeCount * 2, (nodeCount * (nodeCount - 1)) / 2);
    const edgeCount = Math.floor(Math.random() * maxEdges) + nodeCount - 1;

    let edgesAdded = 0;

    // 尝试添加边，最多尝试次数避免无限循环
    const maxAttempts = edgeCount * 10;
    let attempts = 0;

    while (edgesAdded < edgeCount && attempts < maxAttempts) {
      attempts++;

      // 随机选择两个不同的节点
      const sourceIndex = Math.floor(Math.random() * nodeCount);
      let targetIndex = Math.floor(Math.random() * nodeCount);

      // 确保目标节点不是源节点
      while (targetIndex === sourceIndex) {
        targetIndex = Math.floor(Math.random() * nodeCount);
      }

      const source = nodes[sourceIndex];
      const target = nodes[targetIndex];

      // 检查边是否已存在
      if (adjacencyList.get(source.id)!.includes(target.id)) {
        continue;
      }

      // 检查添加这条边是否会形成环
      // 使用DFS检测从target到source是否有路径
      const hasCycle = this.wouldCreateCycle(
        source.id,
        target.id,
        adjacencyList
      );

      if (!hasCycle) {
        // 添加边
        source.addNext(target);
        adjacencyList.get(source.id)!.push(target.id);
        edgesAdded++;
      }
    }

    // 找到可能的根节点（没有前驱节点的节点）
    const rootCandidates = nodes.filter((node) => node.previous.length === 0);

    if (rootCandidates.length === 0) {
      // 如果没有节点没有前驱，选择第一个节点作为根
      return nodes[0];
    }

    // 如果有多个候选根节点，随机选择一个
    const rootIndex = Math.floor(Math.random() * rootCandidates.length);
    return rootCandidates[rootIndex];
  }

  /**
   * 检查添加从source到target的边是否会形成环
   * @private
   * @param sourceId 源节点ID
   * @param targetId 目标节点ID
   * @param adjacencyList 邻接表
   * @returns {boolean} 如果会形成环则返回true
   */
  private static wouldCreateCycle(
    sourceId: string,
    targetId: string,
    adjacencyList: Map<string, string[]>
  ): boolean {
    // 使用DFS检查从target到source是否有路径
    const visited = new Set<string>();
    const stack: string[] = [targetId];

    while (stack.length > 0) {
      const current = stack.pop()!;

      if (current === sourceId) {
        return true; // 找到环
      }

      if (!visited.has(current)) {
        visited.add(current);
        const neighbors = adjacencyList.get(current) || [];
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            stack.push(neighbor);
          }
        }
      }
    }

    return false; // 不会形成环
  }

  /**
   * 剔除冗余边,
   * 原理是如果有abc三个节点,边有a->b,b->c,a->c
   * 那么a->c的边就属于冗余边,需要剔除
   * 这个方法会修改当前DAG，删除所有冗余边
   * @returns {number} 删除的冗余边数量
   */
  simplifyDAG(): number {
    // 收集图中的所有节点
    const allNodes = this.collectAllNodes();

    if (allNodes.length <= 1) {
      return 0; // 单个节点或空图不需要简化
    }

    // 拓扑排序
    const topologicalOrder = this.topologicalSort(allNodes);

    // 计算每个节点的可达集合（通过其他路径可达的节点）
    const reachable = new Map<string, Set<string>>();

    // 初始化可达集合
    for (const node of allNodes) {
      reachable.set(node.id, new Set<string>());
    }

    // 按拓扑逆序处理节点（从后往前）
    for (let i = topologicalOrder.length - 1; i >= 0; i--) {
      const node = topologicalOrder[i];
      const nodeReachable = reachable.get(node.id)!;

      // 合并所有直接后继的可达集合
      for (const next of node.nexts) {
        // 添加直接后继
        nodeReachable.add(next.id);

        // 合并后继的可达集合
        const nextReachable = reachable.get(next.id)!;
        for (const reachableId of nextReachable) {
          nodeReachable.add(reachableId);
        }
      }
    }

    // 识别并删除冗余边
    const edgesToRemove: Array<{ source: CNode; target: CNode }> = [];

    for (const node of allNodes) {
      // 检查每条直接边是否是冗余的
      for (const next of node.nexts) {
        // 如果next可以通过其他路径从node到达（除了直接边），那么这条直接边就是冗余的
        // 检查node是否可以通过其他直接后继到达next
        let isRedundant = false;

        // 检查node的其他直接后继是否能够到达next
        for (const otherNext of node.nexts) {
          if (otherNext === next) continue; // 跳过当前边

          const otherNextReachable = reachable.get(otherNext.id)!;
          if (otherNextReachable.has(next.id)) {
            isRedundant = true;
            break;
          }
        }

        if (isRedundant) {
          edgesToRemove.push({ source: node, target: next });
        }
      }
    }

    // 删除冗余边
    for (const { source, target } of edgesToRemove) {
      source.removeNext(target);
    }

    // 返回删除的边数，方便调试和验证
    return edgesToRemove.length;
  }

  /**
   * 收集图中的所有节点（深度优先遍历）
   * @private
   * @returns {CNode[]} 图中的所有节点
   */
  private collectAllNodes(): CNode[] {
    const visited = new Set<string>();
    const allNodes: CNode[] = [];

    const dfs = (node: CNode) => {
      if (visited.has(node.id)) return;
      visited.add(node.id);
      allNodes.push(node);

      // 遍历所有关系
      [...node.children, ...node.nexts, ...node.previous].forEach(dfs);
    };

    dfs(this);
    return allNodes;
  }

  /**
   * 对DAG进行拓扑排序
   * @private
   * @param nodes 图中的所有节点
   * @returns {CNode[]} 拓扑排序后的节点列表
   */
  private topologicalSort(nodes: CNode[]): CNode[] {
    const visited = new Set<string>();
    const tempMark = new Set<string>();
    const result: CNode[] = [];

    const visit = (node: CNode) => {
      if (tempMark.has(node.id)) {
        throw new Error("图中存在环，无法进行拓扑排序");
      }

      if (!visited.has(node.id)) {
        tempMark.add(node.id);

        // 只处理nexts关系（有向边）
        for (const next of node.nexts) {
          visit(next);
        }

        tempMark.delete(node.id);
        visited.add(node.id);
        result.unshift(node); // 添加到结果开头，实现逆后序
      }
    };

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        visit(node);
      }
    }

    return result;
  }

  /**
   * 生成随机嵌套的复杂DAG图
   * @returns
   */
  static generateRandomCompoundDAG(): CNode {
    const root = CNode.generateRandomSimpleDAG();
    root.simplifyDAG();
    const allNodes = root.collectAllNodes();
    for (const node of allNodes) {
      const rand = Math.random();
      if (rand < 0.4) {
        const child = CNode.generateRandomSimpleDAG();
        child.simplifyDAG();
        const allChildNodes = child.collectAllNodes();
        for (const childNode of allChildNodes) {
          node.addChild(childNode);
        }
      }
    }
    return root;
  }
}
