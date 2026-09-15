// Explicit live-provider acceptance probe. Constructed cases only; uses the existing local sign-in.
import { writeFile } from 'node:fs/promises';
import { ChatInputSchema, AnswerSchema } from '../lib/contracts.ts';
const origin = process.env.ZUOBIAO_TEST_ORIGIN || 'http://localhost:5175';
if (!['localhost','127.0.0.1'].includes(new URL(origin).hostname)) throw new Error('LOCAL_ONLY');
const signin = await fetch(`${origin}/signin-with-chatgpt`,{redirect:'manual'});
const cookie = signin.headers.getSetCookie().map(value=>value.split(';')[0]).join('; ');
const status = await fetch(`${origin}/api/chat`,{headers:{cookie}}).then(r=>r.json());
if(!status.ready||!status.authenticated)throw new Error('LOCAL_AI_OR_AUTH_UNAVAILABLE');
const question='认真准备的项目没选上，我觉得努力没有意义。';
const cases=[...['stoic','camus','pragmatic','confucian'].map(baseId=>({id:baseId,baseId,text:question})),{id:'unselected',baseId:null,text:'我不知道，也不想答这些题。'}, {id:'no-more-questions',baseId:'stoic',text:question+'\n你还没回答我，别再一直反问了。'}];
const results=[];
for(const item of cases.filter(item=>!process.argv[2]||process.argv[2].split(",").includes(item.id))){
 const result=await (async()=>{
 const payload=ChatInputSchema.parse({baseId:item.baseId,profileRevision:2,principles:[],messages:[{role:'user',content:item.text}]});
 const started=Date.now();
 try{
  const response=await fetch(`${origin}/api/chat`,{method:'POST',headers:{cookie,'Content-Type':'application/json',Origin:origin},body:JSON.stringify(payload),signal:AbortSignal.timeout(110000)});
  const result=await response.json();
  if(response.ok)AnswerSchema.parse(result.answer);
  return {case:item.id,constructed:true,request:payload,httpStatus:response.status,elapsedMs:Date.now()-started,result};
 }catch(e){return {case:item.id,constructed:true,request:payload,error:e.message,elapsedMs:Date.now()-started};}
})();results.push(result);console.log({case:result.case,status:result.httpStatus,elapsedMs:result.elapsedMs});
}
await writeFile(new URL(`../docs/evidence/first-experience/live-ai${process.argv[2]?'-retry-'+process.argv[2].replaceAll(',','-'):''}.json`,import.meta.url),JSON.stringify({executedAt:new Date().toISOString(),kind:'real local app route and real configured provider; synthetic input',results},null,2));
console.log(results.map(r=>({case:r.case,status:r.httpStatus,error:r.error,elapsedMs:r.elapsedMs})));
if(results.some(r=>r.httpStatus!==200))process.exitCode=1;
