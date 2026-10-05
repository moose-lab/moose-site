# Moose 个人网站 v1 · 设计规格（Design Spec）

- 日期：2026-10-05
- 状态：**已定稿**（2026-10-05），第二轮评审修订见第 14 节
- 下一步：M1 实现计划已写好并在沙盒验证核心代码 → `docs/superpowers/plans/2026-10-05-m1-skeleton.md` → 用 `subagent-driven-development` 执行
- 相关文件：技术选型理由见 `docs/adr/0001-tech-stack.md`；视觉参考见 `design/`；项目约定见 `CLAUDE.md`

---

## 1. 问题与目标

Moose 是运动博主（CrossFit / HYROX）兼 AI 科学家，在做产品和小红书自媒体。他需要一个自己的站点，长期、不定期地发布博客，Feed 流是站点核心。现在缺的是一个能马上发文章、读起来舒服、以后还能往上加功能的地基。

**目标（v1）**

1. 生产环境上线：自定义域名，HTTPS，手机和桌面都能正常读。
2. 发布顺手：在网页后台（手机也行）写完点保存，5 分钟内自动出现在线上，不需要碰代码。
3. 读得舒服：首页 Feed 混排四种内容，文章页排版清楚，移动端 Lighthouse 性能和可访问性 ≥ 95。
4. 风格落地：按已选定的「草稿本涂鸦」设计实现，遵守 `design/Style.dc.html` 里的画图守则。
5. 架构留口：评论、订阅、专栏、多语言、AI 功能后续都能加，不需要推倒重来。

**非目标（v1 不做）**

- 专栏页（用户明确后置，单独出 spec）。
- 评论系统、邮件订阅的后端（v1 只放 RSS；邮件表单在配置了服务后才显示）。
- 多语言 / 英文版（路由结构预留，不实现）。
- 用户登录、会员、付费内容。
- 「问 Moose」AI 问答、训练数据自动同步（P2）。

## 2. 用户故事

- 作为站长，我想在手机上 1 分钟内发一条碎碎念，这样训练完的想法能马上记下来。
- 作为站长，我想用 Markdown（或让 Claude Code 帮我写）发长文，带封面、表格和代码块，这样 AI 和训练类文章都能写清楚。
- 作为站长，我想把一篇长文设为置顶，并把草稿留在后台不上线。
- 作为站长，我想记录一次训练（动作 + 结果 + 感受），让它出现在 Feed 里。
- 作为站长，我想把小红书笔记以卡片形式收进 Feed，点击跳到小红书。
- 作为读者，我想在首页按分类筛选 Feed，快速找到训练 / AI / 产品相关的内容。
- 作为读者，我想用 RSS 订阅更新。
- 作为读者，我在手机上读长文时不会出现横向滚动，字号和行距舒服。
- 边界：某个分类暂时没有内容时，筛选后显示空状态文案，而不是一片空白。

## 3. 技术选型（摘要，详见 ADR-0001）

| 层 | 选型 | 一句话理由 |
|---|---|---|
| 框架 | Astro 7.x（安装时的最新稳定版） | 内容站首选，默认零 JS；Content Collections 用 schema 校验内容；2026 年起由 Cloudflare 维护 |
| 内容存储 | Git 仓库里的 Markdown / MDX / YAML | 内容即文件，可版本化、可迁移，Claude Code 也能直接写 |
| 后台 | Pages CMS（托管版 app.pagescms.org） | 只需仓库根目录一个 `.pages.yml`，站点保持纯静态，零运行时依赖；手机浏览器可用 |
| 托管 | Cloudflare Workers（静态资源模式）+ Workers Builds | Cloudflare 对新项目推荐 Workers；push 到 main 自动上线，分支自动生成预览 |
| 域名 / DNS | 用户自有域名，DNS 托管到 Cloudflare（域名未定，M1 先用 workers.dev 地址） | Workers 自定义域名要求 nameserver 在 Cloudflare |
| 统计 | Cloudflare Web Analytics | 免费、无 cookie、不需要同意弹窗 |
| 字体 | 自托管（Astro Fonts API 或 fontsource） | 不依赖 fonts.googleapis.com（中国大陆访问不稳定） |
| 包管理 / 运行时 | pnpm 12；Node ≥ 22.12 | `astro check` 需要 TypeScript 6（不支持 7） |
| 测试 | Vitest（单元）+ Playwright（E2E）+ Lighthouse CI + axe | 对应第 9 节质量门槛 |

