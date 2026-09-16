# 坐标｜03 哲学基座扩充至十二个

更新：2026-09-16。本机内容、39 项测试、类型、lint 与构建通过；准备私人发布。现有私人站仍为 version 4。原四个加王阳明、纳瓦尔、尼采、庄子、伊壁鸠鲁、亚里士多德、罗翔与苏格拉底，共十二个。

本轮分支 `codex/foundations-twelve` 从干净基线 `897c8795661e1d52383a43b1333d7b538022f0f0` 建立。沿用原 checkout 与项目；原灵感库 worktree 未修改。模型、服务商、计费、鉴权与名单不变。

真实请求总上限 14 次，用户明确确认此前第 03 轮为 0 次；失败、超时与人工重试均计入。逐次日志见 [live-requests.json](evidence/foundations-expansion/live-requests.json)。本机已发生 13 次：9 成功、4 失败；第 14 次仅预留，计划线上王阳明 A。尼采两次连接中断，真实回答未验证。没有自动重试；相同错误连续两次即停。

本轮验收材料：[十二基座扩库验收](evidence/foundations-expansion/ACCEPTANCE.md)。沿用原主控记录；下方第 02 轮内容仅作历史记录，其中 version 3 回滚说明已由本轮实时核验的 version 4 恢复目标取代。

恢复目标：Sites version 4，来源 `d58df1859a28c0aef133432a8737a30b70f3e0c5`；完整版本 ID `appgprj_6aa4e53b21e08191a1782e3621dd7995~appgver_d5eaa8bbff7c81918d69a63e0cbf8f02`。需先核实仍 owner-only，再私人部署该归档并查询终态，无需强推或清除用户数据。

---

# 坐标｜02 私人试用版交付

更新：2026-09-15。**原私人站已受控升级为 Sites version 4，负责人可通过原授权方式实际体验；外部真人试用尚未开展。** 第 01 轮按“工程交付完成、产品效果待验”收口。本轮未扩充哲学、问卷、界面或商业功能。

## 基线与现场

- 当前目录 `/Users/lihe/Documents/ChatGPT/坐标/zuobiao` 是已有隔离 worktree，接手时干净。
- 原版 `cf0d19ef544bef9af5a38e9aa408275143006978 / v0.2.0`；上轮最终 `0b588ffdacab5dd147ca6ddd2a0138d71919733e / codex/first-experience`，其父为原版，没有后续提交。
- 本轮 `codex/pilot-ready` 直接从上轮最终提交建立；产品代码提交 `dde33858f26105bb30c68c64753b687a08291c75`。文档收口完整 SHA 见最终交付副本，或 `git log -1 --format=%H -- docs/evidence/pilot-ready/MASTER-REVIEW-PACKET.md`。
- 原 worktree `/Users/lihe/Documents/ChatGPT/灵感库/zuobiao` 及 `codex/zuobiao` 未触碰；`lib/discovery.ts` 的未提交 55 行新增、25 行删除仍在。不复制项目、不合并原改稿。

## 本轮变更与复核

保留四基座、12 题、短入口、六工具、原则确认、版本快照、本机保存、导出与删除。只修三处：

1. 浏览器完整请求增加 100 秒截止时间，保留手动停止及既有服务端 90 秒超时。
2. 网络/HTML/schema 错误转成固定中文提示，不透传底层异常。
3. 已明确“不答题，先聊”的失败重试继续发送，不再返回探索问卷。

修复前受控原始证据在 [DEFECTS.md](evidence/pilot-ready/DEFECTS.md) 与 `before-recovery.json`。复用原有请求互斥、成功后成对追加消息、来源和版本校验，不另建提交/重试系统，不改模型或提示词。

**内容复核：** 完整加缪回答在正文给出继续的条件（方向仍值得、可改进、不挤压基本生活）及暂停的边界，实质回应意义与自我评价，不以追问为空判通过。四基座行动趋同但判断前提有区别；斯多葛首条德性解释和仁与责任同题关系展开偏少，不能声称长期忠实度通过。本轮没有明确到需要修改提示词的缺陷，保留实现。首次原则为零；后续修订原则的完整原文未保留，本轮只核查旧记录呈现的边界与回答对应，不伪造输入原文。

**验证：** 基线 33 项、最终 36 项测试全通过，0 跳过；类型、lint、构建通过。Ego Chromium 桌面 1440×1000 与移动模拟 390×844 实际操作；受控模拟验证断线、繁忙、挂起、HTML/schema 异常、版本不一致、手动停止、连续提交、重试及刷新。连续三次表单事件只发一次请求；旧问答不覆盖，新问答只追加一组；导出已解析且脱敏检查通过。移动测试 100 秒截止时间加速为 1.5 秒，不能当真实超时实测。

**真实 AI：** 第 02 轮工程阶段 1 次本机请求，HTTP 200，32,426 ms，失败/重试 0。未选基座的构造日常取舍问题获得直接、条件式回答，原则提议为空。用量和账单未知，不估费用。已有四基座真实输出直接复用，未再生成整套；本次发布验收另获 2 次预算，两次线上请求均成功（17,125 / 27,111 ms），失败/重试 0；本阶段合计 3 次。到此停止真实调用。

## 运行、发布与访问权限

实际体验入口：<https://zuobiao-life-philosophy.leeyuecheng2000.chatgpt.site/#talk>，仍仅负责人访问。保留的本机入口 `http://localhost:5175/#talk` 与既有依赖/私密 `.env` 未改变。

