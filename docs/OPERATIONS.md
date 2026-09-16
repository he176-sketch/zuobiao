# 运行与配置

## 当前部署：原 Pages 地址独立运行

分享入口 **https://yuechengai.pages.dev/**，复用负责人现有 `yuechengai` Pages 项目。原应用的完整 Worker、静态资源、邀请码与对话接口直接在 Cloudflare 运行，不再转发 Sites。原个人站部署 `f3f59fc4-9470-48cc-abd5-27b80defcd75` 保留；Sites version 5 / 7 保留，旧 version 7 当前 AI 已关闭。2026-09-16 的 Pages 网关尝试因负责人无 VPN 验收失败已被替换，不能回退网关并声称直连修复。

生产设置在 `deploy/pages/wrangler.json`：现有模型、`TRIAL_ENABLED`、`SITE_PUBLIC_ENABLED` 和 D1 绑定。DB 为负责人账户里的 `zuobiao-trial` / `da7beafc-88aa-475a-821a-3e7ef43fa016`；13 字段原用量完整迁入，没有清零。密钥 `PHILOSOPHY_API_KEY` 和 `TRIAL_INVITE_HASHES` 只存 Pages production secrets，不写入配置或构建。预览 TRIAL_ENABLED=false 且不提供模型密钥。平台 production 与 preview 均保持 fail_open=false，超出 Function 额度时拒绝服务。

发布：应用改动先按锁文件构建 `npm run build`，检查产物；本次应用未改，沿用已验证的 version 7 构建。在干净工作分支提交并推送后，运行 `node scripts/deploy-pages.mjs main`。这里 main 只是 Pages 的生产标记，不会修改 GitHub main。脚本把服务器 JS 模块装入 `_worker.js/`，只复制许可、知识与前端资产；在隔离目录以 Wrangler `--no-bundle` 发布并清除临时目录。`codex-pages-native-check` 用于预览。不要把 `.env`、docs、验收材料或 owner 私密文件加入上传目录。

关闭 AI：把配置中生产 `TRIAL_ENABLED` 设为 false，提交并重新部署，核验 ready=false 和持码请求被拒绝。撤销邀请码：在 Pages production secret `TRIAL_INVITE_HASHES` 中将五槽全部设为 null，然后重新部署；旧 Cookie 同时失效。换码使用新码 SHA-256 的首槽、其余 null，私下更新领取文件。管理可由负责人直接请 Codex 执行，无需提供明文密钥，也无公开管理接口。Wrangler secret 命令须在项目外临时目录执行以避开 Vinext 配置重定向。

恢复私人状态须同时处理两个平台：先令 Pages 的 TRIAL_ENABLED=false、SITE_PUBLIC_ENABLED=false 并部署，检查 Pages、已有绑定域名与部署别名均拒绝；其他历史部署别名仍可能服务其保存的公开版本，完整撤销外部浏览需要在 Cloudflare 对预览/旧部署设 Access 或删除相应部署，并保留本地源与版本恢复标识。再把 Sites 设置 owner-only，核验 Sites 原址和 zuobiao 子域名匿名拒绝。必要时在 owner-only 下恢复 version 5；它不读取 TRIAL_ENABLED，要持续禁用 AI 必须另行移除模型配置。重新部署旧代码不会自动恢复访问权限。当前没有执行生产私人回退演练。

当前用量真源是新 D1；重新启用旧 Sites AI 前必须先关闭 Pages AI 并迁回最新计数，不允许让两份计数各自运行或回退数据库。仅恢复原个人站可以回滚上述保留的 Pages 部署，但这不撤销 Sites 的公开权限。Pages 原址浏览器记录保持原域，旧 Sites 域名的数据不会自动迁来；未复制或清空私人对话。

