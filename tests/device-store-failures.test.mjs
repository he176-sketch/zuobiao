import test from 'node:test';
import assert from 'node:assert/strict';
import { DeviceStore, PROFILE_KEY, CONVERSATION_KEY, CONSENT_KEY, DEVICE_STAMP_KEY, DEVICE_KEYS } from '../lib/device-store.ts';

function failingStorage(initial = {}) {
 const values = new Map(Object.entries(initial));
 let failure;
 return {
  failOnce(operation, key, error) { failure = { operation, key, error }; },
  getItem(key) { return values.get(key) ?? null; },
  setItem(key, value) {
   if (failure?.operation === 'set' && failure.key === key) { const error = failure.error; failure = undefined; throw error; }
   values.set(key, value);
  },
  removeItem(key) {
   if (failure?.operation === 'remove' && failure.key === key) { const error = failure.error; failure = undefined; throw error; }
   values.delete(key);
  },
 };
}
const snapshot = storage => DEVICE_KEYS.map(key => storage.getItem(key));
const confirmed = { [PROFILE_KEY]: 'confirmed profile', [CONVERSATION_KEY]: 'confirmed conversation', [CONSENT_KEY]: 'yes', [DEVICE_STAMP_KEY]: 'confirmed stamp' };

test('保留对话失败时恢复原偏好，原始容量错误保持不变', async () => {
 const storage = failingStorage({ [CONSENT_KEY]: 'no' });
 const store = new DeviceStore(storage);
 const before = snapshot(storage);
 const error = new DOMException('Storage quota exceeded', 'QuotaExceededError');
 storage.failOnce('set', CONVERSATION_KEY, error);
 await assert.rejects(store.write({ [CONSENT_KEY]: 'yes', [CONVERSATION_KEY]: 'new conversation' }), caught => caught === error);
 assert.deepEqual(snapshot(storage), before);
 assert.equal(store.isCurrent(), true);
 await store.write({ [CONSENT_KEY]: 'yes', [CONVERSATION_KEY]: 'retry conversation' });
 assert.equal(storage.getItem(CONVERSATION_KEY), 'retry conversation');
});

test('协调标识写入失败时恢复已修改和删除的内容', async () => {
 const storage = failingStorage(confirmed);
 const store = new DeviceStore(storage);
 const before = snapshot(storage);
 const error = new DOMException('Storage quota exceeded', 'QuotaExceededError');
 storage.failOnce('set', DEVICE_STAMP_KEY, error);
 await assert.rejects(store.write({ [PROFILE_KEY]: 'unconfirmed profile', [CONSENT_KEY]: 'no', [CONVERSATION_KEY]: null }), caught => caught === error);
 assert.deepEqual(snapshot(storage), before);
 assert.equal(store.isCurrent(), true);
});

test('清除中途失败或末尾失败都恢复原记录，之后仍可重试清除', async () => {
 for (const [operation, key] of [['remove', CONVERSATION_KEY], ['set', DEVICE_STAMP_KEY]]) {
  const storage = failingStorage(confirmed);
  const store = new DeviceStore(storage);
  const before = snapshot(storage);
  const error = new DOMException('Storage temporarily unavailable', 'SecurityError');
  storage.failOnce(operation, key, error);
  await assert.rejects(store.clear(), caught => caught === error);
  assert.deepEqual(snapshot(storage), before);
  assert.equal(store.isCurrent(), true);
  await store.clear();
  for (const contentKey of [PROFILE_KEY, CONVERSATION_KEY, CONSENT_KEY]) assert.equal(storage.getItem(contentKey), null);
  assert.notEqual(storage.getItem(DEVICE_STAMP_KEY), confirmed[DEVICE_STAMP_KEY]);
 }
});

test('恢复前先释放新值，避免新值占用旧快照所需容量', async () => {
 const values = new Map([[PROFILE_KEY, 'a'.repeat(100)], [CONVERSATION_KEY, 'b'.repeat(10)]]);
 const storage = {
  getItem: key => values.get(key) ?? null,
  removeItem: key => values.delete(key),
  setItem(key, value) {
   const size = [...values].reduce((total, [entryKey, entryValue]) => total + (entryKey === key ? 0 : entryValue.length), value.length);
   if (size > 180) throw new DOMException('Storage quota exceeded', 'QuotaExceededError');
   values.set(key, value);
  },
 };
 const store = new DeviceStore(storage);
 const before = snapshot(storage);
 await assert.rejects(store.write({ [PROFILE_KEY]: 'p', [CONVERSATION_KEY]: 'c'.repeat(160) }), { name: 'QuotaExceededError' });
 assert.deepEqual(snapshot(storage), before);
 assert.equal(store.isCurrent(), true);
});
