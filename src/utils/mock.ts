import { PGraph } from "@/types";
import { GraphUtils } from "./graph-util";
import { NodeUtil } from "./node-util";

export class Mock {
  static data01(): PGraph {
    const graph = GraphUtils.fakerGraph();
    GraphUtils.addNode(graph, NodeUtil.createNode({ name: "A", id: "1" }));
    GraphUtils.addNode(graph, NodeUtil.createNode({ name: "B", id: "2" }));
    GraphUtils.addNode(graph, NodeUtil.createNode({ name: "C", id: "3" }));
    GraphUtils.addNode(graph, NodeUtil.createNode({ name: "D", id: "4" }));
    GraphUtils.addEdge(graph, "1", "2");
    GraphUtils.addEdge(graph, "2", "3");
    GraphUtils.addChildWidthTravel(graph, "2", "4");
    return graph;
  }
}
