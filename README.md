# 坐标

一个可以选择哲学基座、讨论生活问题，并逐渐形成个人原则的应用。

第一次使用，可以先说一句困扰或点选生活情境。最多三步，分别说说当前反应、想获得的帮助和愿意试试的判断依据，再比较两个探索候选；信息够用时可提前进入，也能直接跳过。选择后自动回应原问题，暂不选择也能获得标明性质的探索回应。12 题保留为可选的深入探索。

首版包含斯多葛、加缪、经验与修订、仁与责任四个入口。思想主张和现代应用分开标注，来源可查看。用户确认的原则才进入之后的回答，历史回答保留当时的材料与原则快照。

另有六个思考工具，帮助比较取舍、检验判断和设计小尝试。四个基座补充了 Philoscopia 的八条思想解读；工具选编自 Model Thinking，均保留固定版本、来源与许可。工具只在选择后带入对话，不自动改变基座或个人原则。

## 使用与维护

- 本轮主控与验收：[`docs/CONTROL.md`](docs/CONTROL.md)
- 产品范围：[`docs/PRODUCT.md`](docs/PRODUCT.md)
- 运行、接口与部署：[`docs/OPERATIONS.md`](docs/OPERATIONS.md)
- 开源研究：[`docs/REUSE-RESEARCH.md`](docs/REUSE-RESEARCH.md)
- 改编与许可：[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)
- 内容与信源：[`lib/foundations.json`](lib/foundations.json)
- 代码审查：[`docs/REVIEW.md`](docs/REVIEW.md)
- 验证结果：[`docs/VALIDATION.md`](docs/VALIDATION.md)

```sh
npm ci
npm run dev
npm run typecheck
npm test
```

AI 服务配置在未提交的 `.env` 与生产 Site secrets 中。默认不在服务器保存客户对话；浏览器存储的行为与导出方式见应用内“隐私与数据”。

本版为私人体验版本。已实现的功能与技术验证不代表对真实客户的效果或商业需求已经得到证明。

当前版本：0.2.0。内容接入的复核与真实对话验证见 `docs/VALIDATION.md`，许可见 `THIRD_PARTY_NOTICES.md`。
