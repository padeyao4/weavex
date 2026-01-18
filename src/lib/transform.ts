import { PNode } from "@/types";
import {
  BaseTransform,
  BaseTransformOptions,
  DrawData,
  EdgeData,
  ElementDatum,
  ElementType,
  NodeData,
} from "@antv/g6";
import { DrawContext } from "@antv/g6/lib/runtime/element";

interface CustomTransformProps extends BaseTransformOptions {
  showArchive?: boolean;
}

/**
 * 用于判断是否显示扩展和折叠
 */
export class ExpandedTransform extends BaseTransform<CustomTransformProps> {
  public beforeDraw(data: DrawData, _context: DrawContext): DrawData {
    return data;
  }
}

/**
 * 用于判断是否显示扩展和折叠
 */
export class CollapsedTransform extends BaseTransform<CustomTransformProps> {
  public beforeDraw(data: DrawData, _context: DrawContext): DrawData {
    return data;
  }
}

/**
 * 用于判断是否显示归档
 */
export class ArchiveTransform extends BaseTransform<CustomTransformProps> {
  public beforeDraw(data: DrawData, _context: DrawContext): DrawData {
    const { add, update } = data;
    const model = this.context.model;
    if (this.options.showArchive) {
      update.nodes.forEach((node) => {
        const nodeData = node.data as unknown as PNode;
        if (nodeData.isArchive) {
          add.nodes.set(node.id, node);
          model.getRelatedEdgesData(node.id).forEach((edge) => {
            add.edges.set(edge.id!, edge);
          });
        }
      });
    } else {
      const nodesToRemove = new Map<string, NodeData>();
      const edgesToRemove = new Map<string, EdgeData>();

      const allNodes = new Map([...add.nodes, ...update.nodes]);
      allNodes.forEach((node, id) => {
        const relatedEdges = model.getRelatedEdgesData(id);

        relatedEdges.forEach((edge) => {
          const every = model
            .getNodeData([edge.source, edge.target])
            .every((node) => !node.data?.isArchive); // 都不是归档的
          if (!every && edge.id) {
            edgesToRemove.set(edge.id, edge);
          }
        });

        if (node.data?.isArchive) {
          nodesToRemove.set(id, node);
        }
      });

      edgesToRemove.forEach((edge) => {
        reassignTo(data, "remove", "edge", edge);
      });
      nodesToRemove.forEach((node) => {
        reassignTo(data, "remove", "node", node);
      });
    }
    return data;
  }
}

/**
 * 重新分配绘制任务（自实现版）
 * 将指定元素从当前所在的操作队列（add/update/remove）移动到目标操作队列，
 * 并确保它不会同时存在于多个队列中。
 * 使用方法: reassignTo(data,"remove","edge",edge) 意思是将data中的edge移动到remove队列中
 *
 * @param input - 当前绘制任务数据
 * @param type - 目标操作类型：'add' | 'update' | 'remove'
 * @param elementType - 元素类型：'node' | 'edge' | 'combo'
 * @param datum - 元素数据（必须包含 id）
 * @param overwrite - 是否强制使用传入的 datum，否则优先保留已存在的数据
 */
export function reassignTo(
  input: DrawData,
  type: "add" | "update" | "remove",
  elementType: ElementType,
  datum: ElementDatum,
  overwrite = false,
): void {
  const id = datum.id;
  if (id == null) {
    console.warn("Element missing id:", datum);
    return;
  }

  const typeName = `${elementType}s` as keyof typeof input.add;

  // 1. 确定最终使用的数据：优先复用已存在的，除非 overwrite = true
  let finalDatum = datum;
  if (!overwrite) {
    finalDatum =
      input.add[typeName].get(id) ||
      input.update[typeName].get(id) ||
      input.remove[typeName].get(id) ||
      datum;
  }

  // 2. 清理：从所有非目标队列中删除该元素
  const taskTypes: ("add" | "update" | "remove")[] = [
    "add",
    "update",
    "remove",
  ];
  for (const taskType of taskTypes) {
    if (taskType !== type) {
      input[taskType][typeName].delete(id);
    }
  }

  // 3. 分配：将元素加入目标队列
  input[type][typeName].set(id, finalDatum as any);
}
