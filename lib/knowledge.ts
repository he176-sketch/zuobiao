import content from "./foundations.json" with {type:"json"};
import tools from "../public/knowledge/thinking-tools.json" with {type:"json"};
import lenses from "../public/knowledge/philosophy-lenses.json" with {type:"json"};

export const thinkingTools=tools.cards;
export const philosophyLenses=lenses.cards;
export function knowledgeMaterials(baseId:string,thinkingToolId?:string|null){
 const base=content.bases.find(b=>b.id===baseId);
 if(!base)throw new Error("UNKNOWN_FOUNDATION");
 const thinkingTool=thinkingToolId?thinkingTools.find(t=>t.id===thinkingToolId):undefined;
 if(thinkingToolId&&!thinkingTool)throw new Error("UNKNOWN_THINKING_TOOL");
 return structuredClone({version:content.version,name:base.shortName,scope:base.historicalScope,principles:base.principles,boundaries:base.boundaries,sources:[...base.sources,...(thinkingTool?.sources||[])],philosophySupplement:philosophyLenses.find(p=>p.baseId===baseId),...(thinkingTool?{thinkingTool}:{})});
}
