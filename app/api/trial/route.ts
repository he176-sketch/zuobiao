import { env } from "cloudflare:workers";
import { readRequestBody } from "@/lib/request-limits";
import { inviteSlot, trialStatus, TrialError, TRIAL_COOKIE, TRIAL_INVALID, TRIAL_UNAVAILABLE, type TrialEnv } from "@/lib/trial";

const response = (data: unknown, status = 200, cookie?: string) => Response.json(data, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...(cookie ? { "Set-Cookie": cookie } : {}) } });
const sameOrigin = (request: Request) => request.headers.get("origin") === new URL(request.url).origin;
export async function POST(request: Request) {
  if (!sameOrigin(request)) return response({ error: "请求来源不一致，请重新打开页面。" }, 403);
  if (!request.headers.get("content-type")?.includes("application/json")) return response({ error: "请求格式不正确。" }, 415);
  try {
    const raw = JSON.parse(await readRequestBody(request, 256));
    const code = typeof raw?.code === "string" ? raw.code.trim() : "";
    const trialEnv = env as unknown as TrialEnv;
    await inviteSlot(code, trialEnv);
    const status = await trialStatus(trialEnv);
    if (!status.ready) throw new TrialError(TRIAL_UNAVAILABLE);
    return response({ authenticated: true, remaining: status.remaining }, 200, `${TRIAL_COOKIE}=${code}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`);
  } catch (error) {
    return response({ error: error instanceof TrialError ? error.message : error instanceof SyntaxError ? TRIAL_INVALID : TRIAL_UNAVAILABLE }, error instanceof TrialError ? error.status : error instanceof SyntaxError ? 400 : 503);
  }
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return response({ error: "请求来源不一致，请重新打开页面。" }, 403);
  return response({ authenticated: false }, 200, `${TRIAL_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
}