**架构原则**

- 内容与后台解耦：内容只认 `src/content/` 下的文件和 schema。后台只是一个编辑这些文件的界面，以后换 Keystatic / Sveltia / 自建后台都不需要迁移内容。
- v1 全站静态输出（`output: 'static'`）。需要动态能力时（评论、订阅、AI），用 Cloudflare 适配器只给对应路由开按需渲染，再接 D1 / R2 / KV。
- 只有首页 Feed 筛选需要客户端 JS，写成一个极小的 island（原生 JS，不引 React）。

## 4. 内容模型

四个 Content Collection，定义在 `src/content.config.ts`，用 zod 校验。schema 校验失败必须让构建失败。

分类是固定枚举，内部 slug 和颜色如下（颜色同时用于贴纸和时间轴圆点）：

| 显示名 | slug | 颜色 token |
|---|---|---|
| 训练 | train | `--cat-train` #FFE34D |
| AI | ai | `--cat-ai` #BFD0FF |
| 产品 | product | `--cat-product` #C9F0C2 |
| 二次元 | acg | `--cat-acg` #FFC9DE |
| 小红书 | xhs | `--cat-xhs` #FFD3C4 |

### 4.1 posts · 长文 — `src/content/posts/<slug>.mdx`

```yaml
title: string            # 必填
description: string      # 必填，≤ 120 字，用作摘要和 meta description
date: date               # 必填
updated: date            # 可选
category: 训练 | AI | 产品 | 二次元 | 小红书   # 必填
tags: string[]           # 可选，默认 []
cover: image             # 可选，Astro image()
coverAlt: string         # cover 存在时必填
pinned: boolean          # 默认 false；全站最多 1 篇生效（取日期最新的那篇）
draft: boolean           # 默认 false；生产构建排除
```

正文可用的 MDX 组件：`<Aside>`（页边手写批注，桌面在右栏，手机落到段落下方）、`<PullQuote>`（荧光笔金句）、`<Figure>`（拍立得框图片）、`<LogCard>`（内嵌训练日志卡）。代码块用 Astro 内置 Shiki。

### 4.2 notes · 碎碎念 — `src/content/notes/<YYYY-MM-DD-HHmm>.md`

```yaml
date: datetime           # 必填
category: 训练 | AI | 产品 | 二次元 | 小红书   # 必填
draft: boolean           # 默认 false
```

正文 1–280 字纯文本（允许链接）。有独立永久链接，主要在 Feed 里以便利贴样式出现。

### 4.3 logs · 训练日志 — `src/content/logs/<slug>.md`

```yaml
title: string            # 必填，如「HYROX 模拟日」
date: date               # 必填
kind: CrossFit | HYROX | 跑步 | 力量 | 其他   # 必填
items: string[]          # 必填，每行「动作 | 结果」，渲染时按第一个 | 拆成两列
draft: boolean           # 默认 false
```

分类固定为「训练」。正文是训练感受（Markdown，可空）。`items` 用字符串列表而不是对象列表，是为了兼容 Pages CMS；如果 Pages CMS 的 list 字段也不可用，退回到正文里写 Markdown 表格，并在计划里注明。

### 4.4 xhs · 小红书笔记 — `src/content/xhs/<slug>.md`

```yaml
title: string            # 必填
date: date               # 必填
url: url                 # 必填，小红书笔记链接
cover: image             # 可选，3:4
coverAlt: string         # cover 存在时必填
draft: boolean           # 默认 false
```

分类固定为「小红书」。没有站内详情页，卡片和 RSS 都指向外链。

### 4.5 站点数据 — `src/data/site.yaml`

首页简介文案、「现在在忙」列表、社交链接（小红书、GitHub、邮箱）、头像。放成数据文件，后台可编辑，不写死在组件里。通过 `@rollup/plugin-yaml` 引入，在 `src/lib/site.ts` 用 zod 校验；字段写错时构建失败。

