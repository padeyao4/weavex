import { BaseTransform, DrawData } from "@antv/g6";
import { DrawContext } from "@antv/g6/lib/runtime/element";
// import { debug } from "@tauri-apps/plugin-log";

export class CustomTransform extends BaseTransform {
  public beforeDraw(data: DrawData, _context: DrawContext): DrawData {
    // debug("beforeDraw: " + JSON.stringify(data));
    // debug("context: " + JSON.stringify(this.context.graph.getComboData()));
    // const graph = this.context.graph;
    return data;
  }
}
