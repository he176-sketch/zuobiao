// No identities, conversations, IP addresses or raw invite codes in the database.
export const TRIAL_ID = "first-50"; // Historical row ID; no lifetime cap remains.
export const TRIAL_COOKIE = "__Host-zuobiao-trial";
export const TRIAL_CLOSED = "对话试用尚未开放。可以先浏览十二个基座。";
export const TRIAL_INVALID = "请填写有效的邀请码；无效或已撤销的邀请码无法使用。";
export const TRIAL_BUSY = "刚才的问题有点密集，请稍等十秒再继续。";
export const TRIAL_UNAVAILABLE = "试用服务暂时无法核实，对话已暂停，请稍后再试。";
export type TrialEnv = { TRIAL_ENABLED?: string; TRIAL_INVITE_HASHES?: string; DB?: D1Database };
type Budget = { total: number; [key: string]: number | string };

export class TrialError extends Error {
  status: number;
  constructor(message: string, status = 503) { super(message); this.status = status; }
}

export function inviteHashes(env: TrialEnv): (string | null)[] {
  if (env.TRIAL_ENABLED !== "true") throw new TrialError(TRIAL_CLOSED);
  let hashes: unknown;
  try { hashes = JSON.parse(env.TRIAL_INVITE_HASHES || ""); } catch { throw new TrialError(TRIAL_CLOSED); }
  if (!Array.isArray(hashes) || hashes.length !== 5 || !hashes.every(h => h === null || typeof h === "string" && /^[a-f0-9]{64}$/.test(h))) throw new TrialError(TRIAL_CLOSED);
  if (new Set(hashes.filter(Boolean)).size !== hashes.filter(Boolean).length) throw new TrialError(TRIAL_CLOSED);
  return hashes;
}

export function inviteFromRequest(request: Request): string {
  const cookies = (request.headers.get("cookie") || "").split(";").map(x => x.trim()).filter(x => x.startsWith(`${TRIAL_COOKIE}=`));
  return cookies.length === 1 ? cookies[0].slice(TRIAL_COOKIE.length + 1) : "";
}

export async function inviteSlot(code: string, env: TrialEnv): Promise<number> {
  const hashes = inviteHashes(env);
  if (!/^[A-Za-z0-9_-]{4,32}$/.test(code)) throw new TrialError(TRIAL_INVALID, 401);
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(code));
  const hash = Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, "0")).join("");
  const index = hashes.indexOf(hash);
  if (index < 0) throw new TrialError(TRIAL_INVALID, 401);
  return index + 1;
}

function database(env: TrialEnv): D1Database {
  if (!env.DB) throw new TrialError(TRIAL_UNAVAILABLE);
  // Always use primary: a stale read may affect the status label, never admission.
  return env.DB;
}

export async function trialStatus(env: TrialEnv) {
  inviteHashes(env);
  try {
    const row = await database(env).prepare("SELECT * FROM trial_budget WHERE id = ?").bind(TRIAL_ID).first<Budget>();
    if (!row) throw new TrialError(TRIAL_UNAVAILABLE);
    return { ready: inviteHashes(env).some(Boolean), remaining: null };
  } catch { throw new TrialError(TRIAL_UNAVAILABLE); }
}

export function reservationSql(slot: number): string {
  if (!Number.isInteger(slot) || slot < 1 || slot > 5) throw new TrialError(TRIAL_INVALID, 401);
  // The usage counter and both rate gates are updated by ONE write.
  // D1 serializes writes; neither concurrent requests nor worker restarts reset it.
  return `UPDATE trial_budget SET total = total + 1, used${slot} = used${slot} + 1, last${slot} = ?, last_global = ? WHERE id = ? AND last${slot} <= ? AND last_global <= ? RETURNING total, used${slot} AS used`;
}

export async function reserveTrial(env: TrialEnv, code: string, now = Date.now()) {
  const slot = await inviteSlot(code, env);
  try {
    const db = database(env);
    const result = await db.prepare(reservationSql(slot)).bind(now, now, TRIAL_ID, now - 10_000, now - 2_000).first<{total: number; used: number}>();
    if (result) return { remaining: null };
    const row = await db.prepare("SELECT * FROM trial_budget WHERE id = ?").bind(TRIAL_ID).first<Budget>();
    if (!row) throw new TrialError(TRIAL_UNAVAILABLE);
    throw new TrialError(TRIAL_BUSY, 429);
  } catch (error) {
    if (error instanceof TrialError) throw error;
    throw new TrialError(TRIAL_UNAVAILABLE);
  }
}
