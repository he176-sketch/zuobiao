'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import content from '@/lib/foundations.json';
import { DISCOVERY_QUESTIONS, FOUNDATION_INTROS, recommendFoundations, type DiscoveryAnswers, type FoundationId } from '@/lib/discovery';

type Props = {
 mode: 'entry' | 'quiz' | 'browse';
 onMode: (mode: Props['mode']) => void;
 onChoose: (id: string) => void;
 onInspect: (id: string) => void;
 disabled: boolean;
};

export default function FoundationDiscovery({ mode, onMode, onChoose, onInspect, disabled }: Props) {
 const [answers, setAnswers] = useState<DiscoveryAnswers>({});
 const [step, setStep] = useState(0);
 const heading = useRef<HTMLHeadingElement>(null);
 const finished = step === DISCOVERY_QUESTIONS.length;
 const current = DISCOVERY_QUESTIONS[step];
 const result = recommendFoundations(answers);
 useEffect(() => { if (mode === 'quiz') { heading.current?.focus({ preventScroll: true }); heading.current?.closest('section')?.scrollIntoView({block:'start',behavior:'instant'}); } }, [step, mode]);
 if (mode === 'browse') return <div className="discovery-return"><Button variant="outline" onClick={() => onMode('quiz')}><Compass size={17}/>{Object.keys(answers).length ? '回到我的生活选择' : '用 12 个生活选择找起点'}</Button></div>;
 if (mode === 'entry') return <section className="discovery-intro"><p className="eyebrow">先从熟悉的生活开始</p><h1>不用先懂哲学，<br/>先看看你怎样选择。</h1><p className="lead">面对期待、挫折与不确定，你会先在意什么？<br/>12 个日常情境，帮你找到值得先了解的思想起点。</p><div className="discovery-journey"><span>01 回答生活选择</span><span>02 看推荐与理由</span><span>03 选一个起点试用</span></div><div className="discovery-intro-actions"><Button onClick={() => onMode('quiz')}>开始 12 个生活选择<ArrowRight size={17}/></Button><button className="text-link" onClick={() => onMode('browse')}>直接浏览四个基座</button></div><p className="discovery-note">没有标准答案。可以跳过说不准的题，也可以随时回来修改。</p></section>;
 if (!finished) return <section className="discovery-question" aria-label="生活选择问卷"><div className="quiz-topline"><button className="text-link" onClick={() => onMode('browse')}>先去看看基座</button><span>第 {step + 1} 题 / {DISCOVERY_QUESTIONS.length}</span></div><div className="quiz-progress" role="progressbar" aria-label="问卷进度" aria-valuemin={0} aria-valuemax={12} aria-valuenow={step}><span style={{width:`${step / 12 * 100}%`}}/></div><p className="eyebrow">{current.topic}</p><h1 ref={heading} tabIndex={-1}>{current.title}</h1><p className="quiz-help">选择目前更接近你的想法，不必选“应该如此”的答案。</p><fieldset className="quiz-options"><legend className="sr-only">{current.title}</legend>{current.options.map((option, index) => <label key={option.id} className={`quiz-option ${answers[current.id] === option.id ? 'chosen' : ''}`}><input type="radio" name={current.id} value={option.id} checked={answers[current.id] === option.id} onChange={() => setAnswers(previous => ({...previous, [current.id]: option.id}))}/><span className="quiz-option-letter">{String.fromCharCode(65 + index)}</span><span>{option.label}</span>{answers[current.id] === option.id && <Check size={18} aria-hidden/>}</label>)}</fieldset><div className="quiz-navigation"><Button variant="ghost" onClick={() => step ? setStep(step - 1) : onMode('entry')}><ArrowLeft size={16}/>{step ? '上一题' : '返回'}</Button><button className="text-link" onClick={() => { setAnswers(previous => ({...previous, [current.id]: null})); setStep(step + 1); }}>这题说不准，跳过</button><Button disabled={!answers[current.id]} onClick={() => setStep(step + 1)}>{step === 11 ? '看看我的起点' : '下一题'}<ArrowRight size={16}/></Button></div><p className="discovery-note">答案只用于本次推荐，不会自动写进你的个人原则。</p></section>;
 return <section className="discovery-results"><div className="section-heading"><p className="eyebrow">从你的 {result.answered} 个生活选择出发</p><h1 ref={heading} tabIndex={-1}>{result.recommendations.length ? '这几个起点，值得你先看看。' : '还需要多了解你一点。'}</h1><p className="lead">{result.recommendations.length ? '先看它的内核，再判断自己是否愿意沿着这个方向尝试。' : '目前的回答还不足以支持推荐。再回答几题，或直接看看四种不同的起点。'}</p>{result.tied && <p className="result-tie">你的选择横跨几种思路，它们同样值得了解，不必急着把自己归为一类。</p>}</div>{result.omittedTies.length>0&&<div className="omitted-ties"><p>{result.omittedTies.map(id=>content.bases.find(base=>base.id===id)?.shortName).join("、")}也与你的回答同样接近，可以一起了解。</p>{result.omittedTies.map(id=><Button key={id} variant="outline" onClick={()=>onInspect(id)}>了解{content.bases.find(base=>base.id===id)?.shortName}<ArrowUpRight size={14}/></Button>)}</div>}<div className="recommendation-list">{result.recommendations.map((recommendation, index) => {
 const base = content.bases.find(item => item.id === recommendation.id)!;
 const intro = FOUNDATION_INTROS[base.id as FoundationId];
 return <article key={base.id} className={`recommendation-card ${index === 0 && !result.tied ? 'first' : ''}`}><div className="recommendation-header"><span className="eyebrow">{recommendation.kind === 'contrast' ? '也可以对照看看' : index === 0 && !result.tied ? '值得优先了解' : '同样值得了解'}</span><span>{base.kindLabel}</span></div><h2>{base.shortName}</h2><p className="recommendation-core">{intro.core}</p>{recommendation.kind === 'match' ? <div className="recommendation-evidence"><h3>为什么会推荐给你</h3><p>你在这些生活选择里表达了相近的思路：</p><ul>{recommendation.evidence.slice(0,2).map(e => <li key={e.question}>{e.answer}</li>)}</ul></div> : <div className="recommendation-evidence"><h3>为什么值得对照</h3><p>你的回答集中在一种思路上。这个不同的入口能帮你检验：换一个角度，你是否仍认同刚才的取舍。</p></div>}<dl><div><dt>它会带你怎样思考</dt><dd>{intro.direction}</dd></div><div><dt>选择前，也看看这一面</dt><dd>{intro.tradeoff}</dd></div></dl><div className="recommendation-actions"><Button disabled={disabled} onClick={() => onChoose(base.id)}>选择这个起点<ArrowRight size={16}/></Button><button className="text-link" onClick={() => onInspect(base.id)}>思想依据与完整介绍<ArrowUpRight size={14}/></button></div></article>;
 })}</div><div className="result-actions"><Button variant="outline" onClick={() => setStep(result.recommendations.length ? 0 : Math.max(0,DISCOVERY_QUESTIONS.findIndex(q => !answers[q.id])))}>回看并修改回答</Button><button className="text-link" onClick={() => onMode('browse')}>看看全部四个基座</button><button className="text-link" onClick={() => {setAnswers({});setStep(0);}}>重新回答</button></div><p className="discovery-note">推荐依据是这次回答与四种思想入口的对应关系。它是帮助选择的参考，你也可以选一个没有被推荐的基座。</p></section>;
}
