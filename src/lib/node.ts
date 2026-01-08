import { useCurrentGraphStore, useGraphStatusStore } from "@/stores";
import { PNode } from "@/types";
import { Group } from "@antv/g";
import { Rect, RectStyleProps } from "@antv/g6";

// 创建自定义节点，继承自 Rect
export class CustomNode extends Rect {
  currentGraphStore = useCurrentGraphStore();
  graphStatusStore = useGraphStatusStore();

  renderGraph() {
    this.context.graph.setData(this.currentGraphStore.graphData);
    this.context.graph.render();
  }

  // 渲染方法
  render(
    attributes: Required<RectStyleProps> = this.parsedAttributes,
    container: Group,
  ) {
    super.render(attributes, container);
    this.drawButton(attributes, container);
  }

  get nodeData() {
    return this.context.graph.getNodeData(this.id);
  }

  drawButton(attributes: Required<RectStyleProps>, container: Group) {
    const size = attributes.size;
    const [width, height] = typeof size === "number" ? [size, size] : size;
    const node = this.nodeData.data as unknown as PNode;
    const style = {
      r: 5,
      fill: node.expanded ? "#fff" : "#00000080", // todo 待美化
      stroke: "#00000080",
      lineWidth: 0.5,
      cx: width / 2 - 5,
      cy: -height / 2 + 5,
    };
    const btn = this.upsert("button", "circle", style, container)!;
    if (!(btn as any).clickBound) {
      btn.addEventListener("click", (e: MouseEvent) => {
        e.stopPropagation();
        if (this.graphStatusStore.playing) {
          return;
        }
        this.currentGraphStore.toggleNodeExpanded(node.id);
        this.renderGraph();
      });
      (btn as any).clickBound = true;
    }
  }
}
