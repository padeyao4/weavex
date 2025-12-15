import { GraphData, EdgeData, ComboData, NodeData } from "@antv/g6";
import { PNode } from "./p-node";
import { createNode, addChild, addNext } from "./node-beans-util";
/**
 * 创建模板数据
 * @returns
 */
export function createTemplateData(): PNode {
  const nodeA = createNode();
  nodeA.column = 0;
  nodeA.title = "Node A";
  const nodeB = createNode();
  nodeB.column = 200;
  nodeB.title = "Node B";
  const nodeC = createNode();
  nodeC.column = 400;
  nodeC.title = "Node C";

  const node1 = createNode();
  node1.column = 200;
  node1.row = 0;
  node1.title = "Node 1";

  const node2 = createNode();
  node2.row = 0;
  node2.column = 300;
  node2.title = "Node 2";

  const node3 = createNode();
  node3.row = 0;
  node3.column = 300;
  node3.title = "Node 3";

  addNext(node1, node2);
  addNext(node1, node3);

  addNext(nodeA, nodeB);
  addNext(nodeB, nodeC);
  addChild(nodeB, node1);
  return nodeA;
}

export function convert(root: PNode): GraphData {
  const visited = new Set<string>(); // 防止重复访问节点
  const nodeDatas: NodeData[] = [];
  const edgeDatas: EdgeData[] = [];
  const comboDatas: ComboData[] = [];

  function dfs(node: PNode) {
    if (visited.has(node.id)) return;
    visited.add(node.id);
    if (node.children.length != 0) {
      comboDatas.push({
        id: node.id,
        combo: node.parent?.id,
      });
      for (const child of node.children) {
        dfs(child);
      }
    } else {
      nodeDatas.push({
        id: node.id,
        label: node.title,
        style: {
          x: node.column,
          y: node.row,
        },
        combo: node.parent?.id,
      });
    }
    for (const next of node.nexts) {
      edgeDatas.push({
        id: `${node.id}-${next.id}`,
        source: node.id,
        target: next.id,
      });
      dfs(next);
    }
  }

  dfs(root);

  return {
    nodes: nodeDatas,
    edges: edgeDatas,
    combos: comboDatas,
  };
}
