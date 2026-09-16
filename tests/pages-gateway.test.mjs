import test from "node:test";
import assert from "node:assert/strict";
import { handle } from "../deploy/pages/_worker.js";

const ORIGIN = "https://yuechengai.pages.dev";
const UPSTREAM = "https://zuobiao-life-philosophy.leeyuecheng2000.chatgpt.site";
const request = (path, options = {}) => new Request(ORIGIN + path, options);
const forbiddenFetch = () => { throw new Error("Upstream must not be called"); };

test("Pages enforces visitor origin before forwarding writes", async () => {
  for (const path of ["/api/chat", "/api/trial"]) {
    for (const origin of [undefined, "null", "https://other.example"]) {
      const headers = origin ? { origin } : {};
      assert.equal((await handle(request(path, { method: "POST", headers }), {}, forbiddenFetch)).status, 403);
    }
  }
  assert.equal((await handle(request("/api/trial", { method: "DELETE", headers: { origin: ORIGIN, "sec-fetch-site": "cross-site" } }), {}, forbiddenFetch)).status, 403);
});

test("Pages forwards one trial cookie and excludes owner credentials", async () => {
  let calls = 0;
  const reply = await handle(request("/api/chat", { method: "POST", headers: {
    origin: ORIGIN, "content-type": "application/json",
    cookie: "personal=private; __Host-zuobiao-trial=mock-code; __cf_bm=private",
    authorization: "Bearer owner-secret", "oai-authenticated-user-id": "owner",
    "x-forwarded-host": "attacker.example", "x-sites-bypass": "owner-secret",
  }, body: "{}" }), {}, async (url, init) => {
    calls++;
    assert.equal(url, UPSTREAM + "/api/chat");
    assert.equal(init.headers.get("origin"), UPSTREAM);
    assert.equal(init.headers.get("cookie"), "__Host-zuobiao-trial=mock-code");
    for (const key of ["authorization", "oai-authenticated-user-id", "x-forwarded-host", "x-sites-bypass"]) assert.equal(init.headers.get(key), null);
    assert.equal(new TextDecoder().decode(init.body), "{}");
    assert.equal(init.redirect, "manual");
    assert.equal(init.signal.aborted, false);
    return Response.json({ error: "invalid schema" }, { status: 400 });
  });
  assert.equal(calls, 1);
  assert.equal(reply.status, 400);
  assert.equal(reply.headers.get("cache-control"), "no-store");
  assert.equal(reply.headers.get("access-control-allow-origin"), null);
});

test("Pages only returns host-only protected trial cookies", async () => {
  const headers = new Headers({ "content-type": "application/json" });
  headers.append("set-cookie", "__cf_bm=private; Domain=chatgpt.site; Secure");
  headers.append("set-cookie", "__Host-zuobiao-trial=bad; Domain=chatgpt.site; Secure; HttpOnly; Path=/; SameSite=Strict");
  headers.append("set-cookie", "__Host-zuobiao-trial=mock-code; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=86400");
  const reply = await handle(request("/api/trial", { method: "POST", headers: { origin: ORIGIN }, body: "{}" }), {}, async () => new Response("{}", { headers }));
  assert.equal(reply.headers.getSetCookie().length, 1);
  assert.match(reply.headers.get("set-cookie"), /mock-code/);
  assert.doesNotMatch(reply.headers.get("set-cookie"), /Domain|private/);
});

test("Pages refuses private routes, query credentials, unknown hosts and methods", async () => {
  for (const path of ["/.env", "/docs/CONTROL.md", "/api/admin", "/callback", "/signin-with-chatgpt", "/%2Fexample.com", "/_next/static/a.js.map"]) {
    assert.equal((await handle(request(path), {}, forbiddenFetch)).status, 404);
  }
  assert.equal((await handle(request("/api/chat?code=mock-code"), {}, forbiddenFetch)).status, 400);
  assert.equal((await handle(new Request("https://elsewhere.example/"), {}, forbiddenFetch)).status, 404);
  assert.equal((await handle(request("/", { method: "POST" }), {}, forbiddenFetch)).status, 405);
  assert.equal((await handle(request("/"), { PAGES_GATEWAY_ENABLED: "false" }, forbiddenFetch)).status, 503);
});

test("Pages does not retry, follow login redirects, or leak upstream errors", async () => {
  let count = 0;
  const reply = await handle(request("/api/chat"), {}, async () => { count++; throw new Error("secret upstream debug"); });
  assert.equal(count, 1);
  assert.equal(reply.status, 502);
  assert.doesNotMatch(await reply.text(), /secret|debug/);
  const redirect = await handle(request("/"), {}, async () => new Response(null, { status: 302, headers: { location: "https://chatgpt.com/auth/login" } }));
  assert.equal(redirect.status, 503);
  assert.equal(redirect.headers.get("location"), null);
  const html = await handle(request("/api/chat"), {}, async () => new Response("private error", { status: 403, headers: { "content-type": "text/html" } }));
  assert.equal(html.status, 502);
  assert.doesNotMatch(await html.text(), /private error/);
});

test("Pages preserves status and enforces actual streamed request sizes", async () => {
  for (const path of ["/knowledge/licenses/philoscopia.txt", "/knowledge/licenses/model-thinking.txt"]) {
    const reply = await handle(request(path), {}, async url => {
      assert.equal(url, UPSTREAM + path);
      return new Response("License");
    });
    assert.equal(await reply.text(), "License");
  }
  for (const status of [401, 429, 503]) {
    assert.equal((await handle(request("/api/chat"), {}, async () => Response.json({ error: "blocked" }, { status }))).status, status);
  }
  for (const [path, length] of [["/api/trial", 257], ["/api/chat", 1_000_001]]) {
    assert.equal((await handle(request(path, { method: "POST", headers: { origin: ORIGIN }, body: "x".repeat(length) }), {}, forbiddenFetch)).status, 413);
  }
  const controller = new AbortController();
  controller.abort();
  await handle(request("/", { signal: controller.signal }), {}, async (url, init) => {
    assert.equal(init.signal.aborted, true);
    return new Response("cancelled");
  });
});
