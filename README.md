# 坐标 · Zuobiao

> **一句话**：不给你答案，帮你把模糊的困惑收敛成一条你自己确认过的原则。
>
> **给谁用**：想认真想清楚一件事、又不想被单一导师口吻说服的人。
>
> **现在能不能用**：能。填 4 个环境变量即可对话；邀请码与数据库需自建，见 `DEFECTS.md`。

12 个思想入口（斯多葛、加缪、王阳明、庄子、尼采、纳瓦尔、亚里士多德、伊壁鸠鲁、罗翔、苏格拉底、仁与责任、经验与修订）+ 6 个思考工具。每次回答都带当时的材料与原则快照。

---

## 一、环境要求

| 项目 | 要求 |
|---|---|
| Node.js | **≥ 22.13.0**（`package.json` 中已声明 engines） |
| 包管理 | npm / pnpm 均可 |
| 数据库 | 本地开发可忽略；部署需要 Cloudflare D1 |
| 模型 | 任意 OpenAI 兼容接口 |

## 二、安装

```sh
git clone https://github.com/he176-sketch/zuobiao.git
cd zuobiao
npm install
```

## 三、配置

```sh
cp .env.example .env
```

编辑 `.env`，四项都要填：

| 变量 | 必填 | 说明 | 示例 |
|---|---|---|---|
| `PHILOSOPHY_API_KEY` | ✅ | 模型密钥，只在服务端读取 | `sk-xxxx` |
| `PHILOSOPHY_API_BASE_URL` | ✅ | OpenAI 兼容地址，末尾不带 `/` | `https://api.openai.com/v1` |
| `PHILOSOPHY_MODEL` | ✅ | 模型名 | `gpt-4o-mini` |
| `PHILOSOPHY_REASONING_EFFORT` | 否 | 推理强度，视模型支持 | `low` / `medium` / `high` |

也兼容 `OPENAI_API_KEY` 作为 `PHILOSOPHY_API_KEY` 的别名。

> 密钥不会进入前端包：`app/api/chat/route.ts` 中只有服务端读取，测试里有断言守着这一点。

## 四、运行

```sh
npm run dev        # 开发模式（热更新）
npm run build      # 生产构建，产物在 dist/
npm start          # 用 Wrangler 本地模拟生产运行
npm run typecheck  # 类型检查
npm test           # 单元与契约测试
```

打开终端提示的本地地址（通常是 `http://127.0.0.1:3000` 或 Wrangler 分配端口）。

## 五、数据库（部署前必做）

项目使用 **Drizzle + Cloudflare D1**，迁移文件已在 `drizzle/` 下（`0000`–`0002`）：

```sh
npm run db:generate        # 修改 db/schema.ts 后重新生成迁移
```

本地模拟与线上应用迁移：

```sh
# 本地（Wrangler 会建一个本地 sqlite）
npx wrangler d1 migrations apply <你的数据库名> --local

# 线上
npx wrangler d1 migrations apply <你的数据库名> --remote
```

前提是你在 `wrangler` 配置里为项目声明了 D1 绑定（`d1_databases`）。仓库不含你的账号信息，需要自己建库并绑定。

## 六、第一次使用（完整流程）

1. **进入首页**：如果被邀请码拦住，先按第七节处理；
2. **选一个哲学基座**：12 个入口任选，例如「斯多葛」；
3. **说一句具体的困扰**，或从生活情境里点一个；
4. **最多三步澄清**：当前反应 → 想得到的帮助 → 愿意试试的判断依据。信息够用可提前进入，也能跳过；
5. **比较两个探索候选**：系统会给出两个方向的判断依据；
6. **确认原则**：只有你点确认的那条，才会进入之后的回答；
7. **继续对话**：后续回答会带上你已确认的原则，并保留当时快照；
8. **回看历史**：每条回答都能查当时的材料与原则版本。

> 「12 题深入探索」是可选路径，不是必经流程。

## 七、邀请码（自建必看）

入口有一层邀请码校验，规则与原作者当时的部署环境耦合。**自建时建议直接关闭或替换**：

- 位置：`app/` 下的邀请码校验逻辑（见 `DEFECTS.md` P0-1）；
- 最省事：把校验改成固定返回通过，或改成你自己的白名单；
- 改完记得 `npm run build` 重新构建。

## 八、部署到 Cloudflare

大致链路（详细步骤请对照 Cloudflare 官方文档，因账号相关配置不适合写死在仓库里）：

```sh
npm run build
npx wrangler pages deploy dist --project-name <你的项目名>
```

需要自行准备：

1. Cloudflare 账号与 Wrangler 登录（`npx wrangler login`）；
2. D1 数据库 + 绑定；
3. 在 Pages 项目里配置环境变量（第三节那四项）；
4. 可选：自定义域名与 SSL。

## 九、验证是否正常工作

| 你想确认的 | 怎么验证 |
|---|---|
| 依赖装好了 | `npm run typecheck` 无报错 |
| 测试通过 | `npm test` 全绿 |
| 模型通了 | 首页发一句话，能流式返回回应 |
| 密钥没泄漏 | `npm run build` 后在 `dist/` 里搜 `sk-`，应搜不到 |
| 数据库通了 | 追问一轮，刷新页面后历史仍在 |

## 十、常见问题

**Q：打开页面一直停在邀请码？**
你没关掉邀请码校验。见第七节。

**Q：对话直接报错、没有降级？**
缺 `PHILOSOPHY_API_KEY` 时会直接失败，没有本地 mock。检查 `.env` 是否被读到（重启 dev server）。

**Q：`npm install` 卡住或报 engines 错误？**
`node -v` 确认 ≥ 22.13.0。低版本会因 `--experimental-strip-types` 相关脚本失败。

**Q：刷新后记录没了？**
多半是 D1 未迁移或绑定没生效。跑一遍第五节的迁移，再确认 `wrangler` 配置里 D1 绑定名与代码一致。

**Q：想换模型？**
只改 `.env` 里的 `PHILOSOPHY_MODEL`，无需改代码。不同厂商对 `reasoning_effort` 支持不同，报错就把它删掉。

**Q：多人用同一个实例会串数据？**
会。当前没有多用户隔离（见 DEFECTS P1-4），请一人一实例。

## 十一、停止与清理

`Ctrl + C` 停止 dev server。`dist/`、`.wrangler/`、`.next/` 均为生成物，已在 `.gitignore` 中。

## 十二、目录结构

```
app/          页面与 API 路由（chat、邀请码校验）
components/   UI 组件
db/           Drizzle schema
drizzle/      数据库迁移（0000–0002）
lib/          基座定义、提示词、工具选编
tests/        单元与契约测试
docs/         产品说明与复用调研
```

## 已知缺陷

见 [DEFECTS.md](DEFECTS.md)。最要紧的一条：**邀请码体系与原作者部署绑定**，自建需替换或关闭。

## 许可证

MIT
