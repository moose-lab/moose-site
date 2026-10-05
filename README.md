# Moose 的草稿本

Moose 的个人网站：训练、AI、做产品、追番。手绘草稿本风格，Astro 静态站，部署在 Cloudflare Workers。

- 设计规格：`docs/superpowers/specs/2026-10-05-moose-site-v1-design.md`
- 技术选型：`docs/adr/0001-tech-stack.md`
- 视觉参考：`design/`（画板源文件 + `tokens.css`）
- 项目约定（给 Claude Code 看的）：`CLAUDE.md`

## 本地开发

需要 Node 22.12+ 和 pnpm（版本见 `package.json` 的 `packageManager`）。

```bash
pnpm install
pnpm dev                 # http://localhost:4321 ，草稿和 /dev/ 预览页只在这里可见
pnpm build && pnpm preview
```

| 命令 | 作用 |
|---|---|
| `pnpm test` | 单元测试（Vitest） |
| `pnpm check` | 类型检查（astro check） |
| `pnpm test:schema-guard` | 确认不合法的内容会让构建失败 |
| `pnpm test:e2e` | 用测试内容构建后跑 Playwright（首次先 `pnpm exec playwright install chromium`） |
| `pnpm lhci` | Lighthouse CI，移动端，取 5 次中位数 |

### `MOOSE_CONTENT_ROOT`

内容默认从 `src/content/` 读取。把这个环境变量指向别的目录，就会改用那里的内容构建。E2E 和 Lighthouse 用它来加载 `tests/fixtures/content/`（`pnpm build:fixtures`），所以测试不依赖真实文章，真实内容也不会混进测试。生产环境不要设置它。

## 怎么写内容

内容都是 `src/content/` 下的 Markdown 文件，分四个文件夹。分类只能是：`训练`、`AI`、`产品`、`二次元`、`小红书`。日期按北京时间理解，需要精确到时刻时写成 `2026-09-26T21:30:00+08:00`。

**长文** `src/content/posts/<slug>.md` 或 `.mdx`（网址是 `/posts/<slug>/`）

```yaml
---
title: HYROX 八个功能站拆解：配速该怎么分？
titleHighlight: 配速          # 可选：标题里要荧光笔高亮的几个字
description: 一两句话摘要，最多 120 字，会用在卡片、搜索结果和分享预览里。
date: 2026-09-28
category: 训练
tags: [HYROX, 配速]
cover: ./images/hyrox-cover.jpg   # 可选；有封面就必须写 coverAlt
coverAlt: 比赛现场的雪橇推
pinned: false                 # 设为 true 会出现在首页顶部（只取最新一篇）
draft: false                  # 设为 true 只在本地 dev 可见
---
```

`.mdx` 文章里可以直接用这几个组件：`<Aside>页边批注</Aside>`、`<PullQuote>金句</PullQuote>`、`<Figure src={图片} alt="必填" caption="图注" />`、`<LogCard title="训练名" items={["动作 | 结果"]} />`。

**碎碎念** `src/content/notes/<任意文件名>.md`：正文就是内容，最多 280 字。

```yaml
---
date: 2026-09-26T21:30:00+08:00
category: 训练
---
今天的 WOD 把我练成一摊泥。明天继续。
```

**训练日志** `src/content/logs/<slug>.md`：每行写「动作 | 结果」，正文写一句感受。

```yaml
---
title: HYROX 模拟日
date: 2026-09-19
kind: HYROX                   # CrossFit / HYROX / 跑步 / 力量 / 其他
items:
  - 1km 跑 ×4 | [用时]
  - 雪橇推 / 拉 | [重量]
---
[一句话训练感受]
```

**小红书笔记** `src/content/xhs/<slug>.md`：只留一张卡片，点开跳到原帖。

```yaml
---
title: 第一次去 CrossFit Box，新手要注意什么
date: 2026-09-25
url: https://www.xiaohongshu.com/explore/...
cover: ./images/box.jpg       # 可选，3:4 竖图效果最好；有封面就必须写 coverAlt
coverAlt: Box 里的器械墙
---
```

**站点信息** 在 `src/data/site.yaml`：名字、简介、社交链接、「现在在忙」、常写的话题、关于页正文（`about`）。值写成 `[方括号]` 的占位，在线上不会显示，填上真实内容后才出现。

还没准备公开的文章，先放在 `drafts/`（已被 git 忽略，不会进公开仓库），确定发布再移到 `src/content/posts/`。

## 部署

推到 `main` 就会由 Cloudflare Workers Builds 自动构建上线；推其他分支会生成预览地址。

- 构建命令 `pnpm build`，部署命令 `npx wrangler deploy`（配置在 `wrangler.jsonc`）。
- 构建变量：`SITE_URL`（正式网址，canonical、RSS、sitemap 都用它；没设置时构建会给出警告）、`PNPM_VERSION`（和 `packageManager` 一致）。可选：`PUBLIC_NEWSLETTER_URL`，设置后侧栏出现邮件订阅表单。
- 安全响应头在 `public/_headers`，跳转规则在 `public/_redirects`，页面里的 CSP 由 `astro.config.mjs` 的 `security.csp` 生成。
- 本地预演线上行为：`pnpm build && pnpm exec wrangler dev`。

## 许可

代码采用 MIT 许可；文章、图片、训练记录和设计插画 © Moose，保留所有权利。详见 `LICENSE`。
