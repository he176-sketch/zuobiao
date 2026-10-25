import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { Miniflare } from 'miniflare';
import { reserveTrial, inviteSlot, inviteFromRequest, trialStatus, TRIAL_COOKIE } from '../lib/trial.ts';

const codes = ['2468', ...[2,3,4,5].map(n => String(n).repeat(32))];
const hashes = codes.map(code => createHash('sha256').update(code).digest('hex'));
const config = {TRIAL_ENABLED:'true',TRIAL_INVITE_HASHES:JSON.stringify(hashes)};
const sql = await readFile(new URL('../drizzle/0000_steady_mesmero.sql',import.meta.url),'utf8');
const upgrade = await readFile(new URL('../drizzle/0001_slippery_steel_serpent.sql',import.meta.url),'utf8');
const pagesHandoff = await readFile(new URL('../drizzle/0002_pages_counter_handoff.sql',import.meta.url),'utf8');
async function migrate(DB, source) { for (const statement of source.split('--> statement-breakpoint').filter(x=>x.trim())) await DB.prepare(statement.trim()).run(); }
const create = path => new Miniflare({modules:true,script:'export default {fetch(){return new Response("test")}}',compatibilityDate:'2026-05-15',d1Databases:{DB:'trial-test'},d1Persist:path,cf:false});
async function setup(t, legacy=false){const path=await mkdtemp(join(tmpdir(),'zuobiao-trial-'));const mf=create(path);const lifecycle={mf};t.after(async()=>{await lifecycle.mf.dispose();await rm(path,{recursive:true,force:true});});const DB=await mf.getD1Database('DB');await migrate(DB,sql);if(!legacy)await migrate(DB,upgrade);return {mf,DB,path,lifecycle,env:{...config,DB}};}
const row = DB => DB.prepare('SELECT * FROM trial_budget').first();

test('invalid, absent, revoked, malformed and duplicate invite configurations reject without consuming',async t=>{const {env,DB}=await setup(t);for(const code of ['', 'x'.repeat(32)])await assert.rejects(reserveTrial(env,code));await assert.rejects(reserveTrial({...env,TRIAL_INVITE_HASHES:JSON.stringify([null,...hashes.slice(1)])},codes[0]));for(const bad of ['', '[]', JSON.stringify([hashes[0],hashes[0],...hashes.slice(2)])])await assert.rejects(reserveTrial({...env,TRIAL_INVITE_HASHES:bad},codes[0]));await assert.rejects(reserveTrial({...env,TRIAL_ENABLED:'false'},codes[0]));assert.equal((await row(DB)).total,0);});

test('concurrent admission and per-code rate limit permit only one debit',async t=>{const {env,DB}=await setup(t);const results=await Promise.allSettled(Array.from({length:30},()=>reserveTrial(env,codes[0],100000)));assert.equal(results.filter(x=>x.status==='fulfilled').length,1);assert.equal((await row(DB)).total,1);await assert.rejects(reserveTrial(env,codes[0],109999));await reserveTrial(env,codes[0],110000);assert.equal((await row(DB)).used1,2);});

test('usage continues beyond both old caps without resetting history',async t=>{const {env,DB}=await setup(t);let now=100000;for(let n=0;n<60;n++){await reserveTrial(env,codes[0],now);now+=10000;}assert.equal((await row(DB)).total,60);assert.equal((await row(DB)).used1,60);assert.deepEqual(await trialStatus(env),{ready:true,remaining:null});});

test('migration preserves every historical field and retains accounting constraints',async t=>{const {env,DB}=await setup(t,true);await DB.prepare('UPDATE trial_budget SET total=50,used1=10,used2=10,used3=10,used4=10,used5=10,last_global=10000,last1=10000,last2=8000,last3=6000,last4=4000,last5=2000').run();const before=await row(DB);await migrate(DB,upgrade);assert.deepEqual(await row(DB),before);await reserveTrial(env,codes[0],100000);assert.equal((await row(DB)).total,51);assert.equal((await row(DB)).used1,11);await assert.rejects(DB.prepare('UPDATE trial_budget SET total=0').run());await assert.rejects(DB.prepare('UPDATE trial_budget SET total=39,used1=-1').run());});

test('Pages counter handoff applies once only to the audited Sites state',async t=>{const {DB}=await setup(t);await DB.prepare('UPDATE trial_budget SET total=3,used1=3,last_global=1789556512537,last1=1789556512537').run();await migrate(DB,pagesHandoff);const migrated=await row(DB);assert.equal(migrated.total,4);assert.equal(migrated.used1,4);assert.equal(migrated.last_global,1789571303340);await migrate(DB,pagesHandoff);assert.deepEqual(await row(DB),migrated);await DB.prepare('UPDATE trial_budget SET total=5,used1=5').run();await migrate(DB,pagesHandoff);assert.equal((await row(DB)).total,5);});

test('global frequency gate is atomic across different invitation slots',async t=>{const {env,DB}=await setup(t);const results=await Promise.allSettled(codes.map(code=>reserveTrial(env,code,100000)));assert.equal(results.filter(x=>x.status==='fulfilled').length,1);assert.equal((await row(DB)).total,1);});

test('an upstream failure keeps its prior reservation and restart preserves it',async t=>{const {env,DB,path,mf,lifecycle}=await setup(t);await reserveTrial(env,codes[0],100000);await assert.rejects(Promise.reject(new Error('simulated provider failure')));assert.equal((await row(DB)).total,1);await mf.dispose();const restarted=create(path);lifecycle.mf=restarted;const next=await restarted.getD1Database('DB');assert.equal((await row(next)).total,1);await reserveTrial({...env,DB:next},codes[0],120000);assert.equal((await row(next)).total,2);});

test('missing or failing budget never auto-creates or permits a request',async t=>{const {env,DB}=await setup(t);await DB.prepare('DELETE FROM trial_budget').run();await assert.rejects(reserveTrial(env,codes[0],100000));await assert.rejects(trialStatus(env));assert.equal(await row(DB),null);await assert.rejects(reserveTrial({...env,DB:undefined},codes[0]));await assert.rejects(reserveTrial({...env,DB:{prepare(){throw Error('offline')}}},codes[0]));});

test('cookie ambiguity and fake platform identity do not grant invitation access',async()=>{assert.equal(inviteFromRequest(new Request('https://example.test',{headers:{'oai-authenticated-user-id':'owner'}})),'');assert.equal(inviteFromRequest(new Request('https://example.test',{headers:{cookie:`${TRIAL_COOKIE}=${codes[0]}; ${TRIAL_COOKIE}=${codes[1]}`}})),'');assert.equal(await inviteSlot(codes[4],config),5);});
