import test from 'node:test';
import assert from 'node:assert/strict';
import { DeviceStore,PROFILE_KEY,CONVERSATION_KEY,CONSENT_KEY,DRAFT_KEY,DEVICE_STAMP_KEY } from '../lib/device-store.ts';
import { readRequestBody,responseSignal,MAX_REQUEST_BYTES } from '../lib/request-limits.ts';
import { ChatInputSchema,validateAnswer,supportAnswer,needsUrgentSupport } from '../lib/contracts.ts';

const storage=()=>{const values=new Map();return {getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};};
test('旧页面不能覆盖另一页面确认的原则',async()=>{
 const s=storage();const a=new DeviceStore(s);const b=new DeviceStore(s);
 await a.write({[PROFILE_KEY]:'principle A'});await assert.rejects(b.write({[PROFILE_KEY]:'principle B'}),/STALE_DEVICE/);assert.equal(s.getItem(PROFILE_KEY),'principle A');
});
test('多页面同时保存时，互斥区内再次核对版本',async()=>{
 let queue=Promise.resolve();const exclusive=run=>{const next=queue.then(run);queue=next.catch(()=>{});return next;};
 const s=storage();const a=new DeviceStore(s,exclusive);const b=new DeviceStore(s,exclusive);
 const result=await Promise.allSettled([a.write({[PROFILE_KEY]:'A'}),b.write({[PROFILE_KEY]:'B'})]);assert.deepEqual(result.map(r=>r.status),['fulfilled','rejected']);assert.equal(s.getItem(PROFILE_KEY),'A');
});
test('清除后的协调标识阻止旧页复活对话，内容确实移除',async()=>{
 const s=storage();const a=new DeviceStore(s);await a.write({[PROFILE_KEY]:'profile',[CONVERSATION_KEY]:'chat',[CONSENT_KEY]:'yes'});const stale=new DeviceStore(s);
 await a.clear();await assert.rejects(stale.write({[CONVERSATION_KEY]:'old chat'}),/STALE_DEVICE/);
 for(const key of [PROFILE_KEY,CONVERSATION_KEY,CONSENT_KEY])assert.equal(s.getItem(key),null);assert.ok(s.getItem(DEVICE_STAMP_KEY));
});

test('草稿只在用户同意本机保存时进入持久存储，清除记录一并移除',async()=>{
 const s=storage();const store=new DeviceStore(s);
 await store.write({[CONSENT_KEY]:'yes',[DRAFT_KEY]:'尚未发送的问题'});
 assert.equal(s.getItem(DRAFT_KEY),'尚未发送的问题');
 await store.write({[CONSENT_KEY]:'no',[DRAFT_KEY]:null});
 assert.equal(s.getItem(DRAFT_KEY),null);
 await store.write({[CONSENT_KEY]:'yes',[DRAFT_KEY]:'再次保存'});
 await store.clear();
 assert.equal(s.getItem(DRAFT_KEY),null);
 assert.ok(s.getItem(DEVICE_STAMP_KEY));
});
test('完整合法中文原则和多轮历史不会触发过小的请求上限',async()=>{
 const principle={id:'p',text:'文'.repeat(500),reason:'理'.repeat(600),boundary:'界'.repeat(600),origin:'self',version:1,updatedAt:'2026-09-12'};
 const payload={baseId:'stoic',profileRevision:1,principles:Array.from({length:20},(_,i)=>({...principle,id:'p'+i})),messages:Array.from({length:12},(_,i)=>({role:i%2?'user':'assistant',content:'字'.repeat(6000)}))};
 assert.equal(ChatInputSchema.safeParse(payload).success,true);const body=JSON.stringify(payload);const bytes=new TextEncoder().encode(body).length;assert.ok(bytes>80000&&bytes<MAX_REQUEST_BYTES);assert.equal(await readRequestBody(new Request('https://example.test',{method:'POST',body})),body);
});
test('边读边限制异常请求，并联动取消信号',async()=>{
 const req=new Request('https://example.test',{method:'POST',body:'123456'});await assert.rejects(readRequestBody(req,5),/REQUEST_TOO_LARGE/);
 const controller=new AbortController();const signal=responseSignal(controller.signal);controller.abort();assert.equal(signal.aborted,true);
});
test('紧急支持优先于无关的哲学来源检查，引用交给模型理解',()=>{
 assert.deepEqual(validateAnswer({...supportAnswer(),sourceIds:['unknown']},[]).sourceIds,[]);
 assert.equal(needsUrgentSupport('朋友说我想死，我该怎么回应他？'),false);
 assert.equal(needsUrgentSupport('小说里这句台词“我想死”是什么意思？'),false);
 assert.equal(needsUrgentSupport('我今晚准备伤害自己，现在一个人在家'),true);
 for(const message of ['我已经服药过量。朋友说他现在来不了。','我今晚准备伤害自己。这不是小说，也不是台词。','我不想活了。我刚跟家人说过。'])assert.equal(needsUrgentSupport(message),true);
});
