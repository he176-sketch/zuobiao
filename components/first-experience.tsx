'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { needsUrgentSupport } from '@/lib/contracts';
import content from '@/lib/foundations.json';
import { FOUNDATION_INTROS, type FoundationId } from '@/lib/discovery';
import { applicationPreview, BASIS_OPTIONS, HELP_OPTIONS, REACTIONS, firstCandidates, openingMessage, type Intake } from '@/lib/first-experience';

type Props = { intake: Intake; onChange: (value: Intake) => void; onStart: (id: FoundationId | null) => void; onDeep: () => void; onInspect: (id: string) => void; disabled: boolean };
export default function FirstExperience({ intake, onChange, onStart, onDeep, onInspect, disabled }: Props) {
 const [step, setStep] = useState(0);
 const [other, setOther] = useState(false);
 const heading = useRef<HTMLHeadingElement>(null);
 useEffect(() => { heading.current?.focus({ preventScroll: true }); heading.current?.scrollIntoView({ block: 'start' }); }, [step]);
 const urgent = () => needsUrgentSupport(openingMessage(intake));
 const advance = (next: number) => urgent() ? onStart(null) : setStep(next);
 const update = (change: Partial<Intake>) => onChange({ ...intake, ...change });
 const titles = ['就从眼前这件事开始。', '这次，你最想得到什么帮助？', '有没有愿意先试试的判断依据？', '用你的问题，对照看看这些角度。'];
 const candidates = firstCandidates(intake);
 const primaryBasis = [...new Set<string>([...(HELP_OPTIONS.find(h=>h.id===intake.help)?.bases||[]),...intake.basis,"stoic","camus","pragmatic","confucian"])].slice(0,4);
 const renderBasis=([id,label]:[string,string])=><button key={id} aria-pressed={intake.basis.includes(id as FoundationId)} onClick={()=>update({basis:intake.basis.includes(id as FoundationId)?intake.basis.filter(b=>b!==id):[...intake.basis,id as FoundationId]})}>{label}</button>;
 return <section className="first-experience" aria-label="轻量开始">
  <div className="quiz-topline"><span>{step < 3 ? `第 ${step + 1} 步 / 最多 3 步` : '由你决定是否试用'}</span><button className="text-link" disabled={disabled} onClick={() => onStart(null)}>不答题，先聊</button></div>
  <h1 ref={heading} tabIndex={-1}>{titles[step]}</h1>
  {step === 0 && <>
   <label htmlFor="first-issue">发生了什么？一句话也可以。</label><Textarea id="first-issue" maxLength={4000} value={intake.issue} onChange={e => update({ issue: e.target.value })} placeholder="不知道怎么说，也可以留空。"/>
   <fieldset className="first-options"><legend>现在的反应，可以不止一种</legend>{REACTIONS.map(r => <button type="button" key={r} aria-pressed={intake.reaction.includes(r)} onClick={() => update({ reaction: intake.reaction.includes(r) ? intake.reaction.replace(r, '').trim() : [intake.reaction, r].filter(Boolean).join(' ').slice(0,600) })}>{r}</button>)}</fieldset>
   <label htmlFor="first-reaction">也可以用自己的话修改</label><Textarea id="first-reaction" value={intake.reaction} maxLength={600} onChange={e => update({ reaction: e.target.value })}/>
   <p className="discovery-note">这些只说明你此刻的处境和反应，不用来判断你属于哪个学派。</p>
  </>}
  {step === 1 && <fieldset className="first-options"><legend>只选此刻想聊的，之后可以变</legend>{HELP_OPTIONS.map(h => <button key={h.id} aria-pressed={intake.help === h.id} onClick={() => update({ help: intake.help === h.id ? '' : h.id })}>{h.label}</button>)}<button aria-pressed={!intake.help} onClick={() => update({ help: '' })}>都不像，或我现在说不清。</button></fieldset>}
  {step === 2 && <><p className="lead">可以多选，也可以全部跳过。愿意探索，不等于已经认同；彼此冲突时，也不替你排先后。</p><fieldset className="first-options"><legend>这一次，我愿意尝试</legend>{Object.entries(BASIS_OPTIONS).filter(([id])=>primaryBasis.includes(id)).map(renderBasis)}<details className="more-bases"><summary>看看更多判断依据{intake.basis.some(id=>!primaryBasis.includes(id))?"（含已选）":""}</summary>{Object.entries(BASIS_OPTIONS).filter(([id])=>!primaryBasis.includes(id)).map(renderBasis)}</details></fieldset></>}
  {step < 3 && <><label htmlFor="first-note">自由补充（可留空）</label><Textarea id="first-note" maxLength={600} value={intake.note} onChange={e => update({ note: e.target.value })}/><div className="quiz-navigation"><Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>返回修改</Button><button className="text-link" onClick={() => { if (step === 1) update({ help: '' }); if (step === 2) update({ basis: [] }); advance(step + 1); }}>跳过这一步</button><Button onClick={() => advance(step + 1)}>{step === 2 ? '看看可探索的角度' : '继续'}</Button></div>{step === 1 && intake.help && <button className="text-link" onClick={() => advance(3)}>已有想聊的，直接看看角度</button>}</>}
  {step === 3 && <>
   <p className="lead">{candidates.every(c => !c.evidence) ? '信息还不足以推荐。下面是两种标明性质的体验入口，你可以拒绝或换一个。' : '这是根据本次明确表达提供的探索候选，没有人格结论或匹配分数。'}</p>
   <div className="first-original"><strong>同一个问题</strong><p>{intake.issue || '还没有具体问题，先体验怎样开始。'}</p>{intake.reaction && <p>此刻反应：{intake.reaction}</p>}{intake.note && <p>你的补充：{intake.note}</p>}</div>
   <div className="first-candidates">{candidates.map(c => { const base = content.bases.find(b => b.id === c.id)!; const intro = FOUNDATION_INTROS[c.id]; return <article key={c.id}>
    <span>{c.kind === 'example' ? '对照体验 · 非匹配' : c.kind === 'help' ? '根据本次求助方向' : '根据明确的探索意愿'}</span><h2>{base.shortName}</h2><p>{intro.core}</p>
    <h3>为什么值得看看</h3>{c.evidence && <blockquote>你刚才选择：“{c.evidence}”</blockquote>}<p>{c.reason}</p>
    <h3>怎样回应上面这个问题</h3><p>{applicationPreview(c.id,intake.issue)}</p><small>产品根据思想编写的应用预览；选定后，AI 会结合你的完整处境回答。</small>
    <h3>需要接受的前提与边界</h3><p>{intro.tradeoff}</p><div className="recommendation-actions"><Button disabled={disabled} onClick={() => onStart(c.id)}>先试{base.shortName}</Button><button className="text-link" onClick={() => onInspect(c.id)}>思想依据</button></div>
   </article>; })}</div>
   <div className="result-actions"><Button variant="outline" onClick={() => setStep(0)}>返回修改</Button><Button variant="outline" onClick={() => setOther(!other)}>换一个角度</Button><Button disabled={disabled} onClick={() => onStart(null)}>暂不选择，先回应这件事</Button></div>
   {other && <div className="first-options">{content.bases.filter(b => !candidates.some(c => c.id === b.id)).map(b => <button key={b.id} onClick={() => onInspect(b.id)}>了解{b.shortName}</button>)}</div>}
   <p className="discovery-note">只有你点击试用，才会确定当前基座。处境、情绪和求助意愿都不会自动成为个人原则。</p>
  </>}
  <button className="text-link deep-entry" onClick={() => urgent() ? onStart(null) : onDeep()}>想多了解自己？可选的 12 题深入探索</button>
 </section>;
}
