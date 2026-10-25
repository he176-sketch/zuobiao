const HOSTS = new Set(["yuechengai.pages.dev", "example.com", "www.example.com"]);
const TRIAL_COOKIE = "__Host-zuobiao-trial";
const PUBLIC_FILES = new Set(["/favicon.svg", "/knowledge/thinking-tools.json", "/knowledge/philosophy-lenses.json", "/knowledge/licenses/philoscopia.txt", "/knowledge/licenses/model-thinking.txt"]);
const failure = (error, status) => Response.json({ error }, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });

export function createPagesHandler(application) {
  return {
    async fetch(request, env, ctx) {
      const url = new URL(request.url);
      if (!HOSTS.has(url.hostname) && !/^[a-z0-9-]+\.yuechengai\.pages\.dev$/.test(url.hostname)) return failure("网址未配置。", 404);
      if (env.SITE_PUBLIC_ENABLED === "false") return failure("网站暂未开放。", 503);
      if (/%|\\|\/\//.test(url.pathname)) return failure("页面不存在。", 404);
      const asset = PUBLIC_FILES.has(url.pathname) || /^\/_next\/static\/[a-zA-Z0-9_./-]+\.(?:js|css|woff2?|ttf|svg|png|webp)$/.test(url.pathname);
      const methods = asset || url.pathname === "/" ? ["GET", "HEAD"] : url.pathname === "/api/chat" ? ["GET", "POST"] : url.pathname === "/api/trial" ? ["POST", "DELETE"] : [];
      if (!methods.length) return failure("页面不存在。", 404);
      if (!methods.includes(request.method)) return failure("请求方式不支持。", 405);
      const api = url.pathname.startsWith("/api/");
      if (api && url.search) return failure("请在页面中填写邀请码。", 400);
      if (["POST", "DELETE"].includes(request.method) && (request.headers.get("origin") !== url.origin || request.headers.get("sec-fetch-site") === "cross-site")) return failure("请求来源不一致，请重新打开页面。", 403);
      const headers = new Headers(request.headers);
      for (const name of [...headers.keys()]) {
        if (name.startsWith("oai-") || name.startsWith("x-forwarded-") || ["authorization", "cookie"].includes(name)) headers.delete(name);
      }
      if (api) {
        const cookies = (request.headers.get("cookie") || "").split(";").map(value => value.trim()).filter(value => value.startsWith(`${TRIAL_COOKIE}=`));
        if (cookies.length === 1) headers.set("cookie", cookies[0]);
      }
      const cleanRequest = new Request(request, { headers });
      // Both handlers run in this Pages deployment. No remote website proxy.
      let response;
      try { response = asset ? await env.ASSETS.fetch(cleanRequest) : await application.fetch(cleanRequest, env, ctx); }
      catch { return failure("网站暂时未能完成请求，请稍后重试。", 503); }
      const output = new Headers(response.headers);
      if (!asset) output.set("Cache-Control", "no-store");
      output.set("X-Content-Type-Options", "nosniff");
      output.set("Referrer-Policy", "strict-origin-when-cross-origin");
      return new Response(response.body, { status: response.status, headers: output });
    },
  };
}