### 4.6 统一 Feed — `src/lib/feed.ts`

- 合并四个集合为统一类型 `FeedItem { type, id, title?, body?, date, category, href, external, ... }`。
- 按 `date` 倒序；生产环境排除 `draft: true`。
- 置顶：`pinned: true` 的长文里取日期最新的一篇放最前，并从普通列表中移除。
- 按月分组：`{ key: '2026-09', label: 'September', sub: '2026 · 九月', items }`。
- 时区：全站日期按北京时间（`SITE_TZ = 'Asia/Shanghai'`）显示和分组，避免出现「卡片显示 10.01，却被分进九月」。
- 卡片倾斜角：根据 id 做确定性哈希，落在 [-0.8°, 0.8°]，保证每次构建一致。
- 这些都是纯函数，必须有单元测试（见第 9 节）。

### 4.7 样例内容

设计稿里的样例标题和文案只能用作测试 fixture（`tests/fixtures/`），不能当真实内容上线。生产内容只放站长自己提供的内容；M1 上线时至少要有 1 篇真实文章。开张文由 Claude Code 在本地 `drafts/`（已 gitignore）起草，站长确认后才移入 `src/content/` 并提交。占位一律用 `[方括号]`，禁止编造经历、数据或成绩。

## 5. 信息架构与路由

| 路由 | 内容 | 里程碑 |
|---|---|---|
| `/` | 首屏简介 + 置顶 + 最近 20 条 Feed（按月分组）+ 侧栏（现在在忙、订阅、常写话题）；超过 20 条时底部链接到 `/feed/2/` | M1 |
| `/feed/[page]/` | 全部 Feed 分页，从第 2 页开始（第 1 页就是首页），每页 20 条；`/feed/`、`/feed/1/` 301 跳到 `/` | M1 |
| `/category/[slug]/` | 某分类的全部内容，分页每页 20 条 | M1 |
| `/posts/[slug]/` | 长文详情 | M1 |
| `/notes/[id]/` | 碎碎念永久链接 | M1 |
| `/logs/[slug]/` | 训练日志永久链接 | M1 |
| `/about/` | 关于（简版：简介、照片、社交链接） | M1 |
| `/rss.xml` | 全站 RSS（四种类型都进，xhs 指向外链） | M1 |
| `/sitemap-index.xml`、`/robots.txt` | 自动生成 | M1 |
| `/404` | 涂鸦风 404 | M1 |
| `/tags/[tag]/` | 标签页 | M3 |
| `/search/` | 站内搜索（Pagefind） | M3 |

首页筛选：在已渲染的 20 条里按分类做客户端显示 / 隐藏，按钮带 `aria-pressed`，底部附「查看全部 → /category/[slug]/」。没有 JS 时，所有条目照常显示，筛选按钮退化为指向分类页的链接。

## 6. 视觉实现

**唯一视觉来源**：`design/` 下的画板文件（`Home.dc.html` 桌面首页、`HomeMobile.dc.html` 手机首页、`Post.dc.html` 文章页、`Style.dc.html` 设计规范），以及从中提取的 `design/tokens.css`。读法见 `design/README.md`。

**必须遵守的画图守则**（来自设计规范板）

1. 卡片倾斜控制在 ±1° 以内，正文文字永远不歪。
2. 一屏最多一处荧光笔高亮。荧光笔只用于标题（`titleHighlight` 指定的那几个字）和 `<PullQuote>` 金句；文章里的 h2 用手绘下划线（r3）。
3. 手写体只用于批注和点缀，供人阅读的内容一律用正文字体。
4. 分类色只出现在贴纸和时间轴圆点上，不铺大面积。
5. 投影统一用墨色硬投影（右下 5–6px），不用模糊阴影。
6. 照片和配图一律装进拍立得或胶带框，不裸放。

**字体**

- 标题：ZCOOL KuaiLe（站酷快乐体），自托管，按 unicode-range 分片加载。
- 批注：Caveat（拉丁字符），中文回退到 ZCOOL KuaiLe。
- 正文：系统中文字体栈（`-apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif`），不额外加载正文 web font，保证首屏速度。
- 一律 `font-display: swap`，禁止引用 Google Fonts CDN。

