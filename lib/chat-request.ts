/** Only product-owned messages may reach the conversation error UI. */
export class ChatRequestError extends Error {}
const errors = new Set([
  "请求来源不一致，请重新打开页面。", "请先登录，再开始对话。", "请求格式不正确。",
  "累计内容过长，请减少原则内容或另开一次对话。", "请求内容无法读取。",
  "请检查问题、基座或原则内容后重试。",
  "AI 对话尚未接通。你的问题仍在输入框里，可以先浏览基座或阅读示例。",
  "刚才的问题有点密集，请稍等一分钟再继续。", "AI 服务配置需要修复，请稍后再试。",
  "AI 服务暂时繁忙，请稍后重试。", "AI 服务暂时未能完成回答，请稍后重试。",
  "AI 服务连接中断，问题已保留，请重试。", "回答花的时间有些长，问题已保留，可以重试。",
  "这次回答未通过内容与来源检查，请重试。",
]);
export const CHAT_WAIT_MS = 100_000;
export async function requestChat(body: unknown, signal: AbortSignal, onUnauthorized: () => void, timeout = CHAT_WAIT_MS): Promise<unknown> {
  const controller = new AbortController();
  const cancel = () => controller.abort(signal.reason);
  signal.addEventListener("abort", cancel, { once: true });
  if (signal.aborted) cancel();
  const timer = setTimeout(() => controller.abort(new DOMException("Chat deadline", "TimeoutError")), timeout);
  try {
    const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: controller.signal });
    if (response.status === 401) onUnauthorized();
    let raw: unknown;
    try { raw = await response.json(); }
    catch { controller.signal.throwIfAborted(); throw new ChatRequestError("这次没有收到完整回答，问题已保留，请重试。"); }
    controller.signal.throwIfAborted();
    if (!response.ok) {
      const message = raw && typeof raw === "object" && "error" in raw ? raw.error : null;
      throw new ChatRequestError(typeof message === "string" && errors.has(message) ? message : "暂时无法完成回答，问题已保留，请稍后重试。");
    }
    return raw;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new ChatRequestError(controller.signal.reason?.name === "TimeoutError" ? "等待已超过 100 秒，问题已保留，可以重试。" : "已停止等待，问题仍在输入框里。");
    }
    if (error instanceof ChatRequestError) throw error;
    throw new ChatRequestError("连接中断，问题已保留。请检查网络后重试。");
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", cancel);
  }
}
