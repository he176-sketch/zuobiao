// Explicit, counted real-provider acceptance. Constructed data only; never auto-retries.
import {readFile,writeFile} from 'node:fs/promises';
import {ChatInputSchema,AnswerSchema,answerText} from '../lib/contracts.ts';
const file=new URL('../docs/evidence/foundations-expansion/live-requests.json',import.meta.url);
let ledger;
try{ledger=JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;ledger={round:3,limit:14,previousRequests:0,previousCountConfirmedByUser:'2026-09-16: 此前未执行，已用 0 次',requests:[]};}
const questions={A:'我看见同龄人发展得更好，会觉得失败，但又不想过他们那样的生活。',B:'我认同一些原则，却总在实际选择中违背它们。',C:'我既想多挣钱，又不想为了挣钱牺牲现在的生活。',D:'别人说我失败，我又觉得他们的标准不对。我到底应该相信谁？请给出判断，不要只反问。'};
const cases={'wang-yangming':['wang-yangming','A'],naval:['naval','A'],nietzsche:['nietzsche','A'],zhuangzi:['zhuangzi','A'],epicurus:['epicurus','C'],aristotle:['aristotle','B'],'luo-xiang':['luo-xiang','D'],socrates:['socrates','D'],'socrates-followup':['socrates','D'],'nietzsche-recheck':['nietzsche','A'],'aristotle-recheck':['aristotle','B'],'naval-attribution-recheck':['naval','A'],'epicurus-taxonomy-recheck':['epicurus','C'],'online-wang':['wang-yangming','A']};
const requested=process.argv[2]?.split(',');
if(!requested?.length||requested.some(id=>!cases[id]))throw Error('Pass explicit known case IDs; no default calls.');
const reserveOnline=process.argv.includes('--reserve-online');
const origin=process.env.ZUOBIAO_TEST_ORIGIN||'http://localhost:5175';
if(!['localhost','127.0.0.1'].includes(new URL(origin).hostname))throw Error('LOCAL_ONLY');
let cookie='';
if(!reserveOnline){
 const signin=await fetch(`${origin}/signin-with-chatgpt`,{redirect:'manual'});cookie=signin.headers.getSetCookie().map(v=>v.split(';')[0]).join('; ');
 const status=await fetch(`${origin}/api/chat`,{headers:{cookie}}).then(r=>r.json());
 if(!status.ready||!status.authenticated||status.sourcesVersion!=='2026-09-16.03.1')throw Error('LOCAL_NOT_READY_OR_WRONG_CONTENT');
}
for(const id of requested){
 if(ledger.requests.some(r=>r.case===id))throw Error('ALREADY_ATTEMPTED_NO_AUTOMATIC_RETRY');
 if(ledger.previousRequests+ledger.requests.length>=ledger.limit)throw Error('ROUND_LIMIT_REACHED');
 const last=ledger.requests.slice(-2);if(last.length===2&&last.every(r=>r.result?.code&&r.result.code===last[0].result?.code))throw Error('TWO_CONSECUTIVE_SAME_ERRORS_STOP');
 const [baseId,questionId]=cases[id];const messages=[{role:'user',content:questions[questionId]}];
 if(id==='socrates-followup'){
  const previous=ledger.requests.find(r=>r.case==='socrates'&&r.httpStatus===200);if(!previous)throw Error('NO_SUCCESSFUL_SOCRATES_REPLY');
  messages.push({role:'assistant',content:answerText(previous.result.answer)},{role:'user',content:'不想再答问题，希望获得直接解释。请继续说明原问题中，我现在能判断什么、缺少什么，以及下一步怎样检验。'});
 }
 const payload=ChatInputSchema.parse({baseId,profileRevision:2,principles:[],messages});
 const record={sequence:ledger.previousRequests+ledger.requests.length+1,case:id,constructed:true,manualRecheckReason:id.includes('recheck')?(id.includes('attribution')?'修正产品推导归属后一次人工复验':id.includes('taxonomy')?'欲望分类精修后一次人工复验':'首次上游失败且其后已有成功，人工选定一次重试'):undefined,environment:reserveOnline?'owner-private-online':'local-app-real-provider',request:payload,startedAt:new Date().toISOString(),state:reserveOnline?'reserved-for-one-online-request':'attempting'};
 ledger.requests.push(record);await writeFile(file,JSON.stringify(ledger,null,2)+'\n');
 if(reserveOnline){console.log({sequence:record.sequence,case:id,state:record.state});continue;}
 const started=Date.now();
 try{
  const response=await fetch(`${origin}/api/chat`,{method:'POST',headers:{cookie,'Content-Type':'application/json',Origin:origin},body:JSON.stringify(payload),signal:AbortSignal.timeout(110000)});
  record.httpStatus=response.status;record.result=await response.json();if(response.ok)AnswerSchema.parse(record.result.answer);record.state=response.ok?'succeeded':'failed';
 }catch(e){record.state='failed';record.error=e.message;}
 record.elapsedMs=Date.now()-started;record.completedAt=new Date().toISOString();await writeFile(file,JSON.stringify(ledger,null,2)+'\n');
 console.log({sequence:record.sequence,case:id,status:record.httpStatus,state:record.state,elapsedMs:record.elapsedMs});
}
