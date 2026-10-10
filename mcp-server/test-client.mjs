// Weavex MCP server 端到端测试客户端（JSON-RPC over stdio）
// 用法：node test-client.mjs [server-path] [--mcp-stdio]
//   server-path 为 weavx.exe（主应用单 exe，加 --mcp-stdio 进入 MCP 模式）
// 通过 WEAVEX_DATA_DIR 指向测试副本，不会触碰真实数据。
import { spawn } from "node:child_process";
import { once } from "node:events";

const serverArg = process.argv[2] || "server.mjs";
const mcpStdio = process.argv.includes("--mcp-stdio");
// 支持直接 spawn 可执行文件（weavx.exe --mcp-stdio）；否则按 Node 脚本处理
const isExe = /\.exe$/i.test(serverArg);
const child = spawn(
  isExe ? serverArg : process.execPath,
  isExe ? (mcpStdio ? ["--mcp-stdio"] : []) : [serverArg],
  {
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env },
  }
);

let buf = "";
let nextId = 1;
const pending = new Map();

child.stdout.setEncoding("utf8");
child.stdout.on("data", (chunk) => {
  buf += chunk;
  let idx;
  while ((idx = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, idx).trim();
    buf = buf.slice(idx + 1);
    if (!line) continue;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      console.log("[RAW]", line);
      continue;
    }
    if (msg.id !== undefined && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    } else if (msg.method === "notifications/initialized") {
      // ignore
    } else if (msg.method && msg.method.startsWith("notifications/")) {
      // ignore
    } else {
      console.log("[SERVER->]", JSON.stringify(msg));
    }
  }
});

child.stderr.setEncoding("utf8");
child.stderr.on("data", (d) => console.log("[STDERR]", d.trim()));

function request(method, params) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, resolve);
    child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        reject(new Error(`timeout: ${method}`));
      }
    }, 10000);
  });
}

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  -> " + detail : ""}`);
}

