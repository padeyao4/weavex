import { v4 } from "uuid";
import { PNode } from "./p-node";

/**
 * 创建新的PNode节点
 *
 * 初始化一个具有默认值的PNode对象，包括：
 * - 唯一ID（使用UUID v4生成）
 * - 默认的空字符串属性
 * - 默认的时间戳
 * - 空的关联数组
 *
 * @returns {PNode} 返回一个新创建的PNode对象
 */
export function createNode(): PNode {
  return {
    id: v4(), // 使用UUID v4生成全局唯一标识符
    title: "", // 节点标题，默认为空
    description: "", // 节点描述，默认为空
    record: "", // 节点详细记录，默认为空
    row: 0, // 行位置，默认为0
    column: 0, // 列位置，默认为0
    createdAt: new Date(), // 创建时间，设置为当前时间
    updatedAt: new Date(), // 最后更新时间，设置为当前时间
    startAt: new Date(), // 开始时间，设置为当前时间
    endAt: new Date(), // 结束时间，设置为当前时间
    parent: undefined, // 父节点引用，默认为undefined
    children: [], // 子节点数组，默认为空数组
    nexts: [], // 后续节点数组，默认为空数组
    previous: [], // 前驱节点数组，默认为空数组
    completedAt: new Date(0), // 完成时间，设置为Unix纪元时间（表示未完成）
    completed: false, // 完成状态，默认为false
  };
}

/**
 * 添加子节点关系
 *
 * 将子节点及其所有后续节点添加到父节点的children数组中，
 * 并设置这些节点的parent引用为指定的父节点。
 * 使用深度优先遍历确保所有相关节点都被正确处理。
 *
 * @param {PNode} parent - 父节点
 * @param {PNode} child - 要添加的子节点
 */
export function addChild(parent: PNode, child: PNode): void {
  // 使用Set记录已访问的节点，防止在循环引用或重复关系中无限递归
  const visited = new Set<String>();

  /**
   * 深度优先遍历函数
   * 递归遍历节点及其所有后续节点
   *
   * @param {PNode} node - 当前遍历的节点
   */
  function dfs(node: PNode) {
    // 如果节点已访问过，直接返回，避免重复处理
    if (visited.has(node.id)) {
      return;
    }

    // 标记当前节点为已访问
    visited.add(node.id);

    // 设置当前节点的父节点引用
    node.parent = parent;

    // 将当前节点添加到父节点的子节点数组中
    parent.children.push(node);

    // 递归处理所有后续节点
    for (const next of node.nexts) {
      dfs(next);
    }
  }

  // 从传入的子节点开始深度优先遍历
  dfs(child);
}

/**
 * 移除子节点关系
 *
 * 从父节点的children数组中移除指定的子节点及其所有后续节点，
 * 并清除这些节点的parent引用。
 * 使用深度优先遍历确保所有相关节点都被正确处理。
 *
 * @param {PNode} parent - 父节点
 * @param {PNode} child - 要移除的子节点
 */
export function removeChild(parent: PNode, child: PNode): void {
  // 使用Set记录已访问的节点，防止在循环引用或重复关系中无限递归
  const visited = new Set<String>();

  /**
   * 深度优先遍历函数
   * 递归遍历节点及其所有后续节点
   *
   * @param {PNode} node - 当前遍历的节点
   */
  function dfs(node: PNode) {
    // 如果节点已访问过，直接返回，避免重复处理
    if (visited.has(node.id)) {
      return;
    }

    // 标记当前节点为已访问
    visited.add(node.id);

    // 在父节点的子节点数组中查找当前节点的索引
    const index = parent.children.indexOf(node);

    // 如果找到当前节点，则从数组中移除
    if (index !== -1) {
      parent.children.splice(index, 1);

      // 清除当前节点的父节点引用
      node.parent = undefined;
    }

    // 递归处理所有后续节点
    for (const next of node.nexts) {
      dfs(next);
    }
  }

  // 从传入的子节点开始深度优先遍历
  dfs(child);
}

/**
 * 添加前驱关系
 *
 * 建立双向的前驱-后续关系：
 * 1. 将子节点添加到父节点的previous数组中
 * 2. 将父节点添加到子节点的nexts数组中
 *
 * 这种关系表示：子节点 -> 父节点（子节点是父节点的前驱）
 *
 * @param {PNode} parent - 父节点（作为后续节点）
 * @param {PNode} child - 子节点（作为前驱节点）
 */
export function addPrevious(parent: PNode, child: PNode): void {
  // 将子节点添加到父节点的前驱节点数组中
  parent.previous.push(child);

  // 将父节点添加到子节点的后续节点数组中
  child.nexts.push(parent);
}

/**
 * 添加后续关系
 *
 * 建立双向的前驱-后续关系：
 * 1. 将子节点添加到父节点的nexts数组中
 * 2. 将父节点添加到子节点的previous数组中
 *
 * 这种关系表示：父节点 -> 子节点（父节点是子节点的前驱）
 *
 * @param {PNode} parent - 父节点（作为前驱节点）
 * @param {PNode} child - 子节点（作为后续节点）
 */
export function addNext(parent: PNode, child: PNode): void {
  // 将子节点添加到父节点的后续节点数组中
  parent.nexts.push(child);

  // 将父节点添加到子节点的前驱节点数组中
  child.previous.push(parent);
}