**组件清单**（命名可调整，职责不变）

- 涂鸦基元：`SketchBox`（A/B 两种手绘圆角）、`Tape`、`Highlight`、`Wavy`、`Sticker`（分类贴纸）、`Arrow`、`Sparkle`、`MooseLogo`、`Stamp`（置顶章）、`Polaroid`、`StickyNote`、`RuledCard`（横格卡）
- Feed：`FeedTimeline`、`MonthGroup`、`PinnedCard`、`PostCard`、`NoteCard`、`LogCard`、`XhsCard`、`FeedFilter`（island）、`EmptyState`
- 布局：`BaseLayout`、`PostLayout`、`SiteHeader`（手机为汉堡菜单）、`SiteFooter`、`NowBox`、`SubscribeBox`、`TopicCloud`

**响应式与可访问性**

- 断点：手机 < 640px，平板 640–1023px，桌面 ≥ 1024px；文章页右侧批注栏只在 ≥ 1024px 出现。
- 390px 宽度下不得出现横向滚动。
- 触控目标 ≥ 44px；所有交互用原生 `<a>` / `<button>`；`:focus-visible` 用 2px 马克笔蓝描边。
- 文字对比度 ≥ 4.5:1（24px 以上 ≥ 3:1）；`prefers-reduced-motion` 时关闭卡片悬停动效。
- 有 cover 的图片必须有 alt（schema 已强制）。

## 7. 发布工作流

**Pages CMS（M2）**

- 仓库根目录 `.pages.yml` 定义 5 个内容入口：长文、碎碎念、训练日志、小红书笔记、站点设置（`site.yaml`），字段与第 4 节 schema 一一对应。
- 媒体目录：`src/assets/uploads/`（交给 Astro Image 处理成 AVIF / WebP）。
- 保存即提交到 main → Workers Builds 自动构建 → 上线。目标：从保存到上线 ≤ 5 分钟。
- 草稿：`draft: true` 的内容会进仓库，但不进生产构建。**仓库是公开的，所以草稿在 GitHub 上任何人都能看到**（包括在 Pages CMS 里存的草稿）。不想提前公开的内容，写在本地 `drafts/` 目录（已 gitignore），准备发布时再移入 `src/content/`。

**Claude Code（随时可用）**

- 站长可以直接让 Claude Code 新建 / 修改 `src/content/` 下的文件。建议在 M2 末尾加一个项目级 skill：`new-post`（按 schema 生成 frontmatter、校验、本地预览）。

**定时发布**：P1。可选方案是用 GitHub Actions 或 Cloudflare Cron 每天触发一次构建，配合 `date` 晚于当前时间的内容不发布。

## 8. 部署与环境

- GitHub 仓库 `moose-lab/moose-site`（**公开**），`main` = 生产，其他分支 = 预览。公开仓库意味着提交记录、草稿和所有文件都可见；代码 MIT，内容保留所有权利（见 `LICENSE`）。
- Cloudflare Workers 静态资源模式，`wrangler.jsonc` 指向 `dist/`；Workers Builds 连接仓库：构建命令 `pnpm build`，部署命令 `npx wrangler deploy`。具体配置以实施时 Cloudflare 和 Astro 的官方文档为准。
- 自定义域名绑定到 Worker，裸域与 `www` 二选一做主域，另一个 301 跳转。
- CSP：用 Astro 内置的 `security.csp`，以 `<meta>` 标签输出，内联脚本自动生成哈希。脚本只放行自身和 Cloudflare Web Analytics；样式只对 `style` 属性放行 `'unsafe-inline'`（卡片倾斜角和 Shiki 代码高亮需要）。
- 安全响应头（`public/_headers`，上线时核实 Workers 静态资源对 `_headers` / `_redirects` 的支持）：`Content-Security-Policy: frame-ancestors 'none'`（meta 标签不支持这一项）、`X-Content-Type-Options: nosniff`、`Referrer-Policy: strict-origin-when-cross-origin`、`Permissions-Policy`。
- 缓存：带 hash 的静态资源长缓存；HTML 短缓存。
- 密钥：仓库里不放任何 token。Cloudflare 登录（`wrangler login`）、连接 GitHub、绑定域名由站长本人在浏览器完成。
- 中国大陆访问：v1 不做备案，只走 Cloudflare 全球网络。如果第 13 节 Q1 的答案是「读者以大陆为主」，P2 再加 ICP 备案 + 国内 CDN 双部署。静态输出让双部署成本很低。

