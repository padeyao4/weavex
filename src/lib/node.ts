import { useCurrentGraphStore, useGraphStatusStore } from "@/stores";
import { PNode } from "@/types";
import { Group } from "@antv/g";
import { Rect, RectStyleProps } from "@antv/g6";
import { debug } from "@tauri-apps/plugin-log";

// 创建自定义节点，继承自 Rect
export class CustomNode extends Rect {
  currentGraphStore = useCurrentGraphStore();
  graphStatusStore = useGraphStatusStore();
  private buttonGroup: Group | null = null;

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
    const status = this.context.graph?.getElementState(this.id) || [];
    const isHover = status.includes("hover");

    // 调试日志
    debug(
      `Node ${this.id}: hover=${isHover}, states=${JSON.stringify(status)}`,
    );

    if (isHover) {
      // 创建和更新
      const size = attributes.size;
      const [width, height] = typeof size === "number" ? [size, size] : size;
      const node = this.nodeData.data as unknown as PNode;

      // 按钮位置和大小
      const buttonSize = 20; // 按钮直径
      const buttonX = width / 2 - 5; // 按钮中心X坐标
      const buttonY = -height / 2 + 5; // 按钮中心Y坐标

      // 创建或获取按钮组
      this.buttonGroup = this.upsert(
        "button-group",
        "group",
        {},
        container,
      ) as Group;

      // 设置按钮组的位置
      this.buttonGroup?.setLocalPosition(buttonX, buttonY);

      // 创建按钮背景（圆形）
      const btnStyle = {
        r: buttonSize / 2,
        fill: "#fff",
        stroke: "#00000080",
        lineWidth: 0.5,
        cx: 0, // 相对于组中心
        cy: 0, // 相对于组中心
      };

      this.upsert("button-background", "circle", btnStyle, this.buttonGroup)!;

      // 图标参数
      const iconOffset = 3; // 从按钮中心到图标起点的距离
      const lineWidth = 1; // 线宽，稍微粗一点更清晰
      const iconColor = "#33333395";

      // 计算X图标的偏移量
      const xOffset = iconOffset / Math.sqrt(2);

      // 移除旧的图标元素
      const oldLine1 = this.buttonGroup.getElementById("button-icon-line1");
      const oldLine2 = this.buttonGroup.getElementById("button-icon-line2");
      if (oldLine1) oldLine1.remove();
      if (oldLine2) oldLine2.remove();

      if (node.expanded) {
        // 节点展开时：显示X图标（关闭图标）
        const line1Style = {
          x1: -xOffset,
          y1: -xOffset,
          x2: xOffset,
          y2: xOffset,
          stroke: iconColor,
          strokeWidth: lineWidth,
          lineCap: "round" as const,
          lineJoin: "round" as const,
          id: "button-icon-line1",
        };

        const line2Style = {
          x1: -xOffset,
          y1: xOffset,
          x2: xOffset,
          y2: -xOffset,
          stroke: iconColor,
          strokeWidth: lineWidth,
          lineCap: "round" as const,
          lineJoin: "round" as const,
          id: "button-icon-line2",
        };

        this.upsert("button-icon-line1", "line", line1Style, this.buttonGroup);
        this.upsert("button-icon-line2", "line", line2Style, this.buttonGroup);
      } else {
        // 节点收起时：显示+图标（展开图标）
        const horizontalLineStyle = {
          x1: -iconOffset,
          y1: 0,
          x2: iconOffset,
          y2: 0,
          stroke: iconColor,
          strokeWidth: lineWidth,
          lineCap: "round" as const,
          lineJoin: "round" as const,
          id: "button-icon-line1",
        };

        const verticalLineStyle = {
          x1: 0,
          y1: -iconOffset,
          x2: 0,
          y2: iconOffset,
          stroke: iconColor,
          strokeWidth: lineWidth,
          lineCap: "round" as const,
          lineJoin: "round" as const,
          id: "button-icon-line2",
        };

        this.upsert(
          "button-icon-line1",
          "line",
          horizontalLineStyle,
          this.buttonGroup,
        );
        this.upsert(
          "button-icon-line2",
          "line",
          verticalLineStyle,
          this.buttonGroup,
        );
      }

      // 给整个按钮组添加点击事件
      if (!(this.buttonGroup as any).clickBound) {
        this.buttonGroup.addEventListener("click", (e: MouseEvent) => {
          e.stopPropagation();
          if (this.graphStatusStore.playing) {
            return;
          }
          this.currentGraphStore.toggleNodeExpanded(node.id);
          this.renderGraph();
        });

        (this.buttonGroup as any).clickBound = true;
      }
    } else {
      // 删除
      const buttonGroup = this.upsert("button-group", "group", {}, container);
      buttonGroup?.removeChildren();
    }

