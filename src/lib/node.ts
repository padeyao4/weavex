import { PNode } from "@/types";
import { Group } from "@antv/g";
import { Rect, RectStyleProps } from "@antv/g6";

export interface CustomNodeProps extends Required<RectStyleProps> {
  button?: {
    r: number;
    onClick: (id: string | undefined) => void;
  };
}

// 创建自定义节点，继承自 Rect
export class CustomNode extends Rect {
  // 渲染方法
  render(attributes = this.parsedAttributes, container: Group) {
    super.render(attributes, container);
    this.drawButton(attributes as CustomNodeProps, container);
  }

  get nodeData() {
    const g = this.context.graph;
    if (g.hasNode(this.id)) {
      return g.getNodeData(this.id);
    }
  }
  get data() {
    return this.nodeData?.data as PNode | undefined;
  }

  get size() {
    const size = this.getSize();
    return typeof size === "number" ? [size, size] : size;
  }

  drawButton(attributes: CustomNodeProps, container: Group) {
    // 创建和更新
    const [width, height] = this.size;

    // 创建或获取按钮组
    const buttonGroup = this.upsert(
      "button-group",
      "group",
      {},
      container,
    ) as Group;

    // 设置按钮组的位置
    buttonGroup?.setLocalPosition(width / 2 - 5, -height / 2 + 5);

    // 创建按钮背景（圆形）
    this.upsert(
      "button-background",
      "circle",
      {
        r: attributes.button?.r,
        fill: "#fff",
        stroke: "#00000080",
        lineWidth: 0.5,
        cx: 0, // 相对于组中心
        cy: 0, // 相对于组中心
        opacity: this.isHover ? 1 : 0,
      },
      buttonGroup,
    )!;

    // 图标参数
    const iconOffset = 5; // 从按钮中心到图标起点的距离
    const lineWidth = 1; // 线宽，稍微粗一点更清晰
    const iconColor = "#33333395";

    // 计算X图标的偏移量
    const xOffset = iconOffset / Math.sqrt(2);

    const isExpanded = this.data?.expanded;
    const line1Style = {
      x1: isExpanded ? -xOffset : -iconOffset,
      y1: isExpanded ? -xOffset : 0,
      x2: isExpanded ? xOffset : iconOffset,
      y2: isExpanded ? xOffset : 0,
      stroke: iconColor,
      strokeWidth: lineWidth,
      lineCap: "round" as const,
      lineJoin: "round" as const,
      id: "button-icon-line1",
      opacity: this.isHover ? 1 : 0,
    };

    const line2Style = {
      x1: isExpanded ? -xOffset : 0,
      y1: isExpanded ? xOffset : -iconOffset,
      x2: isExpanded ? xOffset : 0,
      y2: isExpanded ? -xOffset : iconOffset,
      stroke: iconColor,
      strokeWidth: lineWidth,
      lineCap: "round" as const,
      lineJoin: "round" as const,
      id: "button-icon-line2",
      opacity: this.isHover ? 1 : 0,
    };
    this.upsert("button-icon-line1", "line", line1Style, buttonGroup);
    this.upsert("button-icon-line2", "line", line2Style, buttonGroup);

    // 给整个按钮组添加点击事件
    if (!(buttonGroup as any).clickBound) {
      buttonGroup.addEventListener("click", (e: MouseEvent) => {
        e.stopPropagation();
        attributes?.button?.onClick(this.data?.id);
      });
      (buttonGroup as any).clickBound = true;
    }
  }

  get isHover() {
    const status = this.context.graph?.getElementState(this.id) || [];
    return status.includes("hover");
  }
}
