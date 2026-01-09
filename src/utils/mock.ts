import { PGraph } from "@/types";
import { GraphUtils } from "./graphUtils";
import { NodeUtil } from "./nodeUtils";

export class Mock {
  static data02(): PGraph {
    const graph = GraphUtils.fakerGraph();
    GraphUtils.addNode(graph, NodeUtil.createNode({ name: "A", id: "1" }));
    GraphUtils.addNode(graph, NodeUtil.createNode({ name: "B", id: "2" }));
    GraphUtils.addNode(graph, NodeUtil.createNode({ name: "C", id: "3" }));
    GraphUtils.addNode(graph, NodeUtil.createNode({ name: "D", id: "4" }));
    GraphUtils.addNode(graph, NodeUtil.createNode({ name: "E", id: "5" }));
    GraphUtils.addNode(graph, NodeUtil.createNode({ name: "F", id: "6" }));
    GraphUtils.addEdge(graph, "1", "2");
    GraphUtils.addEdge(graph, "2", "3");
    GraphUtils.addChild(graph, "4", "5");
    GraphUtils.addChild(graph, "2", "4");
    return graph;
  }
}
