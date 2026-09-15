import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyIntake, firstCandidates, openingMessage, requestsDirectHelp, BASIS_OPTIONS } from '../lib/first-experience.ts';
import { ChatInputSchema, emptyProfile, updateProfile, validateAnswer, needsUrgentSupport } from '../lib/contracts.ts';
import { knowledgeMaterials } from '../lib/knowledge.ts';

// All scenarios in this file are constructed acceptance cases, never customer records.
test('挫败处境和求助分开，推荐逐字追溯明确选择，情绪变化不改判', () => {
 const input={...emptyIntake(),issue:'认真准备的项目没选上，我觉得努力没有意义。',help:'action',basis:['pragmatic']};
 const result=firstCandidates(input);
 for(const reaction of ['我很自责','我不服，也嫉妒','我很平静','悲观，想退缩']) {
  assert.deepEqual(firstCandidates({...input,reaction}),result);
 }
 assert.equal(result[0].evidence,BASIS_OPTIONS.pragmatic);
 assert.match(openingMessage({...input,reaction:'我不服'}),/我现在的反应：我不服/);
 assert.match(openingMessage(input),/尚未确认成个人原则/);
});
test('全跳过不伪造推荐，单纯消极表达不构成倾向或危机', () => {
 for(const input of [emptyIntake(),{...emptyIntake(),issue:'我不知道，也不想答这些题。'}, {...emptyIntake(),reaction:'我很悲观，也嫉妒别人。'}]) {
  const result=firstCandidates(input);
  assert.equal(result.length,2);
  assert.ok(result.every(c=>c.kind==='example'&&c.evidence===null));
  assert.equal(needsUrgentSupport(openingMessage(input)),false);
 }
 assert.equal(requestsDirectHelp('我不知道，也不想答这些题。'),true);
 assert.equal(requestsDirectHelp('你还没回答我，别再一直反问了。'),true);
});
test('自由与家人的冲突原样保留，候选和个人原则相互独立', () => {
 const input={...emptyIntake(),issue:'我想自由，但又不想让家人失望。',help:'conflict',basis:['camus','confucian']};
 const profile=emptyProfile();
 assert.deepEqual(firstCandidates(input).map(c=>c.id),['camus','confucian']);
 assert.ok(openingMessage(input).startsWith(input.issue));
 assert.deepEqual(profile,emptyProfile());
});
test('无基座请求明确可用且不保存模型原则，非法来源仍然拒绝', () => {
 assert.equal(ChatInputSchema.parse({baseId:null,profileRevision:1,principles:[],messages:[{role:'user',content:'先聊聊'}]}).baseId,null);
 const answer={understanding:'先回应处境',perspective:'有边界的探索',nextStep:'可行一步',question:'',sourceIds:[],principleProposal:{text:'不该保存',reason:'',boundary:''},needsImmediateSupport:false};
 assert.equal(validateAnswer(answer,[],[],true).principleProposal,null);
 assert.throws(()=>validateAnswer({...answer,sourceIds:['invented']},[],[],true),/INVALID_SOURCE/);
 assert.throws(()=>validateAnswer(answer,['actual']),/MISSING_SOURCE/);
});
test('切换基座和修订原则不改变历史快照，序列化后可恢复', () => {
 const principle={id:'constructed',text:'我重视自主，也认真对待承诺',reason:'两者都重要',boundary:'不替别人承担所有期待',version:1,updatedAt:'2026-09-15',origin:'self'};
 const first=updateProfile(emptyProfile(),{baseId:'stoic',principles:[principle]},'构造的确认');
 const old={baseId:first.baseId,revision:first.revision,principlesSnapshot:structuredClone(first.principles),materials:knowledgeMaterials('stoic')};
 const changed=updateProfile(first,{baseId:'confucian',principles:[{...principle,text:'先保护基本生活，再协商承诺',version:2}]},'构造的修改');
 const recovered=JSON.parse(JSON.stringify({profile:changed,conversation:[old]}));
 assert.equal(recovered.profile.baseId,'confucian');
 assert.equal(recovered.conversation[0].baseId,'stoic');
 assert.equal(recovered.conversation[0].principlesSnapshot[0].version,1);
 assert.equal(recovered.conversation[0].materials.name,knowledgeMaterials('stoic').name);
});

test('完整原问题与深入探索补充可一起发送，不静默截断为六千字', () => {
 const content='原问题'.repeat(1200)+'补充'.repeat(2200);
 const request=ChatInputSchema.parse({baseId:'stoic',profileRevision:1,principles:[],messages:[{role:'user',content}]});
 assert.equal(request.messages[0].content,content);
 assert.equal(ChatInputSchema.safeParse({...request,messages:[{role:'user',content:'文'.repeat(12001)}]}).success,false);
});
