import { PNode } from "@/types";
import {
  BaseTransform,
  BaseTransformOptions,
  DrawData,
  ElementDatum,
  ElementType,
} from "@antv/g6";
import { DrawContext } from "@antv/g6/lib/runtime/element";
import { CustomTransformOption } from "@antv/g6/lib/spec/transform";

interface CustomTransformProps extends BaseTransformOptions {
  showArchive?: boolean;
}

export class CustomTransform extends BaseTransform<CustomTransformProps> {
  public beforeDraw(data: DrawData, _context: DrawContext): DrawData {
    return data;
  }
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
 * 用于判断是否显示归档
 */
export class ArchiveTransform extends BaseTransform<CustomTransformProps> {
  public beforeDraw(data: DrawData, _context: DrawContext): DrawData {
    const { add, update, remove } = data;
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
      add.nodes.forEach((node) => {
        const nodeData = node.data as unknown as PNode;
        if (nodeData.isArchive) {
          add.nodes.delete(node.id);
          remove.nodes.set(node.id, node);
        }
      });
      update.nodes.forEach((node) => {
        const nodeData = node.data as unknown as PNode;
        if (nodeData.isArchive) {
          remove.nodes.set(node.id, node);
        }
      });
      remove.nodes.forEach((node) => {
        model.getRelatedEdgesData(node.id).forEach((edge) => {
          remove.edges.set(edge.id!, edge);
        });
      });
    }
    return data;
  }
}

// export class ArchiveTransform extends BaseTransform<CustomTransformOption> {
//   public beforeDraw(data: DrawData, _context: DrawContext): DrawData {
//     const { showArchive = false } = this.options;
//     const model = this.context.model;

//     // === 第一步：收集所有归档节点 ID ===
//     const archiveNodeIds = new Set<string>();
//     [data.add, data.update, data.remove].forEach((task) => {
//       task.nodes.forEach((node) => {
//         const pnode = node.data as unknown as PNode;
//         if (pnode?.isArchive) archiveNodeIds.add(node.id);
//       });
//     });

//     if (archiveNodeIds.size === 0) return data;

//     // === 第二步：根据 showArchive 决定节点和边的命运 ===
//     if (showArchive) {
//       // 显示归档节点：确保它们在 add/update，不在 remove
//       archiveNodeIds.forEach((id) => {
//         const node =
//           data.add.nodes.get(id) ||
//           data.update.nodes.get(id) ||
//           data.remove.nodes.get(id);
//         if (node && data.remove.nodes.has(id)) {
//           // 从 remove 移回 update
//           data.remove.nodes.delete(id);
//           data.update.nodes.set(id, node);
//         }
//       });

//       // 同时恢复关联边（如果边本身不是归档相关，可选择性恢复）
//       // 这里我们只恢复那些两端都可见的边（简化逻辑）
//       // 实际上 G6 会在 setData 时自动处理边的可见性，所以通常不需要主动 add 边
//     } else {
//       // 隐藏归档节点：移到 remove，并强制隐藏所有关联边
//       archiveNodeIds.forEach((id) => {
//         const node =
//           data.add.nodes.get(id) ||
//           data.update.nodes.get(id) ||
//           data.remove.nodes.get(id);
//         if (node && (data.add.nodes.has(id) || data.update.nodes.has(id))) {
//           data.add.nodes.delete(id);
//           data.update.nodes.delete(id);
//           data.remove.nodes.set(id, node);
//         }

//         // 👇 关键：隐藏所有与该节点相关的边
//         const relatedEdges = model.getRelatedEdgesData(id) as any[];
//         relatedEdges.forEach((edge) => {
//           if (!edge?.id) return;
//           // 确保边被标记为 remove
//           data.add.edges.delete(edge.id);
//           data.update.edges.delete(edge.id);
//           data.remove.edges.set(edge.id, edge);
//         });
//       });
//     }

//     console.info(data);

//     return data;
//   }
// }

/**
 * 重新分配绘制任务（自实现版）
 * 将指定元素从当前所在的操作队列（add/update/remove）移动到目标操作队列，
 * 并确保它不会同时存在于多个队列中。
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
