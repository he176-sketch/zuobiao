# 坐标 · Zuobiao

选一个哲学基座，聊一件具体的困惑，最后把它收敛成一条**你自己确认过的原则**。

12 个思想入口（斯多葛、加缪、王阳明、庄子、尼采、纳瓦尔、亚里士多德、伊壁鸠鲁、罗翔、苏格拉底、仁与责任、经验与修订），外加 6 个思考工具（比较取舍、检验判断、设计小尝试）。每次回答都会带上当时的材料与原则快照——不会偷偷用新观点覆盖旧结论。

> A thinking companion that helps you turn a philosophical stance into principles you actually hold.

## 特点

- **基座可选，不是单一导师口吻**：12 个立场的主张与现代应用分开标注，来源可查。
- **原则需要你确认**：AI 不会替你决定哪条原则成立；只有你点了确认，它才进入后续回答。
- **历史可回溯**：每条回答保留当时的材料与原则快照，观点改变后可对照。
- **思考工具按需带入**：工具改编自 Model Thinking，只在选择后进入对话。

## 本地运行

```sh
cp .env.example .env      # 填入你的模型 Key
npm i
npm run dev
```

需要 Node 22+。部署目标是 Cloudflare Workers/Pages（Wrangler + Drizzle + D1）。

```sh
npm run build
npm test
npm run typecheck
```

## 配置

只需四个环境变量，全部为 OpenAI 兼容协议：

```ini
PHILOSOPHY_API_KEY=sk-...
PHILOSOPHY_API_BASE_URL=https://api.openai.com/v1
PHILOSOPHY_MODEL=gpt-4o-mini
PHILOSOPHY_REASONING_EFFORT=medium
```

代码同时兼容 `OPENAI_API_KEY`。密钥只在服务端（`app/api/chat/route.ts`）读取，不会进入前端包——`tests/` 里有对应断言。

## 目录

```
app/          页面与 API 路由（chat、邀请码校验）
components/   UI 组件
docs/         产品说明、复用调研、验收记录
lib/          基座定义、提示词、工具选编
tests/        单元与契约测试
```

## 已知缺陷

见 [DEFECTS.md](DEFECTS.md)。最要紧的一条：**邀请码体系与当前部署绑定**，自建时需要替换或直接关闭。

## 许可证

MIT
