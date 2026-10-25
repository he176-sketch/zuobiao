import { z } from 'zod';
import content from './foundations.json' with {type:'json'};
import expanded from './expanded-discovery.json' with {type:'json'};

export const DISCOVERY_VERSION = '2026-09-16.03';
export const FOUNDATION_IDS = ["stoic","camus","pragmatic","confucian","wang-yangming","naval","nietzsche","zhuangzi","epicurus","aristotle","luo-xiang","socrates"] as const;
export type FoundationId = typeof FOUNDATION_IDS[number];
type Option = { id: string; label: string; foundation?: FoundationId };
type Question = { id: string; topic: string; title: string; options: Option[] };

// These are editorial prompts for choosing a reading starting point, not a validated scale.
const scenes: [string, string, string, string, string, string, string][] = [
 ['setback','努力与结果','认真准备的项目，最后还是没有被选中。你最想先弄清什么？','哪些判断和行动值得改进，哪些结果确实不由我决定。','即使这次没有回报，这件事还有什么让我愿意继续投入。','哪一种准备方式更有效，下次能用什么小尝试来检验。','这件事里，我对合作的人是否尽责，也有没有需要坦诚沟通的地方。'],
 ['career','选择方向','一份稳定工作与一个新方向之间，你会怎样作决定？','先明确自己愿意负责的选择，再接受结果无法完全保证。','想想哪种生活值得我投入，即使没有人能保证它的意义。','先做一次成本可控的体验，让实际经历帮助我判断。','和受到影响的人谈清责任，再寻找彼此可以承担的安排。'],
 ['expectation','他人的期待','家人希望你走一条你并不喜欢的路。你会从哪里开始？','分清自己的判断与他人的评价，决定哪些事应由自己负责。','认真对待自己的生活选择，即使它暂时无法得到理解。','把担忧变成具体问题，试着用一段时间的实际表现来沟通。','理解期待背后的关心与责任，再谈双方都能承受的改变。'],
 ['meaning','日常的意义','日子过得还算顺利，你却常问“这样生活是为了什么”。哪句话更接近你？','我想知道，今天怎样行动才算没有辜负自己认可的品格。','也许暂时没有终极答案，但我仍想认真经历眼前的生活。','我想多做几种真实的尝试，看看什么让我持续投入。','我想在关心的人和日常责任里，找到自己愿意成为的样子。'],
 ['criticism','面对评价','一个重要的人否定了你的选择。你希望自己怎样回应？','检查他说得是否有道理，不让评价直接决定我的价值。','允许意见不一致，仍为自己愿意过的生活承担代价。','找出可以核实的部分，让之后的事实帮助双方修正判断。','既坦诚说明自己的想法，也照顾关系里需要修复的部分。'],
 ['promise','承诺与变化','你答应帮朋友一件事，后来发现它会挤占自己的重要计划。你更想先问？','怎样做才符合我认可的诚信与分寸，同时认真对待自己的安排。','这是我仍愿意承担的承诺吗？我愿意为哪一种选择付出代价。','有没有调整时间或范围的办法，让实际安排比二选一更合适。','朋友具体依赖我什么？怎样协商才不辜负这段关系。'],
 ['uncertainty','无法确定的事','一件重要事情迟迟没有结果，你会怎样让自己继续生活？','把精力放回现在可以负责的准备与回应。','承认不确定不会马上消失，同时保留生活里值得投入的部分。','寻找新的信息或做一次验证，逐步减少不知道的部分。','与相关的人说明情况，安排好等待期间彼此的责任。'],
 ['change','修改自己的想法','一种你相信多年的想法，让你在现实里遇到了困难。你会怎么检查它？','重新审视其中的价值判断，看看它是否把外在结果看得太重。','看看它是否逼我接受一个封闭答案，压住了具体生活的复杂性。','找出它在哪些情境失效，根据经验修订或放弃它。','看看它是否让人与人之间失去体谅，偏离了合宜的相处方式。'],
 ['unfairness','不公平的处境','团队里有人受到不公平对待，你更愿意怎样确定自己的位置？','先守住自己不参与伤害的原则，再选择能负责的行动。','不把不公平当成应当接受的命运，寻找可以一起改变它的人。','比较不同办法的后果，尝试能切实改善处境的做法。','认真听受影响的人说话，并履行自己在团队关系里的责任。'],
 ['regret','面对后悔','你曾经作出一个如今看来不理想的决定。哪种思考更能帮助你？','按当时的信息重新看待判断，把注意力放回现在能做的事。','不要求过去给出完美解释，承认代价，并继续投入此后的生活。','从结果中找出哪些假设不成立，让下一次决定有所不同。','想想有哪些关系与承诺需要修复，用之后的行动补上。'],
 ['goodday','怎样算过得好','回顾一个普通的星期，什么最能让你觉得“这周过得值得”？','遇到难处时，我仍按自己认可的判断和品格行动。','虽然很多问题没有答案，我仍有真实投入与亲身经历的时刻。','我尝试了一件事，也根据收获调整了接下来的方向。','我认真对待了身边的人，也在具体责任里有所成长。'],
 ['tradeoff','愿意接受的取舍','下面哪一种不轻松的部分，你更愿意慢慢练习？','认真负责地行动，同时接受自己不能保证所有结果。','不急着消除所有意义上的疑问，仍坚持投入具体生活。','把自己的判断当作可修订的，在新经验面前改变想法。','面对关系里的复杂责任，在自我需要与他人处境之间反复斟酌。'],
];

