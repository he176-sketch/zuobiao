"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TrialAccess({ authenticated, remaining, onChange }: { authenticated: boolean; remaining: number | null; onChange: () => Promise<void> }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function update(method: "POST" | "DELETE") {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const r = await fetch("/api/trial", { method, headers: { "Content-Type": "application/json" }, ...(method === "POST" ? { body: JSON.stringify({ code: code.trim() }) } : {}), signal: AbortSignal.timeout(10_000) });
      if (!r.ok) { setError(r.status === 401 || r.status === 400 ? "邀请码无效或已撤销，请向邀请你的人核对。" : r.status === 429 ? "邀请码或本阶段的试用次数已用完。" : "对话试用暂时无法开启，请稍后再试。"); return; }
      setCode(""); await onChange();
    } catch { setError("连接未完成，请检查网络后再试。"); }
    finally { setBusy(false); }
  }
  return <section className="trial-access" aria-label="邀请码试用">
    {authenticated ? <div className="trial-status"><span>邀请码已启用 · 剩余 {remaining ?? "—"} 次</span><Button variant="ghost" disabled={busy} onClick={() => void update("DELETE")}>退出试用</Button></div> : <form onSubmit={e => { e.preventDefault(); void update("POST"); }}><label htmlFor="trial-code">有邀请码？开启对话试用</label><div className="trial-controls"><Input id="trial-code" type="password" value={code} onChange={e => setCode(e.target.value)} autoComplete="off" spellCheck={false} maxLength={32} placeholder="填写邀请人私下提供的邀请码" disabled={busy}/><Button type="submit" variant="outline" disabled={busy || !code.trim()}>{busy ? "核对中…" : "使用邀请码"}</Button></div><p>无需注册 ChatGPT。没有邀请码也能浏览与探索基座。</p></form>}
    <p className="trial-note">每份最多 10 次，本阶段合计 50 次；已发出的失败请求也占次数，不自动补充。</p>
    {error && <p role="alert">{error}</p>}
  </section>;
}
