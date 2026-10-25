import { z } from 'zod';
import type { FoundationId } from './discovery';

export const HELP_OPTIONS = [
 { id: 'judge', label: '想看清：这件事能不能说明我不行？', bases: ['stoic', 'pragmatic'] },
 { id: 'meaning', label: '想知道：没有回报，还要不要继续？', bases: ['camus', 'stoic'] },
 { id: 'conflict', label: '两边都放不下，先帮我看清取舍。', bases: ['confucian', 'camus'] },
 { id: 'practice', label: '我认同原则，却总在行动中违背。', bases: ['wang-yangming', 'aristotle'] },
 { id: 'wealth', label: '想多挣钱，也想保留当下生活。', bases: ['naval', 'epicurus'] },
 { id: 'standards', label: '想检查成功标准，看看别的生活可能。', bases: ['nietzsche', 'zhuangzi'] },
 { id: 'reasons', label: '评价有冲突，想知道哪些理由值得相信。', bases: ['socrates', 'luo-xiang'] },
 { id: 'action', label: '先帮我找一个现实中做得到的办法。', bases: ['pragmatic', 'stoic'] },
] as const;
export const BASIS_OPTIONS = {
 stoic: '试着用我认可的判断与行动衡量自己，不只看结果。',
 camus: '没有最终的意义保证，也试着寻找仍愿意投入的生活。',
 pragmatic: '让实际经历检验想法，发现不合适时可以改。',
 confucian: '把自己和他人的处境、具体责任一起放进判断。',
} as Record<FoundationId,string>;
BASIS_OPTIONS["wang-yangming"]="在具体事情里检查自欺，把认同的原则落实为行动。";
BASIS_OPTIONS["naval"]="用时间自主与生活代价，检验挣钱和追求的方向。";
BASIS_OPTIONS["nietzsche"]="审查借来的成功尺度，主动塑造愿意承担的生活。";
BASIS_OPTIONS["zhuangzi"]="松动“成功、有用”的固定标准，看看别的生活可能。";
BASIS_OPTIONS["epicurus"]="分辨必要需要与无限欲望，把长期安宁放进选择。";
BASIS_OPTIONS["aristotle"]="通过反复行动培养品格，结合具体处境判断尺度。";
BASIS_OPTIONS["luo-xiang"]="承认自己可能看错，既听取批评，也检查自我辩护。";
BASIS_OPTIONS["socrates"]="检查双方信念的理由，让较好的理由影响选择。";
export const REACTIONS = ['我不服，也有点嫉妒。', '很累，想先退缩一下。', '会自责，觉得自己不行。', '两边都想要，心里很矛盾。', '难受，但也想再试试。', '说不清，或者都不像。'];
export const IntakeSchema = z.object({
 issue: z.string().max(4000), reaction: z.string().max(600), help: z.string().max(80),
 note: z.string().max(600), basis: z.array(z.enum(["stoic","camus","pragmatic","confucian","wang-yangming","naval","nietzsche","zhuangzi","epicurus","aristotle","luo-xiang","socrates"])).max(12),
});
export type Intake = z.infer<typeof IntakeSchema>;
export const emptyIntake = (): Intake => ({ issue: '', reaction: '', help: '', note: '', basis: [] });
export function openingMessage(raw: Intake) {
 const input = IntakeSchema.parse(raw);
 return [input.issue.trim() || '我现在说不清具体的问题，想先体验一下怎样开始。',
  input.reaction.trim() && `我现在的反应：${input.reaction.trim()}`,
  HELP_OPTIONS.find(h => h.id === input.help)?.label && `这次希望得到的帮助：${HELP_OPTIONS.find(h => h.id === input.help)!.label}`,
  input.note.trim() && `我的补充：${input.note.trim()}`,
  input.basis.length && `这次愿意探索的判断依据（尚未确认成个人原则）：${input.basis.map(id => BASIS_OPTIONS[id]).join('；')}`,
 ].filter(Boolean).join('\n\n');
}
export function firstCandidates(raw: Intake) {
 const input = IntakeSchema.parse(raw);
 const help = HELP_OPTIONS.find(h => h.id === input.help);
 // ponytail: transparent editorial routing; no emotion or free-text classifier. Expand only after user evidence.
 const ids = [...new Set<FoundationId>([...input.basis, ...(help?.bases || []), 'stoic', 'camus'])].slice(0, input.basis.length > 2 ? 3 : 2);
 return ids.map(id => {
  const basis = input.basis.includes(id);
  const relevantHelp = help?.bases.some(b => b === id);
  return { id, kind: basis ? 'basis' : relevantHelp ? 'help' : 'example',
   evidence: basis ? BASIS_OPTIONS[id] : relevantHelp ? help!.label : null,
   reason: basis ? '你明确愿意试试这条判断依据，因此可以用它来回应刚才的问题。'
    : relevantHelp ? '根据你希望得到的帮助，提供这个可探索角度；这不表示你已经认同它。'
    : '这是供比较的体验入口，当前没有足够信息说它与你匹配。' };
 });
}
export const APPLICATION_PREVIEWS = {
 stoic: '先区分发生的事和你由此作出的评价，再问哪些行动体现你认可的公正、诚实与分寸。结果重要，但不能独自裁定你的价值；环境不合理时仍可行动。',
 camus: '先承认你期待的意义或认可可能没有得到回应，再辨认没有最终保证时仍值得投入的具体生活。反抗不等于不顾他人，也可以有共同改善处境的行动。',
 pragmatic: '把眼下的困惑拆成可检查的假设，比较不同安排对你和他人的实际影响，做一个成本可承受的小尝试，再据经验修订。有效不能只等同于赚钱或赢。',
 confucian: '同时看你自己的处境、相关人的具体需要和已经作出的承诺，以仁、诚信与合宜判断如何回应。关系不是服从命令；需要分辨哪些期待可协商、哪些责任应承担。',
} as Record<FoundationId,string>;
APPLICATION_PREVIEWS["wang-yangming"]="先检查知行落差发生在哪个选择，辨别利益、习惯、现实能力与自我辩护。良知与仁是这里的伦理前提，不以做不到直接裁定品德。";
APPLICATION_PREVIEWS["naval"]="区分财富、地位比较与实际自由，看能力如何为他人提供价值；再检查一项追求给生活保障、时间与安宁带来的真实变化，不承诺收入。";
APPLICATION_PREVIEWS["nietzsche"]="检查标准的形成与代价，分清只是否定别人，还是已有正面方向；自我塑造需要持续练习，不能用卓越之名伤害他人。";
APPLICATION_PREVIEWS["zhuangzi"]="检查评价场景是否过窄，自己的成见是否也遮住了可能。开放视角仍要核查事实和现实责任，不保证失败都有好处。";
APPLICATION_PREVIEWS["epicurus"]="比较一种欲望带来的快乐与长期代价，先保障基本需要，也重视友谊。不把简朴变成强制清贫或回避责任。";
APPLICATION_PREVIEWS["aristotle"]="看一项选择怎样服务长期生活，动机、品格练习与外部条件都重要；恰当尺度不等于折中，实践智慧也不只是效率。";
APPLICATION_PREVIEWS["luo-xiang"]="检查外界评价中的事实，也检查自己的反驳是否在逃避具体失误；承认有限仍可以判断与拒绝羞辱，不把谦卑变成自我贬低。";
APPLICATION_PREVIEWS["socrates"]="先给现有信息支持的判断，区分事实、标准和结论；以诚实、公正及审视生活为前提。缺少事实时说明条件与检验方法，不要求先回答问题才能获得帮助。";
export function requestsDirectHelp(text: string) {
 return /不想.{0,6}(答|问卷)|不想再回答|不要只反问|希望获得直接解释|不再.{0,4}问|别再.{0,8}(问|反问)|别.{0,4}一直反问|还没回答我/.test(text);
}

