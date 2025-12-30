import { Group, DisplayObject, Rect, RectStyleProps } from "@antv/g";
import {
  BaseCombo,
  BaseComboStyleProps,
  RectComboStyleProps,
  subStyleProps,
} from "@antv/g6";

// 自定义 Combo，继承 BaseCombo
export class CustomCombo extends BaseCombo {
  protected drawKeyShape(
    attributes: Required<BaseComboStyleProps>,
    container: Group,
  ): DisplayObject | undefined {
    return this.upsert("key", Rect, this.getKeyStyle(attributes), container);
  }

  protected getKeyStyle(
    attributes: Required<RectComboStyleProps>,
  ): RectStyleProps {
    const children = attributes.childrenData;
    const headNode = children[0];
    const tailNode = children[children.length - 1];
    const hSize = headNode.style?.size || [0, 0];
    const tSize = tailNode.style?.size || [0, 0];

    const hWidth = typeof hSize === "number" ? hSize : hSize[0];
    const tWidth = typeof tSize === "number" ? tSize : tSize[0];

    const keyStyle = super.getKeyStyle(attributes);
    const [width, height] = this.getKeySize(attributes);
    const padding = attributes.padding || [0, 0, 0, 0];
    const [left, right, _top, _bottom] =
      typeof padding === "number"
        ? [padding, padding, padding, padding]
        : padding;
    return {
      ...keyStyle,
      ...(attributes.collapsed && subStyleProps(keyStyle, "collapsed")),
      width: width - left - right - hWidth / 2 - tWidth / 2,
      height,
      x: -width / 2 + (left + right) / 2 + hWidth / 4 + tWidth / 4,
      y: -height / 2,
    };
  }
}
