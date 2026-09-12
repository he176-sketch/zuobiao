import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { ChatInputSchema,needsUrgentSupport,supportAnswer,validateAnswer } from "@/lib/contracts";
import { buildGuide,foundations,guideMaterials } from "@/lib/guide";

const response=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
const limits=new Map<string,{at:number;count:number}>();
function config(){const e=env as unknown as Record<string,string|undefined>;return {key:e.PHILOSOPHY_API_KEY||e.OPENAI_API_KEY,base:e.PHILOSOPHY_API_BASE_URL||"https://api.openai.com/v1",model:e.PHILOSOPHY_MODEL,reasoning:e.PHILOSOPHY_REASONING_EFFORT||"xhigh"};}
export async function GET(){const c=config();const user=await getChatGPTUser();return response({ready:!!(c.key&&c.model),authenticated:!!user,storage:"device-only",sourcesVersion:"2026-09-12"});}
export async function POST(request:Request){
 const origin=request.headers.get("origin");
 if(origin&&origin!==new URL(request.url).origin)return response({error:"请求来源不一致，请重新打开页面。"},403);
 const user=await getChatGPTUser();if(!user)return response({error:"请先登录，再开始对话。"},401);
 if(!request.headers.get("content-type")?.includes("application/json"))return response({error:"请求格式不正确。"},415);
 const body=await request.text();if(new TextEncoder().encode(body).length>80000)return response({error:"这次内容太长了，请缩短后再试。"},413);
 let raw:unknown;try{raw=JSON.parse(body);}catch{return response({error:"请求内容无法读取。"},400);}
 const parsed=ChatInputSchema.safeParse(raw);if(!parsed.success)return response({error:"请检查问题、基座或原则内容后重试。"},400);
 const input=parsed.data;const base=foundations.find(b=>b.id===input.baseId)!;
 if(needsUrgentSupport(input.messages.at(-1)!.content))return response({answer:supportAnswer(),mode:"support",baseId:input.baseId,profileRevision:input.profileRevision,materials:guideMaterials(input.baseId)});
 const c=config();if(!c.key||!c.model)return response({error:"AI 对话尚未接通。你的问题仍在输入框里，可以先浏览基座或阅读示例。",code:"AI_NOT_CONFIGURED"},503);
 const now=Date.now();const bucket=limits.get(user.userId);if(bucket&&now-bucket.at<60000&&bucket.count>=6)return response({error:"刚才的问题有点密集，请稍等一分钟再继续。"},429);
 if(limits.size>500){for(const[k,v]of limits)if(now-v.at>60000)limits.delete(k);}
 limits.set(user.userId,bucket&&now-bucket.at<60000?{at:bucket.at,count:bucket.count+1}:{at:now,count:1});
 let api:URL;try{api=new URL(c.base.replace(/\/$/,"")+"/responses");if(api.protocol!=="https:")throw new Error();}catch{return response({error:"AI 服务配置需要修复，请稍后再试。"},503);}
 try{
  const result=await fetch(api,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${c.key}`},signal:AbortSignal.timeout(90000),body:JSON.stringify({model:c.model,input:[{role:"developer",content:buildGuide(input)},...input.messages],reasoning:{effort:c.reasoning},text:{format:{type:"json_object"}},stream:false,store:false,max_output_tokens:6500})});
  if(!result.ok)return response({error:result.status===429?"AI 服务暂时繁忙，请稍后重试。":"AI 服务暂时未能完成回答，请稍后重试。",code:"PROVIDER_ERROR"},502);
  const data=await result.json() as {status?:string;output?:{content?:{type:string;text?:string}[]}[]};const text=data.output?.flatMap(item=>item.content||[]).filter(part=>part.type==="output_text").map(part=>part.text||"").join("");
  if(data.status&&data.status!=="completed")throw new Error("INCOMPLETE_ANSWER");
  if(!text)throw new Error("EMPTY_ANSWER");
  const answer=validateAnswer(JSON.parse(text),base.sources.map(s=>s.id));
  return response({answer,mode:answer.needsImmediateSupport?"support":"ai",baseId:input.baseId,profileRevision:input.profileRevision,materials:guideMaterials(input.baseId)});
 }catch(e){return response({error:e instanceof Error&&/timeout|abort/i.test(e.name)?"回答花的时间有些长，问题已保留，可以重试。":"这次回答未通过内容与来源检查，请重试。",code:"INVALID_OR_TIMEOUT"},502);}
}
