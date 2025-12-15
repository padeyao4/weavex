import { BaseLayout, register, ExtensionCategory } from "@antv/g6";
import type {
  GraphData,
  NodeData,
  EdgeData,
  ComboData,
  BaseLayoutOptions,
} from "@antv/g6";

/**
 * 自定义力导向布局选项
 */
interface CustomForceLayoutOptions extends BaseLayoutOptions {
  /** 节点之间的最小距离 */
  nodeSpacing?: number;
  /** 同一层级内节点之间的固定水平距离 */
  levelSpacing?: number;
  /** 不同层级之间的垂直距离 */
  verticalSpacing?: number;
  /** 节点斥力强度 */
  nodeStrength?: number;
  /** 边引力强度 */
  edgeStrength?: number;
  /** 中心引力强度 */
  centerStrength?: number;
  /** 最大迭代次数 */
  maxIterations?: number;
  /** 冷却系数 */
  coolingFactor?: number;
  /** 初始温度 */
  initialTemperature?: number;
  /** 每次布局迭代时的回调函数 */
  onTick?: (data: GraphData) => void;
}

/**
 * 节点位置和速度信息
 */
interface NodeInfo {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  level: number;
  comboId?: string;
  isCombo?: boolean;
}

/**
 * 自定义力导向布局类
 *
 * 基于力导向布局，但进行了以下改进：
 * 1. 同一层级的combo和节点之间保持固定距离
 * 2. 节点按从左到右排序
 * 3. 调整力的方向和强度以适应层级布局
 */
export default class CustomForceLayout extends BaseLayout<CustomForceLayoutOptions> {
  /** 布局的唯一标识符 */
  public id = "custom-force";

  /** 默认布局选项 */
  private defaultOptions: Required<CustomForceLayoutOptions> = {
    nodeSpacing: 50,
    levelSpacing: 100,
    verticalSpacing: 150,
    nodeStrength: -1000,
    edgeStrength: 0.1,
    centerStrength: 0.01,
    maxIterations: 300,
    coolingFactor: 0.95,
    initialTemperature: 100,
    onTick: () => {},
    type: this.id,
    nodeFilter: () => true,
    comboFilter: () => true,
    preLayout: false,
    isLayoutInvisibleNodes: false,
    width: 0,
    height: 0,
    animation: false,
    enableWorker: false,
    iterations: 0,
  };

  /** 节点信息映射表 */
  private nodeMap: Map<string, NodeInfo> = new Map();
  /** 边列表 */
  private edges: EdgeData[] = [];
  /** combo列表 */
  private combos: ComboData[] = [];
  /** 当前温度 */
  private temperature: number = 100;
  /** 当前迭代次数 */
  private iteration: number = 0;
  /** 画布中心点 */
  private center: { x: number; y: number } = { x: 400, y: 300 };
  /** 层级映射表 */
  private levelMap: Map<number, string[]> = new Map();

