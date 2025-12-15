import { GraphData, EdgeData, ComboData, NodeData } from "@antv/g6";
import { PNode } from "./p-node";
import { createNode, addChild, addNext } from "./node-beans-util";

/**
 * 创建模板数据
 * 生成一个示例图数据结构，包含多个节点和它们之间的关系
 * 这个函数主要用于演示和测试目的
 *
 * @returns {PNode} 返回根节点，包含完整的图结构
 */
export function createTemplateData(): PNode {
  // 创建主路径上的节点 A -> B -> C
  const nodeA = createNode();
  nodeA.column = 0;
  nodeA.title = "Node A";

  const nodeB = createNode();
  nodeB.column = 200;
  nodeB.title = "Node B";

  const nodeC = createNode();
  nodeC.column = 400;
  nodeC.title = "Node C";

  // 创建子节点 1 -> 2, 1 -> 3
  const node1 = createNode();
  node1.column = 200;
  node1.row = 0;
  node1.title = "Node 1";

  const node2 = createNode();
  node2.row = 0;
  node2.column = 300;
  node2.title = "Node 2";

  const node3 = createNode();
  node3.row = 0;
  node3.column = 300;
  node3.title = "Node 3";

  // 建立节点关系
  // 节点1有两个后续节点：节点2和节点3
  addNext(node1, node2);
  addNext(node1, node3);

  // 建立主路径关系：A -> B -> C
  addNext(nodeA, nodeB);
  addNext(nodeB, nodeC);

  // 将节点1作为节点B的子节点
  addChild(nodeB, node1);

  return nodeA;
}

/**
 * 将自定义的PNode数据结构转换为G6可识别的GraphData格式
 * 这个函数执行深度优先遍历，将树状结构转换为图数据结构
 *
 * @param {PNode} root - 根节点，包含完整的图结构
 * @returns {GraphData} 返回G6兼容的图数据结构，包含节点、边和组合
 */
export function convert(root: PNode): GraphData {
  // 使用Set记录已访问的节点，防止在循环引用或重复关系中无限递归
  const visited = new Set<string>();

  // 初始化数据结构
  const nodeDatas: NodeData[] = []; // 普通节点数据
  const edgeDatas: EdgeData[] = []; // 边数据
  const comboDatas: ComboData[] = []; // 组合（分组）数据

  /**
   * 深度优先遍历函数
   * 递归遍历节点及其关系，构建图数据结构
   *
   * @param {PNode} node - 当前遍历的节点
   */
  function dfs(node: PNode) {
    // 如果节点已访问过，直接返回，避免重复处理
    if (visited.has(node.id)) return;

    // 标记当前节点为已访问
    visited.add(node.id);

    // 处理组合（分组）逻辑
    // 如果一个节点有子节点，它应该被视为一个组合（分组）
    if (node.children.length != 0) {
      comboDatas.push({
        id: node.id, // 组合ID
        combo: node.parent?.id, // 父组合ID（如果有的话）
      });

      // 递归处理所有子节点
      for (const child of node.children) {
        dfs(child);
      }
    } else {
      // 处理普通节点（没有子节点的节点）
      nodeDatas.push({
        id: node.id, // 节点唯一标识
        label: node.title, // 节点显示标签
        style: {
          x: node.column, // 节点X坐标（列位置）
          y: node.row, // 节点Y坐标（行位置）
        },
        combo: node.parent?.id, // 所属组合ID（如果有父节点）
      });
    }

    // 处理节点的后续关系（边）
    for (const next of node.nexts) {
      // 创建从当前节点到后续节点的边
      edgeDatas.push({
        id: `${node.id}-${next.id}`, // 边ID：源节点ID-目标节点ID
        source: node.id, // 边的源节点ID
        target: next.id, // 边的目标节点ID
      });

      // 递归处理后续节点
      dfs(next);
    }
  }

  // 从根节点开始深度优先遍历
  dfs(root);

  // 返回完整的图数据结构
  return {
    nodes: nodeDatas, // 节点数组
    edges: edgeDatas, // 边数组
    combos: comboDatas, // 组合数组
  };
}

/**
 * 数据结构转换说明：
 *
 * 1. 节点类型：
 *    - 普通节点：没有子节点的节点，显示为矩形
 *    - 组合节点：有子节点的节点，显示为可折叠的分组
 *
 * 2. 坐标系统：
 *    - column: X轴坐标（水平位置）
 *    - row: Y轴坐标（垂直位置）
 *
 * 3. 关系类型：
 *    - 父子关系：通过combo字段表示，子节点属于父组合
 *    - 前后关系：通过边表示，从源节点指向目标节点
 *
 * 4. 遍历策略：
 *    - 深度优先遍历确保所有节点都被访问
 *    - 使用visited集合防止循环引用导致的无限递归
 *
 * 5. G6数据结构要求：
 *    - nodes: 必须包含id和label
 *    - edges: 必须包含id, source, target
 *    - combos: 可选，用于分组显示
 */