try {
  // 1. 握手
  const init = await request("initialize", {
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: { name: "weavex-mcp-test", version: "0.1.0" },
  });
  check("initialize", init.result?.serverInfo?.name === "weavex", init.result?.serverInfo?.name + " " + init.result?.serverInfo?.version);
  await request("notifications/initialized", {});

  // 2. 工具清单
  const tools = await request("tools/list", {});
  const names = tools.result?.tools?.map((t) => t.name) ?? [];
  check("tools/list 共 19 个", names.length === 19, names.join(", "));

  // 3. 项目工具
  const graphs1 = await request("tools/call", { name: "list_graphs", arguments: {} });
  const graphList1 = JSON.parse(graphs1.result.content[0].text);
  check("list_graphs", Array.isArray(graphList1.items), `count=${graphList1.count}`);

  const targetId = graphList1.items[0]?.id;
  if (!targetId) throw new Error("测试数据中没有项目");

  const g1 = await request("tools/call", { name: "get_graph", arguments: { graphId: targetId } });
  const detail1 = JSON.parse(g1.result.content[0].text);
  check("get_graph", detail1.graph?.id === targetId, `name=${detail1.graph?.name} nodes=${detail1.nodes?.length}`);

  const cr = await request("tools/call", { name: "create_graph", arguments: { name: "MCP 测试项目" } });
  const created = JSON.parse(cr.result.content[0].text);
  const newGraphId = created.graph?.id;
  check("create_graph", !!newGraphId, `id=${newGraphId}`);

  const rn = await request("tools/call", { name: "rename_graph", arguments: { graphId: newGraphId, name: "MCP 测试项目-改名" } });
  check("rename_graph", JSON.parse(rn.result.content[0].text).ok === true);

  // 4. 节点工具
  const n1 = await request("tools/call", { name: "create_node", arguments: { graphId: newGraphId, name: "根任务A", description: "由 MCP 创建" } });
  const rootNode = JSON.parse(n1.result.content[0].text);
  const rootId = rootNode.graph?.rootNodeIds?.find((i) => rootNode.nodes?.some((n) => n.id === i));
  check("create_node(根)", !!rootId, `root=${rootId}`);

  const n2 = await request("tools/call", { name: "create_node", arguments: { graphId: newGraphId, name: "子任务B", parentId: rootId } });
  const childNode = JSON.parse(n2.result.content[0].text);
  const childId = childNode.nodes?.find((n) => n.name === "子任务B")?.id;
  check("create_node(子)", !!childId, `child=${childId}`);

  const up = await request("tools/call", { name: "update_node", arguments: { graphId: newGraphId, nodeId: childId, description: "更新过的描述" } });
  check("update_node", JSON.parse(up.result.content[0].text).ok === true);

  const gn = await request("tools/call", { name: "get_node", arguments: { graphId: newGraphId, nodeId: childId } });
  const gotNode = JSON.parse(gn.result.content[0].text);
  check("get_node", gotNode.description === "更新过的描述", `desc=${gotNode.description}`);

  const ln = await request("tools/call", { name: "list_nodes", arguments: { graphId: newGraphId } });
  check("list_nodes", JSON.parse(ln.result.content[0].text).count === 2, "count=2");

  const tc = await request("tools/call", { name: "toggle_node_completed", arguments: { graphId: newGraphId, nodeId: childId } });
  check("toggle_node_completed", JSON.parse(tc.result.content[0].text).completed === true);

  const tf = await request("tools/call", { name: "toggle_node_followed", arguments: { graphId: newGraphId, nodeId: childId } });
  check("toggle_node_followed", JSON.parse(tf.result.content[0].text).isFollowed === true);

  // 5. 边工具
  const ae = await request("tools/call", { name: "add_edge", arguments: { graphId: newGraphId, sourceId: rootId, targetId: childId } });
  check("add_edge", JSON.parse(ae.result.content[0].text).ok === true);
  const g2 = await request("tools/call", { name: "get_graph", arguments: { graphId: newGraphId } });
  check("get_graph(含边)", JSON.parse(g2.result.content[0].text).edges?.length === 1, "edges=1");

  // 6. 笔记工具
  const cn = await request("tools/call", { name: "create_note", arguments: { title: "MCP 测试笔记", content: "# 测试\n\nhello world" } });
  const note = JSON.parse(cn.result.content[0].text);
  check("create_note", !!note.id, `id=${note.id}`);

  const rn2 = await request("tools/call", { name: "read_note", arguments: { noteId: note.id } });
  const read = JSON.parse(rn2.result.content[0].text);
  check("read_note", read.content === "# 测试\n\nhello world", "content ok");

  const un = await request("tools/call", { name: "update_note", arguments: { noteId: note.id, title: "MCP 测试笔记-改", content: "# 改后" } });
  check("update_note", JSON.parse(un.result.content[0].text).ok === true);
  const rn3 = await request("tools/call", { name: "read_note", arguments: { noteId: note.id } });
  check("read_note(改后)", JSON.parse(rn3.result.content[0].text).title === "MCP 测试笔记-改", "title ok");

  const lns = await request("tools/call", { name: "list_notes", arguments: {} });
  check("list_notes", JSON.parse(lns.result.content[0].text).count >= 1, "count ok");

  const dn = await request("tools/call", { name: "delete_note", arguments: { noteId: note.id } });
  check("delete_note", JSON.parse(dn.result.content[0].text).ok === true);

  // 7. 清理测试数据
  const re = await request("tools/call", { name: "remove_edge", arguments: { graphId: newGraphId, sourceId: rootId, targetId: childId } });
  check("remove_edge", JSON.parse(re.result.content[0].text).ok === true);

  const dnode = await request("tools/call", { name: "delete_node", arguments: { graphId: newGraphId, nodeId: rootId } });
  check("delete_node(含子)", JSON.parse(dnode.result.content[0].text).deletedNodeCount === 2, "deleted=2");

  const dg = await request("tools/call", { name: "delete_graph", arguments: { graphId: newGraphId } });
  check("delete_graph", JSON.parse(dg.result.content[0].text).ok === true);

  // 8. 错误处理
  const err = await request("tools/call", { name: "get_graph", arguments: { graphId: "not-exist-id" } });
  const errText = err.result?.isError ? (err.result.content?.[0]?.text || "") : (err.error?.message || "");
  check("错误处理(不存在项目)", !!errText, errText.replace(/\n/g, " ").slice(0, 60));
} catch (e) {
  console.log("[FATAL]", e.message);
}

const failed = results.filter((r) => !r.ok).length;
console.log(`\n==== 总计 ${results.length} 项，通过 ${results.length - failed} 项，失败 ${failed} 项 ====`);
child.stdin.end();
await once(child, "exit");
process.exit(failed > 0 ? 1 : 0);
