// Weavex MCP HTTP 模式回归测试（供豆包等 HTTP 客户端使用）
// 用法：先 `node server.mjs --http`，再 `node http-test.mjs`
const BASE = process.env.WEAVEX_MCP_URL || "http://127.0.0.1:8912/mcp";
let sessionId = null;

async function post(body, { needResponse = true } = {}) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };
  if (sessionId) headers["mcp-session-id"] = sessionId;
  const res = await fetch(BASE, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const sid = res.headers.get("mcp-session-id");
  if (sid && !sessionId) sessionId = sid;
  if (!needResponse) return null;
  const text = await res.text();
  if (!text) return null;
  // 服务器可能返回 SSE 流（event: message / data: {...}），也可能直接返回 JSON
  if (text.includes("\ndata: ") || text.startsWith("data: ")) {
    const dataLine = text.split("\n").find((l) => l.startsWith("data: "));
    return dataLine ? JSON.parse(dataLine.slice(6)) : null;
  }
  return JSON.parse(text);
}

/** 模拟豆包连接器的请求：只声明 application/json，不带 text/event-stream（真实豆包行为） */
async function postLikeDoubao(body, { freshSession = false } = {}) {
  const headers = { "Content-Type": "application/json", Accept: "application/json" };
  if (sessionId && !freshSession) headers["mcp-session-id"] = sessionId;
  const res = await fetch(BASE, { method: "POST", headers, body: JSON.stringify(body) });
  return { status: res.status, body: JSON.parse(await res.text()) };
}

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  -> " + detail : ""}`);
}

try {
  const init = await post({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-03-26",
      capabilities: {},
      clientInfo: { name: "weavex-http-test", version: "0.1.0" },
    },
  });
  check("initialize", init?.result?.serverInfo?.name === "weavex", init?.result?.serverInfo?.name + " " + init?.result?.serverInfo?.version);

  await post({ jsonrpc: "2.0", method: "notifications/initialized" }, { needResponse: false });

  const tools = await post({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
  check("tools/list 共 19 个", (tools?.result?.tools?.length ?? 0) === 19, `count=${tools?.result?.tools?.length}`);

  const graphs = await post({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: { name: "list_graphs", arguments: {} },
  });
  const parsed = JSON.parse(graphs?.result?.content?.[0]?.text || "{}");
  check("tools/call list_graphs", Array.isArray(parsed.items), `count=${parsed.count}`);

  const bad = await post({
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: { name: "get_graph", arguments: { graphId: "not-exist" } },
  });
  const badText = bad?.result?.isError ? (bad.result.content?.[0]?.text || "") : (bad?.error?.message || "");
  check("错误处理(不存在项目)", !!badText, badText.replace(/\n/g, " ").slice(0, 50));

  // 豆包式兼容：只声明 application/json 的请求应被宽容接受（而非 406）
  // initialize 用独立新会话（协议不允许同一会话重复 initialize）
  const dbInit = await postLikeDoubao({
    jsonrpc: "2.0",
    id: 5,
    method: "initialize",
    params: {
      protocolVersion: "2025-03-26",
      capabilities: {},
      clientInfo: { name: "doubao-like", version: "0.0.1" },
    },
  }, { freshSession: true });
  check("豆包式 Accept(仅json) initialize", dbInit.status === 200 && dbInit.body?.result?.serverInfo?.name === "weavex", `status=${dbInit.status}`);
  const dbTools = await postLikeDoubao({ jsonrpc: "2.0", id: 6, method: "tools/list", params: {} });
  check("豆包式 Accept(仅json) tools/list", dbTools.status === 200 && (dbTools.body?.result?.tools?.length ?? 0) === 19, `tools=${dbTools.body?.result?.tools?.length}`);
} catch (e) {
  console.log("[FATAL]", e.message);
}

const failed = results.filter((r) => !r.ok).length;
console.log(`\n==== HTTP 模式：${results.length} 项，通过 ${results.length - failed} 项，失败 ${failed} 项 ====`);
process.exit(failed > 0 ? 1 : 0);
