import { z } from "zod";

export const BASE_IDS = ["stoic", "camus", "pragmatic", "confucian"] as const;
export const BaseIdSchema = z.enum(BASE_IDS);
export const ProposalSchema = z.object({text:z.string().min(1).max(500),reason:z.string().max(600),boundary:z.string().max(600)}).strict();
export const PrincipleSchema = ProposalSchema.extend({id:z.string().min(1).max(100),origin:z.string().max(80),version:z.number().int().positive(),updatedAt:z.string().max(50)});
export const ProfileSchema = z.object({schemaVersion:z.literal(1),baseId:BaseIdSchema.nullable(),revision:z.number().int().positive(),principles:z.array(PrincipleSchema).max(20),history:z.array(z.object({revision:z.number().int(),at:z.string(),detail:z.string().max(700)})).max(100)});
export type Profile = z.infer<typeof ProfileSchema>;
export type Principle = z.infer<typeof PrincipleSchema>;
export type Proposal = z.infer<typeof ProposalSchema>;
export const SourceSnapshotSchema=z.object({id:z.string(),url:z.string().url().refine(v=>v.startsWith("https://")),title:z.string(),author:z.string(),publisher:z.string(),sections:z.array(z.string())});
export const MaterialSnapshotSchema=z.object({version:z.string(),name:z.string(),scope:z.string(),principles:z.array(z.object({title:z.string(),claim:z.string(),sourceIds:z.array(z.string())})),sources:z.array(SourceSnapshotSchema)});
export type SourceSnapshot=z.infer<typeof SourceSnapshotSchema>;
export type MaterialSnapshot=z.infer<typeof MaterialSnapshotSchema>;
export const emptyProfile=():Profile=>({schemaVersion:1,baseId:null,revision:1,principles:[],history:[]});
export const ChatInputSchema=z.object({baseId:BaseIdSchema,profileRevision:z.number().int().positive(),principles:z.array(PrincipleSchema).max(20),messages:z.array(z.object({role:z.enum(["user","assistant"]),content:z.string().min(1).max(6000)}).strict()).min(1).max(12)}).strict().refine(v=>v.messages.at(-1)?.role==="user","最后一条必须是用户问题");
export const AnswerSchema=z.object({understanding:z.string().min(1).max(2200),perspective:z.string().max(3000),nextStep:z.string().max(1800),question:z.string().max(600),sourceIds:z.array(z.string().max(100)).max(6),principleProposal:ProposalSchema.nullable(),needsImmediateSupport:z.boolean()}).strict();
export type Answer=z.infer<typeof AnswerSchema>;
export type ChatInput=z.infer<typeof ChatInputSchema>;
export type Message={id:string;role:"user"|"assistant";content:string;answer?:Answer;mode?:"ai"|"example"|"support";baseId:string;revision:number;principlesSnapshot:Principle[];materials?:MaterialSnapshot};
export function validateAnswer(raw:unknown,allowedIds:string[]):Answer{
 const a=AnswerSchema.parse(raw);
 if(a.needsImmediateSupport)return {...a,principleProposal:null,sourceIds:[],perspective:"",nextStep:a.nextStep};
 if(a.sourceIds.some(id=>!allowedIds.includes(id)))throw new Error("INVALID_SOURCE");
 if(!a.needsImmediateSupport&&!a.sourceIds.length)throw new Error("MISSING_SOURCE");
 return a;
}
export function updateProfile(p:Profile,change:Partial<Pick<Profile,"baseId"|"principles">>,detail:string):Profile{
 const revision=p.revision+1;
 return ProfileSchema.parse({...p,...change,revision,history:[...p.history,{revision,at:new Date().toISOString(),detail}].slice(-100)});
}
export function needsUrgentSupport(text:string):boolean{
 // Strip only attributed/quoted spans, never an entire message containing other first-person statements.
 const ownText=text.split(/([。！？!?\n])/).map(sentence=>{
  const withoutQuotes=sentence.replace(/[“「『"][^”」』"]*[”」』"]/g,quoted=>/(?:小说|台词|引用|这句话)/.test(sentence)?"":quoted);
  return withoutQuotes.replace(/^\s*(?:我的)?(?:朋友|同事|家人|他|她|别人).{0,8}?(?:说|提到)[^，,。！？!?\n]*(?:[，,]|$)/g,"");
 }).join("");
 const t=ownText.replace(/[\s\u200b-\u200d\uFEFF]/g,"").replace(/(?:没有|并不|不曾|不会|不打算)(?:想死|自杀|想自杀|伤害自己)/g,"").replace(/(?:donot|don't|never)wanttodie/gi,"");
 // Supplemental deterministic safety net. Contextual risk is also assessed by the model.
 return /不想活(?:了|下去|$|[。！!?？])|不想再活|我(?:真的|好|很)?想死|我.{0,4}(?:想自杀|要自杀)|准备.{0,12}(伤害自己|自杀|结束生命)|马上.{0,12}(伤害自己|自杀)|已经.{0,10}(吞药|割腕|服药过量)|iwanttodie|(?:will|goingto|plan to)killmyself|endmylife/i.test(t);
}
export function supportAnswer():Answer{return {understanding:"听起来你此刻非常痛苦。你提到了伤害自己，我会认真对待。我们先让你安全地度过眼前这一会儿。",perspective:"",nextStep:"请先离开可能伤到自己的东西或地点，去有人陪着的地方，联系一个信任的人来陪你。如果已经受伤、服药过量，或觉得自己马上会行动，请立即联系当地急救或前往急诊，不要等待聊天回复。",question:"你现在有没有已经伤害自己，或者准备马上行动？身边有人能来陪你吗？",sourceIds:[],principleProposal:null,needsImmediateSupport:true};}
export function answerText(a:Answer){return [a.understanding,a.perspective,a.nextStep,a.question].filter(Boolean).join("\n\n");}