/**
 * 移除前驱关系
 *
 * 移除双向的前驱-后续关系：
 * 1. 从父节点的previous数组中移除子节点
 * 2. 从子节点的nexts数组中移除父节点
 *
 * @param {PNode} parent - 父节点（作为后续节点）
 * @param {PNode} child - 子节点（作为前驱节点）
 */
export function removePrevious(parent: PNode, child: PNode): void {
  // 在父节点的前驱节点数组中查找子节点的索引
  const index = parent.previous.indexOf(child);

  // 如果找到子节点，则从数组中移除
  if (index !== -1) {
    parent.previous.splice(index, 1);

    // 在子节点的后续节点数组中查找父节点的索引并移除
    const childNextIndex = child.nexts.indexOf(parent);
    if (childNextIndex !== -1) {
      child.nexts.splice(childNextIndex, 1);
    }
  }
}

/**
 * 移除后续关系
 *
 * 移除双向的前驱-后续关系：
 * 1. 从父节点的nexts数组中移除子节点
 * 2. 从子节点的previous数组中移除父节点
 *
 * @param {PNode} parent - 父节点（作为前驱节点）
 * @param {PNode} child - 子节点（作为后续节点）
 */
export function removeNext(parent: PNode, child: PNode): void {
  // 在父节点的后续节点数组中查找子节点的索引
  const index = parent.nexts.indexOf(child);

  // 如果找到子节点，则从数组中移除
  if (index !== -1) {
    parent.nexts.splice(index, 1);

    // 在子节点的前驱节点数组中查找父节点的索引并移除
    const childPreviousIndex = child.previous.indexOf(parent);
    if (childPreviousIndex !== -1) {
      child.previous.splice(childPreviousIndex, 1);
    }
  }
}

/**
 * 更新节点信息
 *
 * 更新节点的标题、描述和记录信息，并自动更新updatedAt时间戳。
 * 使用对象展开运算符创建新对象，避免直接修改原对象。
 *
 * @param {PNode} node - 要更新的节点
 * @param {string} title - 新的标题
 * @param {string} description - 新的描述
 * @param {string} record - 新的记录
 * @returns {PNode} 返回更新后的节点（新对象）
 */
export function updateNode(
  node: PNode,
  title: string,
  description: string,
  record: string,
): PNode {
  // 创建节点的浅拷贝，避免直接修改原对象
  const updatedNode = { ...node };

  // 更新节点属性
  updatedNode.title = title;
  updatedNode.description = description;
  updatedNode.record = record;

  // 更新最后修改时间戳
  updatedNode.updatedAt = new Date();

  return updatedNode;
}

/**
 * 标记节点为已完成
 *
 * 设置节点的完成状态为true，并记录完成时间。
 * 使用对象展开运算符创建新对象，避免直接修改原对象。
 *
 * @param {PNode} node - 要标记为完成的节点
 * @returns {PNode} 返回更新后的节点（新对象）
 */
export function completeNode(node: PNode): PNode {
  // 创建节点的浅拷贝，避免直接修改原对象
  const completedNode = { ...node };

  // 设置完成时间为当前时间
  completedNode.completedAt = new Date();

  // 标记节点为已完成
  completedNode.completed = true;

  return completedNode;
}

/**
 * 重置节点完成状态
 *
 * 将节点的完成状态重置为未完成，并将完成时间设置为Unix纪元时间。
 * 使用对象展开运算符创建新对象，避免直接修改原对象。
 *
 * @param {PNode} node - 要重置的节点
 * @returns {PNode} 返回重置后的节点（新对象）
 */
export function resetNode(node: PNode): PNode {
  // 创建节点的浅拷贝，避免直接修改原对象
  const resetNode = { ...node };

  // 重置完成时间为Unix纪元时间（1970-01-01T00:00:00.000Z）
  resetNode.completedAt = new Date(0);

  // 标记节点为未完成
  resetNode.completed = false;

  return resetNode;
}

/**
 * 工具函数使用说明：
 *
 * 1. 节点关系管理：
 *    - addChild/removeChild: 管理父子关系（树状结构）
 *    - addNext/removeNext: 管理前后关系（线性结构）
 *    - addPrevious/removePrevious: 管理前驱关系（反向线性结构）
 *
 * 2. 节点状态管理：
 *    - updateNode: 更新节点内容
 *    - completeNode: 标记节点为已完成
 *    - resetNode: 重置节点完成状态
 *
 * 3. 设计模式：
 *    - 所有修改函数都返回新对象，遵循不可变数据原则
 *    - 使用深度优先遍历处理复杂的关系网络
 *    - 使用Set防止循环引用导致的无限递归
 *
 * 4. 性能考虑：
 *    - 对于大型节点树，可以考虑使用迭代代替递归
 *    - 可以使用Map或WeakMap优化节点查找性能
 *    - 对于频繁的节点更新，可以考虑使用增量更新策略
 *
 * 5. 扩展建议：
 *    - 可以添加批量操作函数（如addChildren, removeChildren）
 *    - 可以添加关系验证函数（如hasCycle, isTree）
 *    - 可以添加节点查找函数（如findNodeById, findNodesByTitle）
 */
