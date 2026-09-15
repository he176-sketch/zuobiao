# 运行与配置

## 本地

要求 Node.js 22.13+。沿用锁文件安装：`npm ci`。

把 `.env.example` 复制为 `.env`，以 0600 权限保存。设置 `PHILOSOPHY_API_KEY`；其余配置按用户指定为小小 API、`gpt-5.6-sol`、Responses、`xhigh`。不要把密钥放在浏览器、源代码、提交或日志中。

`npm run dev` 启动本地预览；首次对话点击页面的“登录并继续”，本地会使用 starter 的回环地址测试身份。`npm run typecheck` 检查类型；`npm test` 运行关键业务边界测试。构建、打包和发布遵循已注册 Site 的流程。

## AI 接口

- `GET /api/chat` 仅返回是否已配置、存储模式和内容版本，不返回密钥。
- `POST /api/chat` 要求平台验证过的登录身份，并检查来源、请求格式、大小、角色、明确选定或为 null 的基座、可选 thinkingToolId 和原则数量。请求以流式读取累计限制为 1,000,000 字节，覆盖严格 schema 允许的中文原则与多轮历史。
- 使用服务端 `PHILOSOPHY_API_BASE_URL + /responses`，规则作为 developer 消息传入（实测该代理的独立 instructions 与 JSON 模式组合会返回 502），`store: false`，多轮上下文由本次请求显式携带。
- 本版实际验证的路径为 `https://www.xiaoxiaoapi.com/responses`。不要擅自追加 `/v1` 或更换用户指定的模型。
- 客户端停止等待会中止 fetch；客户端最多等待 100 秒（包含响应正文读取），服务器把请求取消与 90 秒超时信号传给提供商；Workers 开启 `enable_request_signal`。提供商收到取消后是否立即停止计算，取决于其实现。
- 超时、空输出、不完整 JSON、无来源或未知来源均显示失败并保留输入，不返回伪装成 AI 的预写回答。
- 提供商是否保留请求仍由其自身政策决定；`store:false` 不等于所有服务端日志不存在。

## 部署

`.openai/hosting.json` 仅保留 Site 标识和逻辑能力声明。生产密钥通过 Sites secret 配置。初版保持 owner-private，不扩大访问范围。

源仓库独立位于本项目，不能把父目录中的 Writing 或其他材料提交到 Site。发布前检查 `.env` 被忽略，构建产物中不含密钥，并使用同一提交完成推送、打包、保存版本和部署。

## 明确限制

- 内存请求节流只减少单个实例上的短时重复请求，不是分布式配额或计费上限。
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

`validateAnswer` 校验当前来源集合，并单独要求至少一个当前基座来源；工具不能替代价值依据。紧急分流忽略工具。登录跳转会临时保存问题与经白名单恢复的工具 ID，不写入个人原则。

## 首次体验补充（本地分支）

`baseId: null` 表示用户尚未选定，只允许明确标示的探索回应；其材料与来源列表为空，服务端清除原则提议。客户端试用后才保存 Profile，使用返回的新修订立即请求原问题。切换已有基座保留消息，后续上下文注明旧回答当时基座和修订。

单条消息上限 12000 字，与已有本机读取上限对齐，避免原问题加深入探索被静默截断；累计请求 1000000 字节、最多 12 条消息及其他输入检查不变。提供商连接中断独立提示并保留问题，不自动付费重试。

第 01 轮复现实测：`node --experimental-strip-types scripts/verify-first-experience.mjs`，可用参数指定逗号分隔的用例 ID。该脚本只接受 localhost/127.0.0.1，并通过既有开发登录使用本地配置的真实服务；会产生真实 API 用量。第 01 轮结果和失败保留在 `docs/evidence/first-experience/`。此脚本默认会发起 6 次真实请求，不要为本轮验收再次运行整套。第 02 轮状态以 [CONTROL.md](CONTROL.md) 为准。

## 第 02 轮失败恢复

`lib/chat-request.ts` 只向界面返回固定产品提示，不透传网络、代理 HTML 或 schema 内部错误。失败不插入消息，显式重试尊重用户先前跳过探索的意图；不自动重试。新一次请求使用当时确认的基座和原则，旧回答快照不变。客户端 100 秒是前台运行时的截止时间；浏览器挂起/休眠时定时器可能延迟，重新调度后才会显示超时。未发送或失败问题仍只在页面内存，手动刷新会丢失草稿；不要把“本机保留对话”理解成保存输入草稿。
