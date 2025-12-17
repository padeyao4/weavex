import { createNode, addChild, addNext } from "./node-util";
import { convert } from "./data-util";

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
  return convert(a);
}

export function mock2() {
  const a = createNode("a");
  const b = createNode("b");
  addNext(a, b);
  return convert(a);
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
  return convert(a);
}