    // const size = attributes.size;
    // const [width, height] = typeof size === "number" ? [size, size] : size;
    // const node = this.nodeData.data as unknown as PNode;

    // // 按钮位置和大小
    // const buttonSize = 20; // 按钮直径
    // const buttonX = width / 2 - 5; // 按钮中心X坐标
    // const buttonY = -height / 2 + 5; // 按钮中心Y坐标

    // // 创建或获取按钮组
    // this.buttonGroup = this.upsert(
    //   "button-group",
    //   "group",
    //   isHover ? {} : false,
    //   container,
    // ) as Group;

    // // 设置按钮组的位置
    // this.buttonGroup?.setLocalPosition(buttonX, buttonY);

    // // 创建按钮背景（圆形）
    // const btnStyle = {
    //   r: buttonSize / 2,
    //   fill: "#fff",
    //   stroke: "#00000080",
    //   lineWidth: 0.5,
    //   cx: 0, // 相对于组中心
    //   cy: 0, // 相对于组中心
    // };

    // this.upsert("button-background", "circle", btnStyle, this.buttonGroup)!;

    // // 图标参数
    // const iconOffset = 3; // 从按钮中心到图标起点的距离
    // const lineWidth = 1; // 线宽，稍微粗一点更清晰
    // const iconColor = "#33333395";

    // // 计算X图标的偏移量
    // const xOffset = iconOffset / Math.sqrt(2);

    // // 移除旧的图标元素
    // const oldLine1 = this.buttonGroup.getElementById("button-icon-line1");
    // const oldLine2 = this.buttonGroup.getElementById("button-icon-line2");
    // if (oldLine1) oldLine1.remove();
    // if (oldLine2) oldLine2.remove();

    // if (node.expanded) {
    //   // 节点展开时：显示X图标（关闭图标）
    //   const line1Style = {
    //     x1: -xOffset,
    //     y1: -xOffset,
    //     x2: xOffset,
    //     y2: xOffset,
    //     stroke: iconColor,
    //     strokeWidth: lineWidth,
    //     lineCap: "round" as const,
    //     lineJoin: "round" as const,
    //     id: "button-icon-line1",
    //   };

    //   const line2Style = {
    //     x1: -xOffset,
    //     y1: xOffset,
    //     x2: xOffset,
    //     y2: -xOffset,
    //     stroke: iconColor,
    //     strokeWidth: lineWidth,
    //     lineCap: "round" as const,
    //     lineJoin: "round" as const,
    //     id: "button-icon-line2",
    //   };

    //   this.upsert("button-icon-line1", "line", line1Style, this.buttonGroup);
    //   this.upsert("button-icon-line2", "line", line2Style, this.buttonGroup);
    // } else {
    //   // 节点收起时：显示+图标（展开图标）
    //   const horizontalLineStyle = {
    //     x1: -iconOffset,
    //     y1: 0,
    //     x2: iconOffset,
    //     y2: 0,
    //     stroke: iconColor,
    //     strokeWidth: lineWidth,
    //     lineCap: "round" as const,
    //     lineJoin: "round" as const,
    //     id: "button-icon-line1",
    //   };

    //   const verticalLineStyle = {
    //     x1: 0,
    //     y1: -iconOffset,
    //     x2: 0,
    //     y2: iconOffset,
    //     stroke: iconColor,
    //     strokeWidth: lineWidth,
    //     lineCap: "round" as const,
    //     lineJoin: "round" as const,
    //     id: "button-icon-line2",
    //   };

    //   this.upsert(
    //     "button-icon-line1",
    //     "line",
    //     horizontalLineStyle,
    //     this.buttonGroup,
    //   );
    //   this.upsert(
    //     "button-icon-line2",
    //     "line",
    //     verticalLineStyle,
    //     this.buttonGroup,
    //   );
    // }

    // // 给整个按钮组添加点击事件
    // if (!(this.buttonGroup as any).clickBound) {
    //   this.buttonGroup.addEventListener("click", (e: MouseEvent) => {
    //     e.stopPropagation();
    //     if (this.graphStatusStore.playing) {
    //       return;
    //     }
    //     this.currentGraphStore.toggleNodeExpanded(node.id);
    //     this.renderGraph();
    //   });

    //   (this.buttonGroup as any).clickBound = true;
    // }
  }
}
