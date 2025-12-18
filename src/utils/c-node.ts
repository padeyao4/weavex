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
  parent?: CNode; // 父节点
  children: CNode[] = []; // 子节点列表
  nexts: CNode[] = []; // 后续节点列表
  previous: CNode[] = []; // 前驱节点列表
  completedAt: Date = new Date(); // 节点完成时间
  completed: boolean = false; // 节点是否已完成

  constructor() {
    this.id = uuidv4();
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

  addChildren(node: CNode) {
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

  removeChildren(node: CNode) {
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
    return CNode.faker();
  }
}
