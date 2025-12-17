import { GraphData, EdgeData, ComboData, NodeData } from "@antv/g6";
import { PNode } from "./p-node";

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
  const nodeMap = new Map<string, NodeData>();
  const comboMap = new Map<string, ComboData>();

  function isCombo(node: PNode): boolean {
    return node.children.length > 0;
  }

  function isChild(node: PNode): boolean {
    return node.parent !== undefined;
  }

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
    if (isCombo(node)) {
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
      const source = isCombo(node) ? `${node.id}_tail` : node.id;
      const target = isCombo(next) ? `${next.id}_head` : next.id;

      // 创建从当前节点到后续节点的边
      const edgeData = {
        id: `${source}_${target}`, // 边ID：源节点ID-目标节点ID
        source, // 边的源节点ID
        target, // 边的目标节点ID
      };
      edgeDatas.push(edgeData);
    }

    if (isChild(node)) {
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
  dfs(root);

  // 返回完整的图数据结构
  return {
    nodes: nodeDatas, // 节点数组
    edges: edgeDatas, // 边数组
    combos: comboDatas, // 组合数组
  };
}
