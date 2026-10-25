/** Covers the complete valid ChatInput payload, including escaped JSON strings. */
export const MAX_REQUEST_BYTES = 1_000_000;

export async function readRequestBody(request: Request, limit = MAX_REQUEST_BYTES): Promise<string> {
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > limit) throw new Error('REQUEST_TOO_LARGE');
  if (!request.body) return '';
  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let bytes = 0;
  let text = '';
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > limit) {
        await reader.cancel();
        throw new Error('REQUEST_TOO_LARGE');
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}

export function responseSignal(requestSignal: AbortSignal, timeout = 90_000) {
  return AbortSignal.any([requestSignal, AbortSignal.timeout(timeout)]);
}
