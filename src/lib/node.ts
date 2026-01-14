import { PNode } from "@/types";
import { Group } from "@antv/g";
import { Rect, RectStyleProps } from "@antv/g6";

export interface CustomNodeProps extends Required<RectStyleProps> {
  showExpandedButton: boolean;
  countChildren: number;
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
        interactive: attributes.countChildren !== 0,
        visibility: attributes.countChildren !== 0 ? "visible" : "hidden",
        cursor: attributes.countChildren !== 0 ? "pointer" : "default",
      },
      buttonGroup,
    )!;

    this.upsert(
      "counter",
      "text",
      {
        text: `${attributes.countChildren}`,
        fontSize: 12,
        fill: "#33333380",
        x: 0,
        y: 0,
        textAlign: "center",
        textBaseline: "middle",
        interactive: attributes.countChildren !== 0,
        visibility: attributes.countChildren !== 0 ? "visible" : "hidden",
        cursor: attributes.countChildren !== 0 ? "pointer" : "default",
      },
      buttonGroup,
    );

    // 给整个按钮组添加点击事件
    if (!(buttonGroup as any).clickBound) {
      buttonGroup.addEventListener("click", (e: MouseEvent) => {
        e.stopPropagation();
        attributes?.button?.onClick(this.data?.id);
      });
      (buttonGroup as any).clickBound = true;
    }
  }
}