如服务停止：

```sh
cd /Users/lihe/Documents/ChatGPT/坐标/zuobiao
npm run dev -- --host 127.0.0.1 --port 5175
```

原私人站已由原版 `cf0d19e / Sites version 3` 更新至候选 `d58df1859a28c0aef133432a8737a30b70f3e0c5 / Sites version 4`。权限策略 revision 1 完全相同：custom owner-only，负责人 1 人，外部访客/编辑者/群组均 0。升级前后无 cookie 或 bypass 的首页 GET、API GET/POST 全部返回 401。负责人经原 ChatGPT 账户登录并完成线上两轮对话，未用本机测试身份或 bypass 代替。

**发布授权与来源：** 本次主控解除发布源 main 的阶段限制。核查 Sites 远程 main 仍为 `cf0d19ef544bef9af5a38e9aa408275143006978`，候选包含的 3 个提交均为已知首次体验、恢复修复及其文档证据；没有未审阅新提交或冲突。仅通过普通推送将 Sites 远程 main 快进到候选，无新合并提交。GitHub main 仍为原版，本地不存在 main，也没有为发布创建 main；工作仍在 `codex/pilot-ready`。没有强推、保护规则变更或访问扩员。

**保存及部署：** 复用与候选运行代码一致的既有成功构建；先保存并核查 version 4 的 source SHA，再调用私人部署。保存版本 ID：`appgprj_6aa4e53b21e08191a1782e3621dd7995~appgver_d5eaa8bbff7c81918d69a63e0cbf8f02`；deployment ID：`appgdep_6aa8f7b39bc08191a4d546afaddca413`，状态 `succeeded`（2026-09-15 07:46:33 UTC / 15:46:33 北京时间），env_set_revision 仍为 1。模型、服务商、reasoning、秘密与计费配置未更改。

**线上最小验证：** 禁用页面缓存后出现“最多 3 步”新入口；加载的 `zuobiao-app-CpsWj3sJ.js` 与候选构建 SHA-256 相同：`a0deaece8bc1ab042b60509324b0261900009208e2fba7f2beb2d239b33b3278`。构造流程“聊一件事 → 不答题先聊 → 回答 → 续聊”两次 POST 均 HTTP 200、4 条消息，无原则提议。开启本机保存后刷新，全部消息及依据快照结构深比较一致。测试使用仅验收页面注入的 Storage 命名空间适配器，底层仍为浏览器存储；负责人的应用内浏览器未操作。Ego 同源非测试存储本来为空，前后哈希不变；只删除测试前缀数据，没有清除站点数据或用户记录。旧数据兼容性另复用既有 36 项测试及原存储 schema 无变化证据，不声称验证了负责人真实私密记录的逐项恢复。

**回归判断：** 未发现权限、数据完整性或核心功能发布回归，未执行回滚。真实调用没有自动重试，也未继续调用凑内容。打包 locale 提示不影响归档校验；OAuth 跳转曾超过 10 秒观察窗口，随后同页正常完成，没有另建账户或绕过登录。

## 未验证项与下一阶段

已登录但未授权的第二账号、实体手机、Safari、屏幕阅读器、实际软键盘与后台休眠均未验证。真实上游取消是否停止计算/计费及长期可靠性未验证。当前页中的失败问题会保留，但刷新/关闭仍会丢失未发送草稿；本机保存针对成功对话，不等于草稿保存。

真实用户理解、接受与回访效果未验证。发布交付到此停止，接下来由负责人实际体验；以后另行授权外部试用时，按 [试用说明与空白模板](evidence/pilot-ready/TRIAL-GUIDE.md) 安排 3—5 位自愿参与者。本轮没有招募、邀请、自动监测或新增后台收集，真实反馈不能提交 Git。

## 回滚与主控材料

本地可在工作区干净时 `git revert dde33858f26105bb30c68c64753b687a08291c75` 撤回三处产品修复；不要 reset 原项目或覆盖问卷。线上需要回退时，先用 `get_site` 核实 owner-only，再调用 `deploy_private_site_version`，project_id=`appgprj_6aa4e53b21e08191a1782e3621dd7995`，指定既有 Sites version 3，完整版本 ID 为 `appgprj_6aa4e53b21e08191a1782e3621dd7995~appgver_99f3913b49cc819186fb6dd2b2b07091`。然后按返回 deployment_id 查询 `get_deployment_status` 至 succeeded，并复核匿名页面/API 拒绝及负责人旧版访问。无需强推 main 或重建旧版。没有新增存储迁移，不需要清除用户数据；导出尚无应用内导入入口。

自包含主控包：[MASTER-REVIEW-PACKET.md](evidence/pilot-ready/MASTER-REVIEW-PACKET.md)，内含完整构造首次体验、四基座旧真实全文、具体评议、修复前后、调用与错误记录、权限检查、实际发布回执、试用模板及回滚。上轮证据保留在 `docs/evidence/first-experience/`，本轮原始日志与截图在 `docs/evidence/pilot-ready/`。测试原始导出及浏览器构造数据已清除，原 worktree、旧记录和本机服务保留。到此交付，不继续扩充或推广。

应用实际部署提交固定为 `d58df1859a28c0aef133432a8737a30b70f3e0c5`；本次发布后的文档提交只改本文件和现有验收包，未重新推送或部署应用，其实际 SHA 写入 `outputs/MASTER-REVIEW-PACKET.md` 文末回执。