## 9. 质量门槛（审计 / verification-before-completion 逐条对照）

**构建与类型**

- [ ] `pnpm astro check` 0 错误；`pnpm build` 通过。
- [ ] 内容 schema 不合法时构建失败：`pnpm test:schema-guard` 通过（用 `tests/fixtures/invalid/` 构建，必须报 `InvalidContentEntryDataError`）。

**单元测试（Vitest）**

- [ ] Feed 合并、倒序、草稿排除、置顶唯一、按月分组（北京时间，含跨 UTC 日界）、分类 slug 映射、倾斜角确定性，全部有测试。
- [ ] `logs.items` 的「动作 | 结果」解析：含多个 `|`、缺少 `|`、首尾空格，都有测试。

**E2E（Playwright，用 fixture 内容）**

- [ ] 首页渲染首屏简介、置顶卡，以及四种卡片各至少一张。
- [ ] 点击分类筛选后，`aria-pressed` 切换，其他分类条目隐藏；空分类（fixture 中的「产品」）显示空状态，`/category/product/` 也显示空状态。
- [ ] 首页「翻更早的几页」指向 `/feed/2/`，`/feed/2/` 能返回首页。
- [ ] 首页、文章页、`/feed/2/` 的 console 中没有 CSP 违规报错。
- [ ] 禁用 JS 时首页内容完整，筛选按钮可跳转分类页。
- [ ] 文章页渲染标题、封面、`<Aside>`，上一篇 / 下一篇链接正确。
- [ ] 390×844 视口下首页和文章页无横向滚动；手机菜单可开合，可用键盘操作。
- [ ] 404 页可访问。

**性能 / 可访问性 / SEO**

- [ ] Lighthouse 移动端：首页与一篇文章，Performance ≥ 95、Accessibility ≥ 95、Best Practices ≥ 95、SEO = 100。
- [ ] axe 扫描 0 个 serious / critical。
- [ ] 首页客户端 JS ≤ 15 KB（gzip），CLS < 0.1。
- [ ] 站内链接 0 个 404；RSS 通过校验；sitemap 包含所有公开路由、不含草稿。
- [ ] 每页都有唯一的 `<title>`、meta description、canonical、Open Graph；长文带 JSON-LD `BlogPosting`。

**视觉审查**

- [ ] 对照 `design/` 画板逐页走查，并逐条核对第 6 节的 6 条画图守则。

**安全**

- [ ] 仓库和构建产物中没有密钥；生产环境响应头符合第 8 节；`/feed/` 返回 301。

## 10. 里程碑

**M1 · 骨架上线**（目标：生产环境能访问、能读）

- Astro 项目初始化、tokens、字体、涂鸦基元组件。
- 四个内容集合 + `site.yaml` + Feed 库与单元测试。
- 首页（含筛选 island）、全部 Feed 分页、分类页、长文页、碎碎念 / 日志永久链接、关于页、404。
- RSS、sitemap、robots、meta / OG。
- Cloudflare 部署 + 自定义域名 + HTTPS。
- 验收：第 9 节除 Lighthouse 之外全部通过；Lighthouse 在线上环境复测通过。

**M2 · 后台发布**

- `.pages.yml` 覆盖全部内容类型和站点设置。
- 验收：站长在手机上发一条碎碎念，5 分钟内出现在线上；草稿不上线；上传的图片被优化输出。
- 项目级 skill `new-post`。

**M3 · 阅读体验增强**（按 M1 上线后的真实效果调整优先级）

- 标签页、Pagefind 站内搜索（先验证中文分词效果）、阅读时间、长文目录、自动生成 OG 图、Cloudflare Web Analytics。

