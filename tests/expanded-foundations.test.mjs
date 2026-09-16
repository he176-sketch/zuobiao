import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BASE_IDS,ChatInputSchema,ProfileSchema,MaterialSnapshotSchema,emptyProfile,updateProfile,validateAnswer,needsUrgentSupport} from '../lib/contracts.ts';
import {FOUNDATION_IDS,DISCOVERY_QUESTIONS,recommendFoundations} from '../lib/discovery.ts';
import {BASIS_OPTIONS,emptyIntake,firstCandidates,openingMessage,requestsDirectHelp,applicationPreview} from '../lib/first-experience.ts';
import {knowledgeMaterials,thinkingTools} from '../lib/knowledge.ts';
const bases=JSON.parse(readFileSync(new URL('../lib/foundations.json',import.meta.url))).bases;
const q='别人说我失败，我又觉得他们的标准不对。我到底应该相信谁？请给出判断，不要只反问。';

test('十二条路径的浏览数据、请求校验和两种推荐机制一致，候选最多三个',()=>{
 assert.equal(BASE_IDS.length,12);assert.deepEqual(bases.map(b=>b.id),[...BASE_IDS]);assert.deepEqual([...FOUNDATION_IDS],[...BASE_IDS]);
 for(const id of BASE_IDS){
  const input={...emptyIntake(),issue:q,basis:[id]};
  const candidates=firstCandidates(input);assert.equal(candidates[0].id,id);assert.equal(candidates[0].evidence,BASIS_OPTIONS[id]);assert.ok(candidates.length<=3);
  assert.deepEqual(firstCandidates({...input,reaction:'愤怒、自责、悲观'}),candidates);
  assert.ok(openingMessage(input).startsWith(q));assert.ok(applicationPreview(id,q).length>30);
  const answers=Object.fromEntries(DISCOVERY_QUESTIONS.map(scene=>[scene.id,scene.options.find(o=>o.foundation===id).id]));
  const result=recommendFoundations(answers);assert.equal(result.recommendations[0].id,id);assert.ok(result.recommendations.length<=3);
  assert.equal(ChatInputSchema.parse({baseId:id,profileRevision:2,principles:[],messages:[{role:'user',content:q}]}).baseId,id);
 }
 assert.equal(firstCandidates({...emptyIntake(),basis:[...BASE_IDS]}).length,3);
 assert.ok(firstCandidates(emptyIntake()).every(c=>c.evidence===null));
 assert.ok(requestsDirectHelp('不想再答问题，希望获得直接解释'));
});

test('新路径与六工具组合不串来源，来源语境与边界进入快照',()=>{
 for(const base of bases.slice(4)){
  const own=base.sources.map(s=>s.id);
  for(const tool of thinkingTools){
   const snapshot=MaterialSnapshotSchema.parse(knowledgeMaterials(base.id,tool.id));
   assert.deepEqual(snapshot.sources.map(s=>s.id),[...own,...tool.sources.map(s=>s.id)]);
   assert.equal(snapshot.principles[0].context,base.principles[0].context);assert.deepEqual(snapshot.boundaries,base.boundaries);
   const answer={understanding:'有限判断',perspective:'哲学解释',nextStep:'实际检验',question:'',sourceIds:[own[0]],principleProposal:null,needsImmediateSupport:false};
   assert.throws(()=>validateAnswer({...answer,sourceIds:['epictetus-handbook']},snapshot.sources.map(s=>s.id),own),/INVALID_SOURCE/);
   assert.throws(()=>validateAnswer({...answer,sourceIds:[tool.sources[0].id]},snapshot.sources.map(s=>s.id),own),/MISSING_FOUNDATION_SOURCE/);
  }
  assert.equal(needsUrgentSupport('我已经服药过量'),true);
 }
});

test('切换十二基座保留个人原则和旧快照，导出结构可无损往返',()=>{
 const principle={id:'constructed',text:'先保障基本生活',reason:'构造验收',boundary:'不代替事实检查',origin:'self',version:1,updatedAt:'2026-09-16'};
 let profile=updateProfile(emptyProfile(),{baseId:'stoic',principles:[principle]},'构造');
 const legacy={version:'2026-09-12.1',name:'旧名',scope:'旧范围',principles:[],sources:[]};
 const messages=[{baseId:'stoic',materials:legacy,principlesSnapshot:[principle]}];
 for(const id of BASE_IDS){profile=updateProfile(profile,{baseId:id},'构造切换');messages.push({baseId:id,materials:MaterialSnapshotSchema.parse(knowledgeMaterials(id)),principlesSnapshot:structuredClone(profile.principles)});}
 const restored=JSON.parse(JSON.stringify({profile,conversation:messages}));
 assert.deepEqual(ProfileSchema.parse(restored.profile).principles,[principle]);
 assert.deepEqual(MaterialSnapshotSchema.parse(restored.conversation[0].materials),legacy);
 for(const message of restored.conversation)assert.deepEqual(MaterialSnapshotSchema.parse(message.materials),message.materials);
 const next=knowledgeMaterials('socrates');next.principles[0].claim='changed';assert.notEqual(restored.conversation.at(-1).materials.principles[0].claim,'changed');
});
