export const PROFILE_KEY = 'zuobiao.profile.v1';
export const CONVERSATION_KEY = 'zuobiao.conversation.v1';
export const CONSENT_KEY = 'zuobiao.remember-conversation.v1';
export const DEVICE_STAMP_KEY = 'zuobiao.device-stamp.v1';
export const DEVICE_CONTENT_KEYS = [PROFILE_KEY, CONVERSATION_KEY, CONSENT_KEY] as const;
export const DEVICE_KEYS = [...DEVICE_CONTENT_KEYS, DEVICE_STAMP_KEY] as const;
type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
type Changes = Partial<Record<typeof DEVICE_CONTENT_KEYS[number], string | null>>;
type DeviceKey = typeof DEVICE_KEYS[number];
type Exclusive = <T>(run: () => T | Promise<T>) => Promise<T>;
export const STALE_DEVICE_ERROR = 'STALE_DEVICE';

/** A tab keeps its observed version. It never silently merges another tab's beliefs. */
export class DeviceStore {
 private baseline: (string | null)[];
 private pending: Promise<unknown> = Promise.resolve();
 private storage: StorageLike;
 private exclusive: Exclusive;
 constructor(storage: StorageLike, exclusive: Exclusive = async run => run()) {
  this.storage = storage;
  this.exclusive = exclusive;
  this.baseline = this.read();
 }
 private read() { return DEVICE_KEYS.map(key => this.storage.getItem(key)); }
 isCurrent() { return this.read().every((value, index) => value === this.baseline[index]); }
 private enqueue(run: () => void) {
  const next = this.pending.then(() => this.exclusive(run));
  this.pending = next.catch(() => undefined);
  return next;
 }
 private apply(changes: [DeviceKey, string | null][]) {
  const before = new Map(DEVICE_KEYS.map(key => [key, this.storage.getItem(key)]));
  const touched = new Set<DeviceKey>();
  try {
   for (const [key, value] of [...changes, [DEVICE_STAMP_KEY, crypto.randomUUID()] as [DeviceKey, string]]) {
    if (value === null) this.storage.removeItem(key);
    else this.storage.setItem(key, value);
    touched.add(key);
   }
   this.baseline = this.read();
  } catch (error) {
   // Free this transaction's values first so restoring the previously fitting
   // snapshot cannot fail merely because new values still occupy its space.
   for (const key of touched) {
    try { this.storage.removeItem(key); } catch { /* Preserve the original failure. */ }
   }
   for (const key of touched) {
    const previous = before.get(key);
    if (previous !== null && previous !== undefined) {
     try { this.storage.setItem(key, previous); } catch { /* A denied rollback remains stale. */ }
    }
   }
   // Do not advance the baseline on failure. An incomplete rollback prevents
   // later writes from treating partially restored content as confirmed data.
   throw error;
  }
 }
 write(changes: Changes) {
  const expectedProfile = this.baseline[0];
  return this.enqueue(() => {
   if (!this.isCurrent() || (PROFILE_KEY in changes && this.storage.getItem(PROFILE_KEY) !== expectedProfile)) throw new Error(STALE_DEVICE_ERROR);
   const entries = Object.entries(changes).filter((entry): entry is [DeviceKey, string | null] => entry[1] !== undefined);
   if (entries.every(([key, value]) => this.storage.getItem(key) === value)) return;
   this.apply(entries);
  });
 }
 clear() {
  return this.enqueue(() => {
   // Retain only a random coordination stamp so another tab notices a clear even when content was empty.
   this.apply(DEVICE_CONTENT_KEYS.map(key => [key, null]));
  });
 }
}
