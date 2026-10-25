"use client";

import { ArrowUpRight, Check, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { thinkingTools } from "@/lib/knowledge";
import type { PhilosophySupplement, ThinkingToolSnapshot } from "@/lib/contracts";

export function ThinkingLibrary({selectedId,onInspect,disabled}:{selectedId:string|null;onInspect:(id:string)=>void;disabled:boolean}){
 return <>
  <div className="section-heading"><p className="eyebrow">换一个问法，让下一步更清楚</p><h1>给眼前的事，一个思考工具。</h1><p className="lead">基座帮助你辨认什么值得。工具帮助你比较选择、检验判断，把问题拆小一点。</p><p className="discovery-note">从最像你现在处境的一项开始，也可以直接去聊。工具随时可以换。</p></div>
  <div className="thinking-grid">{thinkingTools.map((tool,i)=><article className="thinking-card" key={tool.id}>
   <div className="card-top"><span className="serial">0{i+1}</span>{selectedId===tool.id?<span className="selected-label"><Check size={13}/>已带入对话</span>:<Lightbulb size={18} strokeWidth={1.4}/>}</div>
   <p className="tool-situation">{tool.purpose}</p><h2>{tool.name}</h2><p>{tool.core}</p>
   <Button variant="outline" disabled={disabled} onClick={()=>onInspect(tool.id)}>看看怎样用<ArrowUpRight size={16}/></Button>
  </article>)}</div>
  <div className="knowledge-note"><p>精选并改编自 KC Chien 的 Model Thinking，每张卡都补充了方法来源和适用边界。</p><a href="/knowledge/thinking-tools.json" download>下载工具资料</a><a href="/knowledge/licenses/model-thinking.txt" target="_blank" rel="noreferrer">MIT 许可与署名</a></div>
 </>;
}

export function ProvenanceNote({provenance}:{provenance:ThinkingToolSnapshot["provenance"]}){
 return <div className="provenance-note"><p>改编来源：{provenance.author} · <a href={`${provenance.repository}/blob/${provenance.commit}/${provenance.path}`} target="_blank" rel="noreferrer">查看原始条目</a></p><p>{provenance.changes}</p><a href={provenance.licenseUrl} target="_blank" rel="noreferrer">{provenance.license}</a></div>;
}

export function ToolReading({tool}:{tool:ThinkingToolSnapshot}){
 return <>
  <section><h3>它帮助你看见什么</h3><p>{tool.core}</p><small>{tool.kind}</small></section>
  <section><h3>可以这样想一遍</h3><ol className="tool-steps">{tool.steps.map(step=><li key={step}>{step}</li>)}</ol><p className="reading-question">{tool.question}</p></section>
  <section><h3>用到这里，需要停一下</h3><p>{tool.boundary}</p></section>
  <section><h3>方法从哪里来</h3><ul className="source-list">{tool.sources.map(s=><li key={s.id}><a href={s.url} target="_blank" rel="noreferrer">{s.title}</a><p>{s.author}</p><p>{s.sections.join("；")}</p></li>)}</ul><ProvenanceNote provenance={tool.provenance}/></section>
 </>;
}

export function PhilosophyReading({supplement}:{supplement:PhilosophySupplement}){
 return <section><h3>把思想再展开一点</h3>{supplement.positions.map(position=><article key={position.axisId}><h4>{position.title}</h4><p>{position.claim}</p><small>需要接受的取舍：{position.tradeoff}</small></article>)}<ProvenanceNote provenance={supplement.provenance}/><small>{supplement.note}</small></section>;
}

export function KnowledgeNotice(){
 return <div className="knowledge-note"><p>补充思想资料选编自 Fabrice Gallet 的 Philoscopia，中文改编按 CC BY-SA 4.0 提供。思考工具选编自 KC Chien 的 Model Thinking，保留 MIT 版权与许可。上游的思想定位是编者解释，未经心理测量验证；本应用未使用其权重给用户分类。</p><p>原有基座转述、生活练习与补充内容分别标注来源。外部论文、原著与百科提供核查链接，其全文不包含在改编许可内。</p><a href="/knowledge/philosophy-lenses.json" download>下载哲学补充资料</a><a href="/knowledge/licenses/philoscopia.txt" target="_blank" rel="noreferrer">CC BY-SA 4.0 全文</a><a href="/knowledge/thinking-tools.json" download>下载思考工具</a><a href="/knowledge/licenses/model-thinking.txt" target="_blank" rel="noreferrer">MIT 全文</a></div>;
}
