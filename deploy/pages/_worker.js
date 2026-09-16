// Pages serves the existing application through a fixed, public Sites origin.
// No owner credentials, model keys, invitation values, or conversation logs here.
const UPSTREAM = "https://zuobiao-life-philosophy.leeyuecheng2000.chatgpt.site";
const TRIAL_COOKIE = "__Host-zuobiao-trial";
const HOSTS = new Set(["yuechengai.pages.dev", "aiyuecheng.cn", "www.aiyuecheng.cn"]);
const READ_HEADERS = ["accept", "accept-language", "rsc", "next-router-state-tree", "next-router-prefetch", "next-router-segment-prefetch", "next-url", "x-vinext-interception-context", "x-vinext-mounted-slots", "x-vinext-rsc-render-mode"];
const RESPONSE_HEADERS = ["content-type", "content-encoding", "content-language", "vary"];

function fail(message, status) {
  return Response.json({ error: message }, { status, headers: {
    "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff",
  } });
}

function allowedPath(path) {
  return ["/", "/api/chat", "/api/trial", "/favicon.svg", "/knowledge/thinking-tools.json", "/knowledge/philosophy-lenses.json", "/knowledge/licenses/philoscopia.txt", "/knowledge/licenses/model-thinking.txt"].includes(path)
    || /^\/_next\/static\/[a-zA-Z0-9_./-]+\.(?:js|css|woff2?|ttf|svg|png|webp)$/.test(path);
}

async function boundedBody(request, limit) {
  if (Number(request.headers.get("content-length")) > limit) throw new Error("large");
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new Error("large"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  return body;
}

export async function handle(request, env = {}, upstreamFetch = fetch) {
  const url = new URL(request.url);
  if (!HOSTS.has(url.hostname) && !/^[a-z0-9-]+\.yuechengai\.pages\.dev$/.test(url.hostname)) {
    return fail("网址未配置。", 404);
  }
  if (env.PAGES_GATEWAY_ENABLED === "false") return fail("网站暂未开放。", 503);
  if (url.protocol !== "https:" || !allowedPath(url.pathname) || /%|\\|\/\//.test(url.pathname)) {
    return fail("页面不存在。", 404);
  }
  const api = url.pathname.startsWith("/api/");
  const write = request.method === "POST" || request.method === "DELETE";
  const methods = url.pathname === "/api/trial" ? ["POST", "DELETE"]
    : url.pathname === "/api/chat" ? ["GET", "POST"] : ["GET", "HEAD"];
  if (!methods.includes(request.method)) return fail("请求方式不支持。", 405);
  if (api && url.search) return fail("请在页面中填写邀请码。", 400);
  // Check the visitor's origin before rewriting it for the upstream service.
  if (write && (request.headers.get("origin") !== url.origin
    || request.headers.get("sec-fetch-site") === "cross-site")) {
    return fail("请求来源不一致，请重新打开页面。", 403);
  }

  const target = new URL(UPSTREAM);
  target.pathname = url.pathname;
  target.search = url.search;
  const headers = new Headers();
  for (const name of READ_HEADERS) {
    const value = request.headers.get(name);
    if (value !== null) headers.set(name, value);
  }
  if (api) {
    const cookies = (request.headers.get("cookie") || "").split(";")
      .map(value => value.trim()).filter(value => value.startsWith(`${TRIAL_COOKIE}=`));
    if (cookies.length === 1) headers.set("cookie", cookies[0]);
  }
  let body;
  if (write) {
    headers.set("origin", UPSTREAM);
    headers.set("sec-fetch-site", "same-origin");
    const contentType = request.headers.get("content-type");
    if (contentType) headers.set("content-type", contentType);
    try { body = await boundedBody(request, url.pathname === "/api/trial" ? 256 : 1_000_000); }
    catch { return fail("请求内容过长或无法读取。", 413); }
  }

  let result;
  try {
    result = await upstreamFetch(target.href, {
      method: request.method, headers, body, redirect: "manual",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(105_000)]),
      cf: { cacheTtl: 0, cacheEverything: false },
    });
  } catch {
    // Do not retry a potentially billed request, or expose upstream diagnostics.
    return fail("网站连接暂时中断，请稍后重试。", 502);
  }
  // This product has no redirects. A login/access redirect must fail closed.
  if (result.status >= 300 && result.status < 400) {
    await result.body?.cancel();
    return fail("网站暂未开放。", 503);
  }
  if (api && !(result.headers.get("content-type") || "").includes("application/json")) {
    await result.body?.cancel();
    return fail("对话服务暂时不可用。", 502);
  }
  const output = new Headers({
    "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  });
  for (const name of RESPONSE_HEADERS) {
    const value = result.headers.get(name);
    if (value !== null) output.set(name, value);
  }
  // Never transfer Sites authentication/bot cookies into the old personal site.
  for (const cookie of result.headers.getSetCookie()) {
    if (api && cookie.startsWith(`${TRIAL_COOKIE}=`) && !/;\s*domain\s*=/i.test(cookie)
      && /;\s*Secure(?:;|$)/i.test(cookie) && /;\s*HttpOnly(?:;|$)/i.test(cookie)
      && /;\s*Path=\/(?:;|$)/i.test(cookie) && /;\s*SameSite=Strict(?:;|$)/i.test(cookie)) {
      output.append("Set-Cookie", cookie);
    }
  }
  return new Response(request.method === "HEAD" ? null : result.body, {
    status: result.status, headers: output,
  });
}

const worker = { fetch(request, env) { return handle(request, env); } };
export default worker;