  /**
   * 执行布局算法
   */
  async execute(
    data: GraphData,
    options: CustomForceLayoutOptions = { type: this.id },
  ): Promise<GraphData> {
    // 合并选项
    const opts = { ...this.defaultOptions, ...options };

    // 初始化数据
    this.initialize(data, opts);

    // 执行力导向布局迭代
    for (
      this.iteration = 0;
      this.iteration < opts.maxIterations;
      this.iteration++
    ) {
      // 计算各种力
      this.calculateForces(opts);

      // 应用约束条件
      this.applyConstraints(opts);

      // 更新节点位置
      this.updatePositions();

      // 调用回调函数
      opts.onTick(this.getCurrentData());

      // 降低温度
      this.temperature *= opts.coolingFactor;

      // 如果温度很低，提前结束
      if (this.temperature < 0.1) break;

      // 添加微小延迟以避免阻塞UI
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    return this.getCurrentData();
  }

  /**
   * 初始化布局数据
   */
  private initialize(
    data: GraphData,
    options: Required<CustomForceLayoutOptions>,
  ): void {
    // 重置状态
    this.nodeMap.clear();
    this.levelMap.clear();
    this.edges = data.edges || [];
    this.combos = data.combos || [];
    this.temperature = options.initialTemperature;
    this.iteration = 0;

    // 初始化节点信息
    const nodes = data.nodes || [];
    nodes.forEach((node) => {
      // 计算节点层级
      const level = this.calculateNodeLevel(node);

      // 创建节点信息
      const nodeInfo: NodeInfo = {
        id: node.id as string,
        x: (node.style as any)?.x || Math.random() * 600 + 100,
        y: (node.style as any)?.y || Math.random() * 400 + 100,
        vx: 0,
        vy: 0,
        level,
        comboId: (node as any).combo,
        isCombo: this.isComboNode(node.id as string),
      };

      this.nodeMap.set(node.id as string, nodeInfo);

      // 添加到层级映射表
      if (!this.levelMap.has(level)) {
        this.levelMap.set(level, []);
      }
      this.levelMap.get(level)!.push(node.id as string);
    });

    // 为每个层级内的节点按X坐标排序
    this.levelMap.forEach((nodeIds) => {
      nodeIds.sort((a, b) => {
        const nodeA = this.nodeMap.get(a)!;
        const nodeB = this.nodeMap.get(b)!;
        return nodeA.x - nodeB.x;
      });
    });
  }

  /**
   * 计算节点层级
   */
  private calculateNodeLevel(node: NodeData): number {
    let level = 0;
    let currentComboId = (node as any).combo;

    // 通过combo链计算层级深度
    while (currentComboId) {
      level++;
      const combo = this.combos.find((c) => c.id === currentComboId);
      currentComboId = combo ? (combo as any).combo : undefined;
    }

    return level;
  }

  /**
   * 判断节点是否是combo节点
   */
  private isComboNode(nodeId: string): boolean {
    return this.combos.some((combo) => combo.id === nodeId);
  }

  /**
   * 计算各种力
   */
  private calculateForces(options: Required<CustomForceLayoutOptions>): void {
    // 重置速度
    this.nodeMap.forEach((node) => {
      node.vx = 0;
      node.vy = 0;
    });

    // 计算节点斥力
    this.calculateNodeRepulsion(options);

    // 计算边引力
    this.calculateEdgeAttraction(options);

    // 计算中心引力
    this.calculateCenterAttraction(options);

    // 计算层级引力
    this.calculateLevelAttraction(options);
  }

  /**
   * 计算节点斥力
   */
  private calculateNodeRepulsion(
    options: Required<CustomForceLayoutOptions>,
  ): void {
    const nodes = Array.from(this.nodeMap.values());

    for (let i = 0; i < nodes.length; i++) {
      const node1 = nodes[i];

      for (let j = i + 1; j < nodes.length; j++) {
        const node2 = nodes[j];

        const dx = node2.x - node1.x;
        const dy = node2.y - node1.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = options.nodeStrength / (distance * distance);

        if (distance > 0) {
          node1.vx -= (dx / distance) * force;
          node1.vy -= (dy / distance) * force;
          node2.vx += (dx / distance) * force;
          node2.vy += (dy / distance) * force;
        }
      }
    }
  }

  /**
   * 计算边引力
   */
  private calculateEdgeAttraction(
    options: Required<CustomForceLayoutOptions>,
  ): void {
    this.edges.forEach((edge) => {
      const sourceNode = this.nodeMap.get(edge.source as string);
      const targetNode = this.nodeMap.get(edge.target as string);

      if (sourceNode && targetNode) {
        const dx = targetNode.x - sourceNode.x;
        const dy = targetNode.y - sourceNode.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = options.edgeStrength * distance;

        if (distance > 0) {
          sourceNode.vx += (dx / distance) * force;
          sourceNode.vy += (dy / distance) * force;
          targetNode.vx -= (dx / distance) * force;
          targetNode.vy -= (dy / distance) * force;
        }
      }
    });
  }

  /**
   * 计算中心引力
   */
  private calculateCenterAttraction(
    options: Required<CustomForceLayoutOptions>,
  ): void {
    this.nodeMap.forEach((node) => {
      const dx = this.center.x - node.x;
      const dy = this.center.y - node.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = options.centerStrength * distance;

      if (distance > 0) {
        node.vx += (dx / distance) * force;
        node.vy += (dy / distance) * force;
      }
    });
  }

  /**
   * 计算层级引力
   */
  private calculateLevelAttraction(
    options: Required<CustomForceLayoutOptions>,
  ): void {
    this.levelMap.forEach((nodeIds, level) => {
      const targetY = level * options.verticalSpacing + 100;

      nodeIds.forEach((nodeId) => {
        const node = this.nodeMap.get(nodeId)!;
        const dy = targetY - node.y;
        node.vy += dy * 0.05;
      });
    });
  }

  /**
   * 应用约束条件
   */
  private applyConstraints(options: Required<CustomForceLayoutOptions>): void {
    this.levelMap.forEach((nodeIds) => {
      // 按当前X坐标排序
      nodeIds.sort((a, b) => {
        const nodeA = this.nodeMap.get(a)!;
        const nodeB = this.nodeMap.get(b)!;
        return nodeA.x - nodeB.x;
      });

      // 应用固定水平距离
      for (let i = 0; i < nodeIds.length; i++) {
        const currentNode = this.nodeMap.get(nodeIds[i])!;

        // 目标X位置
        const targetX = 100 + i * options.levelSpacing;
        const dx = targetX - currentNode.x;
        currentNode.vx += dx * 0.1;

        // 确保节点之间保持最小距离
        if (i > 0) {
          const prevNode = this.nodeMap.get(nodeIds[i - 1])!;
          const distance = currentNode.x - prevNode.x;

          if (distance < options.nodeSpacing) {
            const pushForce = (options.nodeSpacing - distance) * 0.5;
            prevNode.vx -= pushForce;
            currentNode.vx += pushForce;
          }
        }
      }
    });
  }

  /**
   * 更新节点位置
   */
  private updatePositions(): void {
    this.nodeMap.forEach((node) => {
      // 限制最大速度
      const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
      const maxSpeed = this.temperature;

      if (speed > maxSpeed) {
        node.vx = (node.vx / speed) * maxSpeed;
        node.vy = (node.vy / speed) * maxSpeed;
      }

      // 更新位置
      node.x += node.vx;
      node.y += node.vy;

      // 添加随机扰动
      node.x += (Math.random() - 0.5) * this.temperature * 0.1;
      node.y += (Math.random() - 0.5) * this.temperature * 0.1;
    });
  }

  /**
   * 获取当前布局数据
   */
  private getCurrentData(): GraphData {
    const nodes: NodeData[] = [];

    this.nodeMap.forEach((nodeInfo) => {
      nodes.push({
        id: nodeInfo.id,
        style: {
          x: nodeInfo.x,
          y: nodeInfo.y,
        },
      });
    });

    return {
      nodes,
      edges: this.edges,
      combos: this.combos,
    };
  }

  /**
   * 执行单次布局迭代
   */
  tick = () => {
    const options = { ...this.defaultOptions, ...this.options };
    this.calculateForces(options);
    this.applyConstraints(options);
    this.updatePositions();
    return this.getCurrentData();
  };

  /**
   * 停止布局
   */
  stop = () => {
    this.nodeMap.clear();
    this.levelMap.clear();
    this.edges = [];
    this.combos = [];
  };
}

register(ExtensionCategory.LAYOUT, "custom-layout", CustomForceLayout);
