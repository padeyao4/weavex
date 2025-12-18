import { createNode, addChild, addNext } from "./node-util";
import { PNode } from "./p-node";

export function mock1() {
  const a = createNode();
  a.title = "Node A";
  const b = createNode();
  b.title = "Node B";
  const c = createNode();
  c.title = "Node C";
  const d = createNode("Node D");
  const e = createNode("Node E");
  const f = createNode("Node F");
  const one = createNode("Node One");
  const two = createNode("Node Two");
  const three = createNode("Node Three");
  addNext(a, b);
  addNext(a, c);
  addNext(c, d);
  addNext(b, d);
  addNext(d, e);
  addNext(f, c);
  addNext(one, two);
  addNext(one, three);
  addChild(d, one);
  return a;
}

export function mock2() {
  const a = createNode("a");
  const b = createNode("b");
  addNext(a, b);
  return a;
}

export function mock3() {
  const a = createNode("a");
  const b = createNode("b");
  const c = createNode("c");
  const d = createNode("d");
  const combo1 = createNode("combo1");

  addNext(a, combo1);
  addNext(b, c);
  addNext(combo1, d);
  addChild(combo1, b);
  return a;
}

export interface RandMockParam {
  minRank: number; // 最小层级
  maxRank: number; // 最大层级
  minDeepth: number; // 最少嵌套子图层
  maxDeepth: number; // 最大嵌套子图层
  minNext: number; // 最少后续节点
  maxNext: number; // 最大后续节点
  minPre: number; // 最少前置节点
  maxPre: number; // 最大前置节点
  minChild: number; // 最少子节点
  maxChild: number; // 最大子节点
}

/**
 * 随机创建DAG
 */
export function randomMock(param: RandMockParam): PNode {
  // todo 随机创建图
  return {} as PNode;
}
