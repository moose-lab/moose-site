# M2 · 写作后台（Sveltia CMS）实现计划

依据：ADR 0002、spec r4。执行方式：superpowers `executing-plans`，逐任务 TDD。此环境没有子代理工具，因此不用 `subagent-driven-development`，全分支审查为自审。

## Task 1 · 依赖与配置生成器
- 添加 `@sveltia/cms@0.228.0`（精确版本）和 `ajv`（开发依赖）。
- `src/admin/cms-config.ts`：`buildCmsConfig(target: 'site' | 'drafts')` 返回 Sveltia 配置对象。
  - collections：posts（.md）、posts_mdx（.mdx）、notes、logs、xhs；`site` 目标额外包含 `site.yaml`。
  - 枚举来自 `CATEGORY_NAMES`、`LOG_KINDS`。
  - notes 使用 `input_timezone: Asia/Shanghai`，正文最多 280 字；摘要最多 120 字；日志条目必须是「动作 | 结果」格式。
  - `publish_mode: simple`，`auth_methods: [token]`。
- 测试：两份配置都能通过 Sveltia 自带的 JSON Schema；枚举与网站常量一致；drafts 目标指向私有仓库，且不含 `site.yaml`；不出现 editorial workflow。

## Task 2 · Astro 集成
- `src/integrations/admin-cms.ts`：在 `astro:config:setup` 阶段生成 `public/admin/config.json`、`public/admin/drafts/config.json`，并把锁定版本的 `sveltia-cms.js` 复制到 `public/admin/`。生成的文件不进 git。
- 测试：在临时目录调用写入函数，检查生成的文件。

## Task 3 · 后台页面与 MDX 组件
- `public/admin/index.html`、`public/admin/drafts/index.html`：`noindex`，手动初始化（`CMS_MANUAL_INIT`），先注册组件再加载配置。
- `public/admin/cms-components.mjs`：Aside、PullQuote、Figure、LogCard 四个组件，每个包含 pattern、fromBlock、toBlock、toPreview。
- 测试：每个组件都要满足「解析 → 生成」往返后内容不变。

## Task 4 · 安全与 SEO
- `public/_headers`：`/admin/*` 单独的 CSP、`X-Robots-Tag: noindex`；config 不缓存。
- 生产环境 `robots.txt` 增加 `Disallow: /admin/`（先改测试）。sitemap 不包含 `/admin/`。

## Task 5 · 草稿发布
- `scripts/publish-draft.mjs`：找出文章引用的相对图片；把 `draft` 设为 false；把文章和图片复制到网站仓库对应目录。为这些逻辑写单元测试。
- `ops/drafts-repo/`：私有草稿仓库的模板，包括 README、目录骨架和 `publish.yml`。工作流先在网站仓库里完整构建校验，通过后再推送到 `main`。

## Task 6 · E2E
- 后台页面能加载出登录界面，界面是中文，没有页面报错。
- 在本地 Workers 运行时下验证 `/admin/` 的 CSP 和响应头。
- 公开页面的 JS 体积和 CSP 不变。

## Task 7 · 文档与验收
- README 增加「写作后台」一节：首次设置、PAT、草稿发布。
- 对照 spec §9 重新验收；全分支自审。
- STOP：创建私有仓库、PAT 和 Action secret 需要站长本人操作。

> 2026-10-06 补充：草稿仓库模板在 `ops/drafts-repo/`（含检查和发布两个工作流）；人工验证步骤见 `docs/verification/m2-writing-admin.md`。
