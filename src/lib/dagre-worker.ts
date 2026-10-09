import { computeLayout, LayoutOptions, SlimNode } from "./layout-core";

/** dagre 布局 Web Worker：大图计算放后台线程，避免阻塞主线程渲染 */
const ctx = self as unknown as Worker;
ctx.onmessage = (e: MessageEvent) => {
  const { slimNodes, options } = e.data as {
    slimNodes: SlimNode[];
    options?: LayoutOptions;
  };
  const result = computeLayout(slimNodes, options);
  ctx.postMessage(result);
};