免费 Pages 地址与 Free 方案不新增订阅；账户显示每日 100,000 Function/Worker 共享请求额度，本实现所有页面、静态和 API 都会调用 Function。D1 亦受免费读写与存储额度约束，数据库不可用时 AI 拒绝生成。模型仍按原供应商计费，不作金额估算，不自动升级。[Pages 费用](https://developers.cloudflare.com/pages/functions/pricing/)、[高级模式](https://developers.cloudflare.com/pages/functions/advanced-mode/)。具体发布回执、验证和直连未验证项见 CONTROL.md 顶部。

## 当前规则：累计次数上限取消

负责人在第 04 轮后续明确取消每码 10 次和全站 50 次累计上限，改用一个共享邀请码。旧随机码全部撤销；当前码私下保存在 `/Users/lihe/.config/zuobiao-trial/invitations.json`（0600），不写入仓库、前端或网址。访客在页面填写当前码即可使用，无需 ChatGPT 注册。模型调用继续产生供应商接口费用；保留全部访客共享的 10 秒发送间隔、全站 2 秒间隔、请求 1MB、每条 12000 字、最多 12 条上下文与单次生成 6500 tokens 边界。

关闭 AI：在 Pages 配置把 `TRIAL_ENABLED` 设为 false，然后重新部署当前应用。撤销共享码：把 secret `TRIAL_INVITE_HASHES` 的五槽数组全部设为 null 并重新部署，所有持码者及旧 Cookie 随即失效。换码：第一个槽位改为新码 SHA-256，其余为 null；同样重新部署。退出试用只删除当前浏览器邀请码 Cookie，不删除私人对话。

数据库追加 `0001` 迁移，只移除累计上界并完整复制原计数和时间戳。`first-50` 为历史行 ID，不再代表配额；`total` 与各槽位用量持续累计，失败仍计入。不得清零或自动补建缺失行，数据库异常时暂停生成。迁移期间先关闭旧版 AI，避免复制表时仍有新请求写入。下文 50/10 次、固定五份随机码的交付快照仅描述 version 6 历史，已由本节覆盖。

恢复私人访问以本文开头的双平台关闭步骤为准，再考虑回退代码。保留当前版本及 `TRIAL_ENABLED=false` 可保持 AI 关闭。version 6 会恢复应用累计上限、且不支持当前短码；version 5 不读取试用开关，回退时必须另行禁用模型配置才能持续关闭 AI。不要回退数据库或恢复旧邀请码。准确版本和新发布回执见 CONTROL.md。

自定义入口 **<https://zuobiao.aiyuecheng.cn> 已生效**，复用已有域名与现有 Sites，不新购托管。DNS 与 HTTPS 证书均 active，当前网络下匿名页面与邀请码接口已通过；负责人已反馈该新网址无 VPN 显示错误，原 Pages 地址能打开；因此以本文新增的 Pages 替换方案继续交付。新旧域名的 Cookie 和本机记录互相隔离，需重新填写邀请码，记录不会自动迁移；旧站可以导出备份，现有应用没有导入入口。关闭 AI 或恢复 owner-only 后必须分别核验新旧网址。撤下新入口只需移除本次 Sites 自定义域名绑定及三条 DNS 记录，不触碰原根域和 www。

## 本地

要求 Node.js 22.13+。沿用锁文件安装：`npm ci`。

把 `.env.example` 复制为 `.env`，以 0600 权限保存。设置 `PHILOSOPHY_API_KEY`；其余配置按用户指定为小小 API、`gpt-5.6-sol`、Responses、`xhigh`。不要把密钥放在浏览器、源代码、提交或日志中。

`npm run dev` 启动本地预览；当前版本的真实对话必须通过邀请码和 D1 频率检查，开发测试身份不授予调用资格。`npm run typecheck` 检查类型；`npm test` 运行关键业务边界测试。当前打包和发布按本文开头 Pages 流程；保留旧 Sites 元数据用于恢复。

## AI 接口

- `GET /api/chat` 仅返回是否已配置、存储模式和内容版本，不返回密钥。
- `POST /api/chat` 要求服务端验证的有效试用邀请码，并检查来源、请求格式、大小、角色、明确选定或为 null 的基座、可选 thinkingToolId 和原则数量。请求以流式读取累计限制为 1,000,000 字节，覆盖严格 schema 允许的中文原则与多轮历史。
- 使用服务端 `PHILOSOPHY_API_BASE_URL + /responses`，规则作为 developer 消息传入（实测该代理的独立 instructions 与 JSON 模式组合会返回 502），`store: false`，多轮上下文由本次请求显式携带。
- 本版实际验证的路径为 `https://www.xiaoxiaoapi.com/responses`。不要擅自追加 `/v1` 或更换用户指定的模型。
- 客户端停止等待会中止 fetch；客户端最多等待 100 秒（包含响应正文读取），服务器把请求取消与 90 秒超时信号传给提供商；Workers 开启 `enable_request_signal`。提供商收到取消后是否立即停止计算，取决于其实现。
- 超时、空输出、不完整 JSON、无来源或未知来源均显示失败并保留输入，不返回伪装成 AI 的预写回答。
- 提供商是否保留请求仍由其自身政策决定；`store:false` 不等于所有服务端日志不存在。

## 部署

`.openai/hosting.json` 保留旧 Site 恢复标识；当前实际发布源为 `deploy/pages/`，生产密钥通过 Pages secret 配置。产品页面公开，AI 继续受邀请码和持久频率检查保护。

源仓库独立位于本项目，不能把父目录中的 Writing 或其他材料提交到 Site。发布前检查 `.env` 被忽略，构建产物中不含密钥，并使用同一提交完成推送、打包、保存版本和部署。

## 明确限制

- 当前已取消累计次数上限，D1 原子记录用量并限制频率；模型接口费用仍按供应商计费。
- 同设备多标签页使用 Web Locks（可用时）与存储版本核对。其他页面修改或清除后，旧页暂停保存并要求刷新。多键写入失败会尝试回滚；清空后只留匿名协调标识，不保存原内容。
- 目前没有跨设备同步。浏览器存储不可用时必须显示失败，允许导出当前内容，不声称保存成功。
- 安全关键词是补充兜底，不能完整理解语言；正常在线对话仍需要模型结合上下文判断。持续维护误判、遗漏和高风险情境测试。
- 历史消息标记其作答时的原则修订号，避免将用户后来改过的偏好误认成旧回答错误。服务器返回实际采用的材料快照，浏览器不从旧页面材料重新生成。
- 模型没有自动修改用户基座或原则的工具。所有写入由可见的用户确认触发。
- WebMCP 仅暴露列出基座和打开详情，不允许静默替用户选择或保存信念。

## 参考实现与文档

- [OpenAI Responses 文档](https://developers.openai.com/api/docs/guides/text)
- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [gpt-5.6-sol 官方文档](https://developers.openai.com/api/docs/models/gpt-5.6-sol)
- [AI SDK 消息结构](https://ai-sdk.dev/docs/reference/ai-sdk-core/ui-message)
- 开源方案取舍见 `REUSE-RESEARCH.md`。已选编两套开源内容，固定版本与许可见 `../THIRD_PARTY_NOTICES.md`；未引入额外聊天或 RAG 框架。

## 工具与历史兼容

`thinkingToolId` 可省略或为 null，非空时必须属于六个已知 ID。服务器按 ID 读取受控材料，不接受客户端提交工具正文。返回的 `materials.thinkingTool` 和 `materials.philosophySupplement` 均为可选，旧消息无需迁移。请求工具 ID 使用当前枚举，历史快照 ID 使用字符串，以支持将来工具下架后仍能恢复。

`validateAnswer` 校验当前来源集合，并单独要求至少一个当前基座来源；工具不能替代价值依据。紧急分流忽略工具。旧版登录跳转曾临时保存问题与工具 ID；第 04 轮改用邀请码，不再跳转，仅保留旧缓存的兼容读取。

## 首次体验补充（本地分支）

`baseId: null` 表示用户尚未选定，只允许明确标示的探索回应；其材料与来源列表为空，服务端清除原则提议。客户端试用后才保存 Profile，使用返回的新修订立即请求原问题。切换已有基座保留消息，后续上下文注明旧回答当时基座和修订。

单条消息上限 12000 字，与已有本机读取上限对齐，避免原问题加深入探索被静默截断；累计请求 1000000 字节、最多 12 条消息及其他输入检查不变。提供商连接中断独立提示并保留问题，不自动付费重试。

仅作第 01 轮历史记录：`scripts/verify-first-experience.mjs` 在旧版通过本机开发登录执行实测，默认六个真实请求用例，结果保留在 `docs/evidence/first-experience/`。该脚本未适配邀请码，开发身份不能取得当前版本的调用资格；不要用于第 04 轮或续用旧授权。当前状态以 [CONTROL.md](CONTROL.md) 为准。

## 第 02 轮失败恢复

`lib/chat-request.ts` 只向界面返回固定产品提示，不透传网络、代理 HTML 或 schema 内部错误。失败不插入消息，显式重试尊重用户先前跳过探索的意图；不自动重试。新一次请求使用当时确认的基座和原则，旧回答快照不变。客户端 100 秒是前台运行时的截止时间；浏览器挂起/休眠时定时器可能延迟，重新调度后才会显示超时。未发送或失败问题仍只在页面内存，手动刷新会丢失草稿；不要把“本机保留对话”理解成保存输入草稿。

## 第 03 轮构造验证

仅作第 03 轮历史记录：`docs/evidence/foundations-expansion/live-requests.json` 冻结保留最初 14 次台账；补验后累计为 15/16 次，完整记录与未验证项见该目录的 `ACCEPTANCE.md`，剩余授权不续用。`scripts/verify-foundations.mjs` 仍依赖旧版开发登录，未适配邀请码，不用于第 04 轮。预留条目不代表请求成功；网页核查、离线测试及构建不调用模型。


## 第 04 轮：version 6 历史交付与恢复标识

网址继续为 <https://zuobiao-life-philosophy.leeyuecheng2000.chatgpt.site>。只通过现有 Sites 账户部署，不购买域名或新托管，不改变 GitHub main/private。

以下为 version 6 历史记录，当前领取、换码和撤销以本文开头为准。首次交付时 slot 1 已用 3、剩 7，slot 2–4 各剩 10，slot 5 已停用；这些原码现已全部作废，领取文件也已更新为共享码。访问者仍在页面填写邀请码，无需 ChatGPT 账户。Cookie 为 HttpOnly/Secure/SameSite=Strict，有效一天；“退出试用”不清除对话数据。

没有新增管理后台。负责人可在当前已连接的 Sites 工具中管理：

- 关闭 AI：把 `TRIAL_ENABLED` 改为 `false`，然后重新部署当前保存版本；部署成功后匿名 `GET /api/chat` 应为 ready=false，带旧码的 POST 应拒绝。需要立刻阻止新外部访问时，先恢复平台 owner-only。
- 撤销当前共享码：按本文开头将五槽全部设为 null 并重新部署当前版本，不重新部署旧 version 6。所有持码者同时失效。
- 查看用量：先通过 Sites `read_database_overview` 获取实际 `DB/trial_budget`，再读唯一预算行；total 是累计已预扣次数，used1..5 为各码次数，last1..5/last_global 为必要的频率时间戳。不要读写私人对话；此表没有对话、邮箱或 IP。
- 恢复私人访问：先关闭 AI、部署生效；`update_site_access` 设 custom，空的非负责人邮箱/工作区群组/租户群组名单，owner 自动保留。核实只剩原 owner，匿名首页和 API 被平台拒绝。要持续关闭 AI，建议保留 version 6、`TRIAL_ENABLED=false` 和 owner-only。若确需旧版，再用 `deploy_private_site_version` 部署 version 5：`appgprj_6aa4e53b21e08191a1782e3621dd7995~appgver_12f344389c148191adb3d947a9719d7a`，查部署成功并复核权限。旧版只恢复平台私人访问，不保留邀请码或试用限额，也不读取 `TRIAL_ENABLED`；负责人登录后可能再次调用模型。不要公开回退旧代码，不回滚/删除配额数据库。

改变环境变量需要部署后才生效；旧实例中已经发出的请求可能继续完成。普通访客没有这些管理能力；邀请码也不能调用管理工具。以上均可直接请当前负责人账户里的 Codex 执行，不需要提供明文供应商密钥。

本轮 `DB` 通过 Sites 自动绑定，原迁移创建受 CHECK 约束的预算行；新 version 7 已追加迁移去掉上界，保留计数。不能改写已应用迁移、重置计数或自动补建缺失行。最多 12 条消息、每条 12000 字、最多 20 条原则、请求 1MB、单次生成 6500 tokens 均继续生效。用量记录服务异常时拒绝生成，用户输入保留，不自动付费重试。

服务器不新增原始对话收集；模型请求按原服务商约定处理，store:false 不承诺服务商不留日志。平台仍有自己的托管日志和配额。静态构建只包含产品资源，不含 docs/evidence、私密领取文件或密钥。


原 version 6 / `45bd7c2bcc4ee95f9855233dce002a752575a192`，version ID `appgprj_6aa4e53b21e08191a1782e3621dd7995~appgver_c23fa58779848191a3444c56d4b0a3f8`，仍可恢复，但会恢复应用累计上限且不接受短码。当前应使用 **version 7** / `a56ac8ae025025f7a22b51aff800ac2f7eb48ff7`，version ID `appgprj_6aa4e53b21e08191a1782e3621dd7995~appgver_cbb5de3bf5148191a14ae04f4a35bd70`。实际部署 `appgdep_6aaa8c4eb20481918bff5bc9a5e039f7` succeeded，public policy revision 2、环境 revision 6。修改开关或撤销时重新部署这个当前版本；不需要重建应用，也不重置计数。完整验证与域名配置阻点见 CONTROL.md。
