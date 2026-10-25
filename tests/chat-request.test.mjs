import test from 'node:test';
import assert from 'node:assert/strict';
import { requestChat, ChatRequestError } from '../lib/chat-request.ts';

test('挂起连接和挂起响应正文均受截止时间约束，取消仍可用', async t => {
  const hang = signal => new Promise((_, reject) => {
    if (signal.aborted) reject(signal.reason);
    else signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  });
  for (const stage of ['connect', 'body']) {
    t.mock.method(globalThis, 'fetch', async (_, init) => stage === 'connect' ? hang(init.signal) : { ok: true, status: 200, json: () => hang(init.signal) });
    await assert.rejects(requestChat({}, new AbortController().signal, () => {}, 15), /等待已超过 100 秒/);
    t.mock.restoreAll();
  }
  t.mock.method(globalThis, 'fetch', async (_, init) => hang(init.signal));
  const cancel = new AbortController();
  const result = requestChat({}, cancel.signal, () => {});
  cancel.abort();
  await assert.rejects(result, /已停止等待/);
});

test('网络、代理和格式错误不把底层信息带到 UI；固定提示和登录失效仍可识别', async t => {
  const marker = 'INTERNAL_TEST_MARKER';
  const failures = [
    async () => { throw new TypeError(marker); },
    async () => new Response(marker, { status: 502 }),
    async () => Response.json({error: marker}, { status: 502 }),
  ];
  for (const fake of failures) {
    t.mock.method(globalThis, 'fetch', fake);
    await assert.rejects(requestChat({}, new AbortController().signal, () => {}), e => e instanceof ChatRequestError && !e.message.includes(marker) && e.message.includes('问题已保留'));
    t.mock.restoreAll();
  }
  let unauthorized = 0;
  t.mock.method(globalThis, 'fetch', async () => Response.json({ error: '请先登录，再开始对话。' }, {status:401}));
  await assert.rejects(requestChat({}, new AbortController().signal, () => unauthorized++), /请先登录/);
  assert.equal(unauthorized, 1);
  t.mock.restoreAll();
  t.mock.method(globalThis, 'fetch', async () => Response.json({ error: 'AI 服务暂时繁忙，请稍后重试。' }, {status:502}));
  await assert.rejects(requestChat({}, new AbortController().signal, () => {}), /AI 服务暂时繁忙/);
});

test('成功请求原样返回，单次调用不自行重试，不修改依据快照', async t => {
  const body = { baseId: 'camus', profileRevision: 2, principles: [], messages: [{role:'user', content:'构造问题'}] };
  const original = structuredClone(body);
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async (_, init) => {
    calls++;
    assert.deepEqual(JSON.parse(init.body), original);
    return Response.json({baseId:'camus',profileRevision:2});
  });
  assert.deepEqual(await requestChat(body, new AbortController().signal, () => {}), {baseId:'camus',profileRevision:2});
  assert.equal(calls, 1);
  assert.deepEqual(body, original);
});
