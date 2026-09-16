# 运行与配置

## 本地

要求 Node.js 22.13+。沿用锁文件安装：`npm ci`。

把 `.env.example` 复制为 `.env`，以 0600 权限保存。设置 `PHILOSOPHY_API_KEY`；其余配置按用户指定为小小 API、`gpt-5.6-sol`、Responses、`xhigh`。不要把密钥放在浏览器、源代码、提交或日志中。

`npm run dev` 启动本地预览；当前版本的真实对话必须通过邀请码和 D1 配额检查，开发测试身份不授予调用资格。`npm run typecheck` 检查类型；`npm test` 运行关键业务边界测试。构建、打包和发布遵循已注册 Site 的流程。

## AI 接口

- `GET /api/chat` 仅返回是否已配置、存储模式和内容版本，不返回密钥。
- `POST /api/chat` 要求服务端验证的有效试用邀请码，并检查来源、请求格式、大小、角色、明确选定或为 null 的基座、可选 thinkingToolId 和原则数量。请求以流式读取累计限制为 1,000,000 字节，覆盖严格 schema 允许的中文原则与多轮历史。
- 使用服务端 `PHILOSOPHY_API_BASE_URL + /responses`，规则作为 developer 消息传入（实测该代理的独立 instructions 与 JSON 模式组合会返回 502），`store: false`，多轮上下文由本次请求显式携带。
- 本版实际验证的路径为 `https://www.xiaoxiaoapi.com/responses`。不要擅自追加 `/v1` 或更换用户指定的模型。
- 客户端停止等待会中止 fetch；客户端最多等待 100 秒（包含响应正文读取），服务器把请求取消与 90 秒超时信号传给提供商；Workers 开启 `enable_request_signal`。提供商收到取消后是否立即停止计算，取决于其实现。
- 超时、空输出、不完整 JSON、无来源或未知来源均显示失败并保留输入，不返回伪装成 AI 的预写回答。
- 提供商是否保留请求仍由其自身政策决定；`store:false` 不等于所有服务端日志不存在。

## 部署

`.openai/hosting.json` 仅保留 Site 标识和逻辑能力声明。生产密钥通过 Sites secret 配置。第 04 轮按 CONTROL.md 开放产品页面，AI 继续受邀请码和持久配额保护。

源仓库独立位于本项目，不能把父目录中的 Writing 或其他材料提交到 Site。发布前检查 `.env` 被忽略，构建产物中不含密钥，并使用同一提交完成推送、打包、保存版本和部署。

## 明确限制

- 第 04 轮已改为 D1 原子配额：全站 50 次、每码 10 次，不自动重置；次数不等于精确金额上限。
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


## 第 04 轮：公开试用的领取、撤销和恢复

网址继续为 <https://zuobiao-life-philosophy.leeyuecheng2000.chatgpt.site>。只通过现有 Sites 账户部署，不购买域名或新托管，不改变 GitHub main/private。

负责人领取文件在 `/Users/lihe/.config/zuobiao-trial/invitations.json`，权限 0600；它在仓库之外，含五个固定 slot 的原码。只把某一个 code 私下发给对应体验者，不发送整份文件。交付时 slot 1 已用 3、剩 7，slot 2–4 各剩 10；slot 5 已用于线上撤销验证并永久停用，不补发。全站已用 3/50，当前四码还可用 37 次；这些是交付快照，后续以服务端为准。访问者在页面“有邀请码？开启对话试用”填写 code，再选基座与提问；不需要 ChatGPT 账户。Cookie 为 HttpOnly/Secure/SameSite=Strict，有效一天，可“退出试用”，退出不清除对话数据。

没有新增管理后台。负责人可在当前已连接的 Sites 工具中管理：

- 关闭 AI：把 `TRIAL_ENABLED` 改为 `false`，然后重新部署当前保存版本；部署成功后匿名 `GET /api/chat` 应为 ready=false，带旧码的 POST 应拒绝。需要立刻阻止新外部访问时，先恢复平台 owner-only。
- 撤销一个邀请码：保持 `TRIAL_INVITE_HASHES` 五槽数组顺序，只将目标槽位改为 null（保留其他哈希）；作为 secret 保存并重新部署同一版本。用原码验证 `/api/trial` 和 `/api/chat` 被拒绝。不要删除数组元素、重排或复用槽位，不补发第六份，不改预算。
- 查看用量：先通过 Sites `read_database_overview` 获取实际 `DB/trial_budget`，再读唯一预算行；total 是累计已预扣次数，used1..5 为各码次数，last1..5/last_global 为必要的频率时间戳。不要读写私人对话；此表没有对话、邮箱或 IP。
- 恢复私人访问：先关闭 AI、部署生效；`update_site_access` 设 custom，空的非负责人邮箱/工作区群组/租户群组名单，owner 自动保留。核实只剩原 owner，匿名首页和 API 被平台拒绝。要持续关闭 AI，建议保留 version 6、`TRIAL_ENABLED=false` 和 owner-only。若确需旧版，再用 `deploy_private_site_version` 部署 version 5：`appgprj_6aa4e53b21e08191a1782e3621dd7995~appgver_12f344389c148191adb3d947a9719d7a`，查部署成功并复核权限。旧版只恢复平台私人访问，不保留邀请码或试用限额，也不读取 `TRIAL_ENABLED`；负责人登录后可能再次调用模型。不要公开回退旧代码，不回滚/删除配额数据库。

改变环境变量需要部署后才生效；旧实例中已经发出的请求可能继续完成。普通访客没有这些管理能力；邀请码也不能调用管理工具。以上均可直接请当前负责人账户里的 Codex 执行，不需要提供明文供应商密钥。

本轮 `DB` 通过 Sites 自动绑定，唯一迁移创建受 CHECK 约束的预算行。迁移一旦应用不可改写；追加新迁移也不能用于重置本轮预算。不能在运行时自动补建缺失行。最多 12 条消息、每条 12000 字、最多 20 条原则、请求 1MB、单次生成 6500 tokens 均继续生效。额度服务异常时拒绝生成，用户输入保留，不自动付费重试。

服务器不新增原始对话收集；模型请求按原服务商约定处理，store:false 不承诺服务商不留日志。平台仍有自己的托管日志和配额。静态构建只包含产品资源，不含 docs/evidence、私密领取文件或密钥。


交付版本为 Sites version 6 / `45bd7c2bcc4ee95f9855233dce002a752575a192`，version ID `appgprj_6aa4e53b21e08191a1782e3621dd7995~appgver_c23fa58779848191a3444c56d4b0a3f8`。当前 public / policy revision 2，TRIAL_ENABLED=true / 环境 revision 4；最终部署 `appgdep_6aaa77fa360c81918cb9ccff6312a402` 已成功。关闭 503、撤销 401、重新部署计数保持 3 均已线上验证，完整回执与未验证项见 CONTROL.md。修改开关或撤销时重新部署这个已保存版本，不需要重建或新建版本。不得为后续试用增加预算、重置计数、复用已撤销槽位或生成第六份码。
