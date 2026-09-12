# 运行与配置

## 本地

要求 Node.js 22.13+。沿用锁文件安装：`npm ci`。

把 `.env.example` 复制为 `.env`，以 0600 权限保存。设置 `PHILOSOPHY_API_KEY`；其余配置按用户指定为小小 API、`gpt-5.6-sol`、Responses、`xhigh`。不要把密钥放在浏览器、源代码、提交或日志中。

`npm run dev` 启动本地预览；首次对话点击页面的“登录并继续”，本地会使用 starter 的回环地址测试身份。`npm run typecheck` 检查类型；`npm test` 运行关键业务边界测试。构建、打包和发布遵循已注册 Site 的流程。

## AI 接口

- `GET /api/chat` 仅返回是否已配置、存储模式和内容版本，不返回密钥。
- `POST /api/chat` 要求平台验证过的登录身份，并检查来源、请求格式、大小、角色、所选基座和原则数量。
- 使用服务端 `PHILOSOPHY_API_BASE_URL + /responses`，规则作为 developer 消息传入（实测该代理的独立 instructions 与 JSON 模式组合会返回 502），`store: false`，多轮上下文由本次请求显式携带。
- 本版实际验证的路径为 `https://www.xiaoxiaoapi.com/responses`。不要擅自追加 `/v1` 或更换用户指定的模型。
- 超时、空输出、不完整 JSON、无来源或未知来源均显示失败并保留输入，不返回伪装成 AI 的预写回答。
- 提供商是否保留请求仍由其自身政策决定；`store:false` 不等于所有服务端日志不存在。

## 部署

`.openai/hosting.json` 仅保留 Site 标识和逻辑能力声明。生产密钥通过 Sites secret 配置。初版保持 owner-private，不扩大访问范围。

源仓库独立位于本项目，不能把父目录中的 Writing 或其他材料提交到 Site。发布前检查 `.env` 被忽略，构建产物中不含密钥，并使用同一提交完成推送、打包、保存版本和部署。

## 明确限制

- 内存请求节流只减少单个实例上的短时重复请求，不是分布式配额或计费上限。
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
- 开源方案取舍见 `REUSE-RESEARCH.md`。当前仅参考其思路，未引入额外聊天或 RAG 框架。
