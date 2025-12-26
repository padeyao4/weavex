import { PGraph } from "@/types";
import { GraphUtils } from "./graph-util";
import { NodeUtil } from "./node-util";

export class Mock {
  static data01(): PGraph {
    const graph = GraphUtils.fakerGraph();
    GraphUtils.addNode(graph, NodeUtil.createNode({ name: "A", id: "1" }));
    GraphUtils.addNode(graph, NodeUtil.createNode({ name: "A", id: "2" }));
    GraphUtils.addNode(graph, NodeUtil.createNode({ name: "A", id: "3" }));
    GraphUtils.addEdge(graph, "1", "2");
    GraphUtils.addEdge(graph, "2", "3");
    return graph;
  }
}
