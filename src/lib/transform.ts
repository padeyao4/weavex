import { useGraphStore } from "@/stores";
import { PNode } from "@/types";
import { BaseTransform, BaseTransformOptions, DrawData } from "@antv/g6";
import { DrawContext } from "@antv/g6/lib/runtime/element";

interface CustomTransformProps extends BaseTransformOptions {
  graphId: string;
}

export class CustomTransform extends BaseTransform<CustomTransformProps> {
  public beforeDraw(data: DrawData, _context: DrawContext): DrawData {
    // const graphStore = useGraphStore();
    // const graph = graphStore.getGraph(this.options.graphId);
    // console.info(this.options);
    // console.info("custom draw");
    // console.info(data);
    return data;
  }
}

/**
 * 用于判断是否显示扩展和折叠
 */
export class ExpandedTransform extends BaseTransform<CustomTransformProps> {
  public beforeDraw(data: DrawData, _context: DrawContext): DrawData {
    const graphStore = useGraphStore();
    const graph = graphStore.getGraph(this.options.graphId);
    // todo
    return data;
  }
}

/**
 * 用于判断是否显示归档
 */
export class ArchiveTransform extends BaseTransform<CustomTransformProps> {
  public beforeDraw(data: DrawData, _context: DrawContext): DrawData {
    const graphStore = useGraphStore();
    const graph = graphStore.getGraph(this.options.graphId);

    const allNodes = graph.nodes;
    const nodes = this.context.model.getNodeData(Object.keys(allNodes));
    const { add, update, remove } = data;

    nodes
      .filter((node) => {
        return !add.nodes.has(node.id) && !update.nodes.has(node.id);
      })
      .forEach((node) => {
        add.nodes.set(node.id, node);
      });

    if (!graph.showArchive) {
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
          update.nodes.delete(node.id);
          remove.nodes.set(node.id, node);
        }
      });
    }
    return data;
  }
}
