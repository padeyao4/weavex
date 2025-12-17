import { test, describe, expect } from "vitest";
import dagre from "@dagrejs/dagre";

describe("dagre", () => {
  test("should work", () => {
    expect(true).toBe(true);
  });
  test("simple", () => {
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: "LR" });
    g.setDefaultEdgeLabel(() => ({}));
    g.setNode("a", { width: 100, height: 50 });
    g.setNode("b", { width: 100, height: 50 });
    g.setNode("c", { width: 100, height: 50 });
    g.setNode("d", { width: 100, height: 50 });
    g.setNode("e", { width: 100, height: 50 });
    g.setNode("f", { width: 100, height: 50 });
    g.setEdge("a", "b");
    g.setEdge("b", "c");
    g.setEdge("c", "d");
    g.setEdge("d", "e");
    g.setEdge("e", "f");
    dagre.layout(g);
    expect(g.node("a").x).toBeLessThan(g.node("b").x);
    expect(g.node("b").x).toBeLessThan(g.node("c").x);
    expect(g.node("c").x).toBeLessThan(g.node("d").x);
    expect(g.node("d").x).toBeLessThan(g.node("e").x);
    expect(g.node("e").x).toBeLessThan(g.node("f").x);
  });
  test("compound", () => {
    const g = new dagre.graphlib.Graph({ compound: true });
    g.setGraph({ rankdir: "LR" });
    g.setDefaultEdgeLabel(() => ({}));
    g.setNode("a", { width: 100, height: 50 });
    g.setNode("b", { width: 100, height: 50 });
    g.setNode("c", { width: 100, height: 50 });
    g.setNode("d", { width: 100, height: 50 });
    g.setNode("group1", { label: "Group 1" });
    g.setParent("b", "group1");
    g.setParent("c", "group1");
    g.setEdge("b", "c");
    g.setEdge("c", "d");
    g.setEdge("a", "c");
    dagre.layout(g);
    const json = dagre.graphlib.json.write(g);
    expect(json).toBeDefined();
    console.log(json);
    expect(g.parent("b")).toBe("group1");
    expect(g.parent("c")).toBe("group1");
  });
});