export const DISCOVERY_QUESTIONS: Question[] = scenes.map(([id, topic, title, ...labels], index) => {
 id = `explore-${id}`;
 const options: Option[] = labels.map((label, i) => ({ id: `${id}-${i}`, label: `我愿意试着这样想：${label}`, foundation: FOUNDATION_IDS[i] }));
 const offset = index % options.length;
 const additional:Option[]=Object.entries(expanded).map(([foundation,choices])=>({id:`${id}-${foundation}`,label:`我愿意试着这样想：${choices[index]}`,foundation:foundation as FoundationId}));
 return { id, topic, title, options: [...options.slice(offset), ...options.slice(0, offset), ...additional, {id:`${id}-tired`,label:'我很疲惫，想先躲一会儿。'}, {id:`${id}-angry`,label:'我不服，也嫉妒，暂时不想讲道理。'}, {id:`${id}-unsure`,label:'我很矛盾，说不清，或者都不像。'}] };
});

export const FOUNDATION_INTROS = {
 stoic: { core: '把好的生活放在自己的判断、品格与行动上，分清哪些事情取决于自己。', direction: '遇到困惑时，先检验对事情的判断，再决定自己能够负责的下一步。', tradeoff: '需要练习接受结果无法完全控制；接受这一点，也可以继续改变不合理的环境。', sourceIds: ['epictetus-handbook', 'sep-epictetus'] },
 camus: { core: '人在寻找意义，世界却未必给出最终答案；仍可以保持清醒，在生活、反抗与共同尊严中投入。', direction: '允许问题暂时没有结论，同时辨认仍愿意投入的生活，以及需要与他人共同改变的处境。', tradeoff: '它不会提供一个保证万事都有意义的总答案，也不要求你独自硬撑。', sourceIds: ['sep-camus', 'iep-camus'] },
 pragmatic: { core: '把判断当作可以接受经验检验的想法，在行动、结果与反思中不断修订。', direction: '把大困惑拆成具体问题，用承担得起的尝试，逐步形成更可靠的判断。', tradeoff: '需要投入实践并愿意改主意；眼前有效不自动等于合乎价值或长期有益。', sourceIds: ['james-pragmatism', 'dewey-how-we-think', 'sep-pragmatism'] },
 confucian: { core: '在与人的关系中学习仁、诚信与合宜，借助日常实践成为自己认可的人。', direction: '先看具体处境、关系与责任，再协调自己的需要，选择有体谅也有分寸的行动。', tradeoff: '不同关系的责任可能冲突，需要斟酌；重视关系不等于无条件服从。', sourceIds: ['analects-legge', 'sep-confucius'] },
} as Record<FoundationId, {core:string;direction:string;tradeoff:string;sourceIds:string[]}>;
for(const base of content.bases.slice(4)) FOUNDATION_INTROS[base.id as FoundationId]={core:base.principles[0].claim,direction:base.tagline,tradeoff:base.boundaries.map(b=>b.text).join(' '),sourceIds:base.sources.map(s=>s.id)};

export const DiscoveryAnswersSchema = z.record(z.string(), z.string().nullable());
export type DiscoveryAnswers = z.infer<typeof DiscoveryAnswersSchema>;
export type Recommendation = { id: FoundationId; score: number; kind: 'match' | 'contrast'; evidence: { question: string; answer: string }[] };

export function recommendFoundations(raw: unknown) {
 const answers = DiscoveryAnswersSchema.parse(raw);
 const entries = FOUNDATION_IDS.map(id => ({ id, score: 0, kind: 'match' as const, evidence: [] as Recommendation['evidence'] }));
 let answered = 0;
 for (const question of DISCOVERY_QUESTIONS) {
  const selected = question.options.find(option => option.id === answers[question.id]);
  if (!selected?.foundation) continue;
  answered++;
  const entry = entries.find(candidate => candidate.id === selected.foundation)!;
  entry.score++;
  entry.evidence.push({ question: question.title, answer: selected.label });
 }
 const sorted = [...entries].sort((a, b) => b.score - a.score);
 if (answered < 4) return { answered, recommendations: [] as Recommendation[], tied: false, omittedTies: [] as FoundationId[] };
 const matches: Recommendation[] = sorted.filter(entry => entry.score > 0).slice(0, 3);
 // A contrasting option is explicitly distinguished from a match; no evidence is invented.
 if (matches.length === 1) {
  const contrast: Record<FoundationId, FoundationId> = { stoic:'pragmatic',pragmatic:'stoic',camus:'confucian',confucian:'camus','wang-yangming':'aristotle',aristotle:'wang-yangming',naval:'epicurus',epicurus:'naval',nietzsche:'zhuangzi',zhuangzi:'nietzsche','luo-xiang':'socrates',socrates:'luo-xiang' };
  matches.push({ ...entries.find(entry => entry.id === contrast[matches[0].id])!, kind: 'contrast' });
 }
 const cutoff=matches.filter(item=>item.kind==="match").at(-1)?.score;
 const omittedTies=sorted.filter(item=>item.score===cutoff&&!matches.some(match=>match.id===item.id)).map(item=>item.id);
 return { answered, recommendations: matches, tied: sorted[0].score === sorted[1].score, omittedTies };
}
