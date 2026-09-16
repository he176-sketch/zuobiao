import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { Miniflare } from 'miniflare';
import { reserveTrial, inviteSlot, inviteFromRequest, trialStatus, TRIAL_COOKIE } from '../lib/trial.ts';

const codes = [1,2,3,4,5].map(n => String(n).repeat(32));
const hashes = codes.map(code => createHash('sha256').update(code).digest('hex'));
const config = {TRIAL_ENABLED:'true',TRIAL_INVITE_HASHES:JSON.stringify(hashes)};
const sql = await readFile(new URL('../drizzle/0000_steady_mesmero.sql',import.meta.url),'utf8');
const create = path => new Miniflare({modules:true,script:'export default {fetch(){return new Response("test")}}',compatibilityDate:'2026-05-15',d1Databases:{DB:'trial-test'},d1Persist:path,cf:false});
async function setup(t){const path=await mkdtemp(join(tmpdir(),'zuobiao-trial-'));const mf=create(path);const lifecycle={mf};t.after(async()=>{await lifecycle.mf.dispose();await rm(path,{recursive:true,force:true});});const DB=await mf.getD1Database('DB');for(const statement of sql.split('--> statement-breakpoint').filter(x=>x.trim()))await DB.prepare(statement.trim()).run();return {mf,DB,path,lifecycle,env:{...config,DB}};}
const row = DB => DB.prepare('SELECT * FROM trial_budget').first();

test('invalid, absent, revoked, malformed and duplicate invite configurations reject without consuming',async t=>{const {env,DB}=await setup(t);for(const code of ['', 'x'.repeat(32)])await assert.rejects(reserveTrial(env,code));await assert.rejects(reserveTrial({...env,TRIAL_INVITE_HASHES:JSON.stringify([null,...hashes.slice(1)])},codes[0]));for(const bad of ['', '[]', JSON.stringify([hashes[0],hashes[0],...hashes.slice(2)])])await assert.rejects(reserveTrial({...env,TRIAL_INVITE_HASHES:bad},codes[0]));await assert.rejects(reserveTrial({...env,TRIAL_ENABLED:'false'},codes[0]));assert.equal((await row(DB)).total,0);});

test('concurrent admission and per-code rate limit permit only one debit',async t=>{const {env,DB}=await setup(t);const results=await Promise.allSettled(Array.from({length:30},()=>reserveTrial(env,codes[0],100000)));assert.equal(results.filter(x=>x.status==='fulfilled').length,1);assert.equal((await row(DB)).total,1);await assert.rejects(reserveTrial(env,codes[0],109999));await reserveTrial(env,codes[0],110000);assert.equal((await row(DB)).used1,2);});

test('fifty lifetime debits across five invites persist; 51st and exhausted invite fail',async t=>{const {env,DB}=await setup(t);let now=100000;for(let n=0;n<10;n++)for(const code of codes){await reserveTrial(env,code,now);now+=10000;}const state=await row(DB);assert.equal(state.total,50);for(let n=1;n<=5;n++)assert.equal(state['used'+n],10);for(const code of codes)await assert.rejects(reserveTrial(env,code,now+86400000));assert.equal((await row(DB)).total,50);});

test('last available global slot cannot be spent twice concurrently',async t=>{const {env,DB}=await setup(t);await DB.prepare('UPDATE trial_budget SET total=49,used1=9,used2=10,used3=10,used4=10,used5=10').run();const results=await Promise.allSettled(Array.from({length:20},(_,i)=>reserveTrial(env,codes[0],100000+i*10000)));assert.equal(results.filter(x=>x.status==='fulfilled').length,1);assert.equal((await row(DB)).total,50);});

test('an upstream failure keeps its prior reservation and restart preserves it',async t=>{const {env,DB,path,mf,lifecycle}=await setup(t);await reserveTrial(env,codes[0],100000);await assert.rejects(Promise.reject(new Error('simulated provider failure')));assert.equal((await row(DB)).total,1);await mf.dispose();const restarted=create(path);lifecycle.mf=restarted;const next=await restarted.getD1Database('DB');assert.equal((await row(next)).total,1);await reserveTrial({...env,DB:next},codes[0],120000);assert.equal((await row(next)).total,2);});

test('missing or failing budget never auto-creates or permits a request',async t=>{const {env,DB}=await setup(t);await DB.prepare('DELETE FROM trial_budget').run();await assert.rejects(reserveTrial(env,codes[0],100000));await assert.rejects(trialStatus(env));assert.equal(await row(DB),null);await assert.rejects(reserveTrial({...env,DB:undefined},codes[0]));await assert.rejects(reserveTrial({...env,DB:{prepare(){throw Error('offline')}}},codes[0]));});

test('cookie ambiguity and fake platform identity do not grant invitation access',async()=>{assert.equal(inviteFromRequest(new Request('https://example.test',{headers:{'oai-authenticated-user-id':'owner'}})),'');assert.equal(inviteFromRequest(new Request('https://example.test',{headers:{cookie:`${TRIAL_COOKIE}=${codes[0]}; ${TRIAL_COOKIE}=${codes[1]}`}})),'');assert.equal(await inviteSlot(codes[4],config),5);});
