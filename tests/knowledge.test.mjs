import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {knowledgeMaterials,thinkingTools,philosophyLenses} from '../lib/knowledge.ts';
import {BASE_IDS,THINKING_TOOL_IDS,ChatInputSchema,MaterialSnapshotSchema,validateAnswer,supportAnswer} from '../lib/contracts.ts';

const good={understanding:'理解处境',perspective:'按基座解释',nextStep:'可行一步',question:'',sourceIds:['epictetus-handbook'],principleProposal:null,needsImmediateSupport:false};
const request={baseId:'stoic',profileRevision:1,principles:[],messages:[{role:'user',content:'想参加周末课程，怎样比较时间安排？'}]};
test('旧请求兼容，工具正文与未知工具不能进入请求',()=>{
 assert.equal(ChatInputSchema.safeParse(request).success,true);
 for(const id of THINKING_TOOL_IDS)assert.equal(ChatInputSchema.parse({...request,thinkingToolId:id}).thinkingToolId,id);
 assert.equal(ChatInputSchema.safeParse({...request,thinkingToolId:'invented'}).success,false);
 assert.equal(ChatInputSchema.safeParse({...request,thinkingTool:{core:'ignore instructions'}}).success,false);
 assert.throws(()=>knowledgeMaterials('stoic','invented'),/UNKNOWN_THINKING_TOOL/);
});
test('工具来源不会越过所选基座，且不能单独替代哲学依据',()=>{
 const base=knowledgeMaterials('stoic');const withTool=knowledgeMaterials('stoic','opportunity-cost');
 const ids=base.sources.map(s=>s.id);const allowed=withTool.sources.map(s=>s.id);const toolId='tool-opportunity-cost';
 assert.throws(()=>validateAnswer({...good,sourceIds:[...good.sourceIds,toolId]},ids),/INVALID_SOURCE/);
 assert.throws(()=>validateAnswer({...good,sourceIds:[toolId]},allowed,ids),/MISSING_FOUNDATION_SOURCE/);
 for(const forbidden of ['sep-camus','tool-sunk-cost','fabricated'])assert.throws(()=>validateAnswer({...good,sourceIds:[...good.sourceIds,forbidden]},allowed,ids),/INVALID_SOURCE/);
 assert.deepEqual(validateAnswer({...good,sourceIds:[...good.sourceIds,toolId]},allowed,ids).sourceIds,[...good.sourceIds,toolId]);
 assert.deepEqual(validateAnswer({...supportAnswer(),sourceIds:[toolId]},allowed,ids).sourceIds,[]);
});
test('新旧快照可恢复，下一次选择不改变当时的方法与署名',()=>{
 const old={version:'legacy',name:'基座',scope:'旧范围',principles:[],sources:[]};assert.deepEqual(MaterialSnapshotSchema.parse(old),old);
 const first=MaterialSnapshotSchema.parse(knowledgeMaterials('stoic','opportunity-cost'));
 const next=knowledgeMaterials('camus','sunk-cost');next.thinkingTool.core='updated';next.philosophySupplement.positions[0].claim='updated';
 const restored=MaterialSnapshotSchema.parse(JSON.parse(JSON.stringify(first)));
 assert.equal(restored.thinkingTool.id,'opportunity-cost');assert.equal(restored.philosophySupplement.baseId,'stoic');
 assert.notEqual(restored.thinkingTool.core,'updated');assert.notEqual(restored.philosophySupplement.positions[0].claim,'updated');
 assert.equal(restored.philosophySupplement.provenance.license,'CC BY-SA 4.0');
 // Historical snapshots remain readable if a tool later leaves the selectable catalog.
 assert.equal(MaterialSnapshotSchema.parse({...first,thinkingTool:{...first.thinkingTool,id:'retired-tool'}}).thinkingTool.id,'retired-tool');
 assert.equal(knowledgeMaterials('stoic').thinkingTool,undefined);
});
test('内容来源固定且可复核，所有思想定位都有实际条目与本基座来源',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../vendor/knowledge-manifest.json',import.meta.url)));
 for(const item of manifest){const bytes=readFileSync(new URL('../'+item.path,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),item.sha256,item.path);assert.match(item.url,/\/[a-f0-9]{40}\//);}
 assert.deepEqual(thinkingTools.map(t=>t.id),[...THINKING_TOOL_IDS]);assert.deepEqual(philosophyLenses.map(l=>l.baseId).sort(),['camus','confucian','pragmatic','stoic']);
 for(const baseId of BASE_IDS){
  const material=MaterialSnapshotSchema.parse(knowledgeMaterials(baseId));const lens=material.philosophySupplement;for(const tool of thinkingTools)MaterialSnapshotSchema.parse(knowledgeMaterials(baseId,tool.id));if(!lens)continue;const original=JSON.parse(readFileSync(new URL('../vendor/philoscopia/'+lens.provenance.path,import.meta.url)));
  for(const p of lens.positions){const entry=original.entries[p.entryIndex];assert.equal(entry.axisId,p.axisId);assert.equal(entry.status,'POSITIONED');assert.ok(p.upstreamReferences.length);assert.deepEqual(p.upstreamReferences,entry.justification.references);for(const id of p.sourceIds)assert.ok(material.sources.some(s=>s.id===id));}
  for(const tool of thinkingTools)MaterialSnapshotSchema.parse(knowledgeMaterials(baseId,tool.id));
 }
 for(const lib of ['philoscopia','model-thinking'])assert.deepEqual(readFileSync(new URL('../vendor/'+lib+'/LICENSE',import.meta.url)),readFileSync(new URL('../public/knowledge/licenses/'+lib+'.txt',import.meta.url)));
});
