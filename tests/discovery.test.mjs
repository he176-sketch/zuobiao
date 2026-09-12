import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DISCOVERY_QUESTIONS, FOUNDATION_IDS, FOUNDATION_INTROS, recommendFoundations } from '../lib/discovery.ts';

const answersFor = id => Object.fromEntries(DISCOVERY_QUESTIONS.map(q => [q.id, q.options.find(o => o.foundation === id).id]));
test('12个情境没有漏项，四类选项轮换但映射不变，简介来源存在', () => {
 assert.equal(DISCOVERY_QUESTIONS.length, 12);
 assert.equal(new Set(DISCOVERY_QUESTIONS.map(q => q.id)).size, 12);
 const bases=JSON.parse(readFileSync(new URL('../lib/foundations.json',import.meta.url),'utf8')).bases;
 for(const q of DISCOVERY_QUESTIONS)assert.deepEqual([...q.options.map(o=>o.foundation)].sort(),[...FOUNDATION_IDS].sort());
 for(const base of bases)for(const source of FOUNDATION_INTROS[base.id].sourceIds)assert.ok(base.sources.some(s=>s.id===source));
});
test('四种明确偏好都可成为首选，对照入口不会伪装为匹配', () => {
 for(const id of FOUNDATION_IDS){const r=recommendFoundations(answersFor(id));assert.equal(r.answered,12);assert.equal(r.recommendations[0].id,id);assert.equal(r.recommendations[0].evidence.length,12);assert.equal(r.recommendations[1].kind,'contrast');assert.equal(r.recommendations[1].evidence.length,0);}
});
test('跳题、伪造选项和过少回答不产生匹配结论', () => {
 assert.equal(recommendFoundations({}).recommendations.length,0);
 assert.equal(recommendFoundations({unknown:'stoic',setback:'invented'}).answered,0);
 const partial=Object.fromEntries(Object.entries(answersFor('stoic')).slice(0,3));assert.equal(recommendFoundations(partial).recommendations.length,0);
});
test('四方同分不会隐藏第四个同分入口', () => {
 const answers=Object.fromEntries(DISCOVERY_QUESTIONS.map((q,i)=>[q.id,q.options.find(o=>o.foundation===FOUNDATION_IDS[i%4]).id]));
 const r=recommendFoundations(answers);assert.equal(r.tied,true);assert.equal(r.recommendations.length,3);assert.equal(r.omittedTies.length,1);assert.equal(new Set([...r.recommendations.map(x=>x.id),...r.omittedTies]).size,4);
});
test('返回修改回答后，推荐依据与排序一起变化', () => {
 const before=answersFor('stoic');const after=answersFor('camus');assert.equal(recommendFoundations(before).recommendations[0].id,'stoic');assert.equal(recommendFoundations(after).recommendations[0].id,'camus');
});