**M4 · 扩展**（每项单独写 spec）

- 评论（候选：Giscus / Waline / 基于 D1 自建，取决于读者群）
- 邮件订阅（候选：Buttondown，或 Resend + D1）
- 专栏页
- 英文版 i18n（服务海外读者）
- 「问 Moose」：基于站内文章的 AI 问答（Workers + 向量检索）
- 训练数据接入（Strava / Garmin 等，按可用 API 评估）
- 长文 → 小红书笔记的二次分发工作流（Claude skill）
- 定时发布

## 11. 架构预留（v1 不实现，但不能堵死）

- 路由不要写死语言，方便以后加 `/en/` 前缀。
- 动态功能走 `src/pages/api/*` 加按需渲染，不改动静态页面。
- 图片如果超出仓库承受范围，迁到 Cloudflare R2 加 Image Transformations，组件层只需要改 `Figure` / `Polaroid` 的取图方式。
- Feed 的 `FeedItem` 类型留出 `type` 扩展位（以后的「专栏」「作品」都能加进时间线）。

## 12. 需要站长手动完成的事

1. 准备域名，把 DNS（nameserver）托管到 Cloudflare。
2. 新建 GitHub 公开仓库 `moose-lab/moose-site`，把本工具包放进去；提交作者邮箱用 GitHub noreply 邮箱。
3. 注册 / 登录 Cloudflare，在 Workers & Pages 中连接仓库（Claude Code 会给出具体构建参数）。
4. M2：用 GitHub 登录 app.pagescms.org，授权这个仓库。
5. 提供真实内容：头像 / 照片、简介、社交账号、第一篇文章（或确认 Claude Code 起草的开张文）。
6. 可选：开启 Cloudflare Web Analytics；如果要邮件订阅，注册对应服务。

## 13. 已决问题（按默认值定稿，可随时推翻）

| # | 问题 | 决定 | 影响 |
|---|---|---|---|
| Q1 | 读者主要在中国大陆，还是海外 / 港台？ | 先不备案，走 Cloudflare 全球网络 | 是否需要 P2 备案 + 国内 CDN |
| Q2 | 后台用 Pages CMS（独立后台）还是 Keystatic（站内 `/keystatic` 后台）？ | Pages CMS | Keystatic 需要 Cloudflare 适配器、React 依赖，并且要先验证 Astro 7 兼容性 |
| Q3 | 域名是什么？是否已托管到 Cloudflare？ | 未定，M1 先上 `*.workers.dev` 预览地址 | 生产上线时间 |
| Q4 | v1 是否需要英文版？ | 不需要，只做路由预留 | 工作量 |

## 14. 修订记录

**r3 · 2026-10-05（M1 终验，站长已确认）**

- 文章 h2 从荧光笔底改为手绘下划线；荧光笔只留给标题和金句。原因：设计稿 `Post.dc.html` 给每个 h2 都加了荧光笔，没有封面的文章第一屏会出现两处高亮，违反画图守则第 2 条（站长决定）。由 E2E 用例守住。
- 主按钮的蓝色投影、拍立得和便利贴的半透明投影沿用设计稿，作为守则第 5 条（墨色硬投影）的已知例外；全站没有模糊阴影。

**r2 · 2026-10-05（第二轮评审，站长已确认）**

- 全部 Feed 分页 `/feed/[page]/` 从 M3 提前到 M1（站长决定）。
- 开张文和所有未确认的草稿写在本地 `drafts/`，确认后再提交（站长决定，原因是仓库公开）。
- `site.yaml` 改用 `@rollup/plugin-yaml` 引入（实测直接 import 会构建失败）。
- 月份分组改按北京时间（实测按 UTC 会把 10/01 清晨的内容分进九月）。
- CSP 改用 Astro 内置 `security.csp`，去掉脚本的 `'unsafe-inline'`。
- schema 不合法时构建失败，改为自动化校验（`pnpm test:schema-guard`）。
- fixture 让「产品」分类只有草稿，用来测空状态；再加 25 条碎碎念，用来测 `/feed/2/`。
- 执行环境确定为站长 Mac 上的 Claude Code + superpowers。