// Product-written previews of the supplied situation, not generated replies or quotations.
export function applicationPreview(id: FoundationId, issue: string) {
 const setback: Partial<Record<FoundationId,string>> = {
  stoic: '这次没有选上，说明结果不如预期，还不能说明你的全部努力和人品都不值。先检查准备中是否诚实、尽责，哪些判断可改进；同时承认评审与名额不由你保证。你可以索取反馈，再按实际成本决定继续还是停止。',
  camus: '认真准备却没有回应，会刺痛你对努力应有回报的期待。这里不保证失败自有意义。可以承认失望，再看即使没有入选保证，这个项目里是否仍有你愿意投入的部分；也允许暂停，不把坚持变成硬撑。',
  pragmatic: '先把“努力没有意义”缩小为可检查的问题：这次准备方式是否帮助了入选，哪里还没有证据？争取一条具体反馈，做一次成本有限的调整，再决定是否继续投入。修订做法不等于否定自己，也不保证下次成功。',
  confucian: '落选很难受，但一次评审不能独自裁定你有没有尽责、是否值得尊重。可以检查自己是否诚实对待工作、与合作者履行了什么承诺，再沟通下一步；没有相关承诺时，不给你凭空增加责任。',
 };
 const family: Partial<Record<FoundationId,string>> = {
  stoic: '你想自主，也在意家人。可以先辨认自己认可的责任，诚实说明选择；家人的感受值得关心，却无法由你保证。既不靠让所有人满意评价自己，也不借自由逃掉已经承诺的责任。',
  camus: '自主生活和亲人的认可都重要，这个冲突未必有圆满答案。可以辨认自己仍愿意过的生活，同时承认他人的尊严与需要；选择可能带来不被理解的代价，这个代价是否愿意承担，仍由你判断。',
  pragmatic: '先具体说清自由要改变什么、家人担心什么，再找一段时间或一个范围有限的试行安排，用真实影响检验双方的担心。有些分歧是价值冲突，试行不能替你决定谁更重要。',
  confucian: '你自己的需要也属于这段关系的真实处境。区分家人对你的具体依赖、已有承诺和一般期待，再坦诚协商。重视亲情并不等于照单全收，但表达分歧也可能需要耐心与代价。',
 };
 if (/(项目|准备)/.test(issue) && /(没选|没被选|落选)/.test(issue)) return setback[id] || APPLICATION_PREVIEWS[id];
 if (/家人/.test(issue) && /(自由|失望|期待)/.test(issue)) return family[id] || APPLICATION_PREVIEWS[id];
 return APPLICATION_PREVIEWS[id];
}
