import { createNode, addChildWithRaletion, addNext } from "./node-util";
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
  addChildWithRaletion(d, one);
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
  addChildWithRaletion(combo1, b);
  return a;
}

export function generateRandomCompuDAG() {
  return null;
}
