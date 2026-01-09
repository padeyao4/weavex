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

    // 按钮位置和大小
    const buttonSize = 10; // 按钮直径
    const buttonX = width / 2 - 5; // 按钮中心X坐标
    const buttonY = -height / 2 + 5; // 按钮中心Y坐标

    // 创建按钮组
    const buttonGroup = this.upsert(
      "button-group",
      "group",
      {},
      container,
    ) as Group;

    // 设置按钮组的位置
    buttonGroup.setLocalPosition(buttonX, buttonY);

    // 创建按钮背景（圆形）
    const btnStyle = {
      r: buttonSize / 2,
      fill: node.expanded ? "#fff" : "#00000080",
      stroke: "#00000080",
      lineWidth: 0.5,
      cx: 0, // 相对于组中心
      cy: 0, // 相对于组中心
    };

    const btnBackground = this.upsert(
      "button-background",
      "circle",
      btnStyle,
      buttonGroup,
    )!;

    // 绘制X图标
    // X图标在按钮内的偏移量
    const iconOffset = 3; // 从按钮中心到图标起点的距离
    const lineWidth = 1.2; // 线宽，稍微粗一点更清晰

    // 第一条线：从左上到右下
    const line1Style = {
      x1: -iconOffset,
      y1: -iconOffset,
      x2: iconOffset,
      y2: iconOffset,
      stroke: node.expanded ? "#333" : "#fff",
      strokeWidth: lineWidth,
      lineCap: "square" as const,
      lineJoin: "round" as const,
    };

    // 第二条线：从左下到右上
    const line2Style = {
      x1: -iconOffset,
      y1: iconOffset,
      x2: iconOffset,
      y2: -iconOffset,
      stroke: node.expanded ? "#333" : "#fff",
      strokeWidth: lineWidth,
      lineCap: "square" as const,
      lineJoin: "round" as const,
    };

    // 创建X图标的两条线
    this.upsert("button-line1", "line", line1Style, buttonGroup);
    this.upsert("button-line2", "line", line2Style, buttonGroup);

    // 给整个按钮组添加点击事件
    if (!(buttonGroup as any).clickBound) {
      buttonGroup.addEventListener("click", (e: MouseEvent) => {
        e.stopPropagation();
        if (this.graphStatusStore.playing) {
          return;
        }
        this.currentGraphStore.toggleNodeExpanded(node.id);
        this.renderGraph();
      });

      // 添加鼠标悬停效果
      buttonGroup.addEventListener("mouseenter", () => {
        btnBackground.attr("fill", node.expanded ? "#f0f0f0" : "#000000b0");
      });

      buttonGroup.addEventListener("mouseleave", () => {
        btnBackground.attr("fill", node.expanded ? "#fff" : "#00000080");
      });

      (buttonGroup as any).clickBound = true;
    }
  }
}
