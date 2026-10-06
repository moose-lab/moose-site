# ADR 0002 · 写作后台：Sveltia CMS + 私有草稿仓库

- 状态：Accepted（2026-10-06，站长确认）
- 取代：ADR 0001 中「后台用 Pages CMS（`.pages.yml`）」这一项；ADR 0001 其余决定不变

## 背景

在 `src/content/` 里直接写 Markdown 太麻烦，需要一个能在手机上用、界面是中文的写作后台。约束：网站是纯静态 Astro + Cloudflare Workers 静态资源；内容放在公开 GitHub 仓库，构建期用 Zod 校验；只有一位作者；公开页面不能增加 JS。

2026 年 10 月的调研结论：

- Pages CMS 2.x（2026-03）起，自托管需要 PostgreSQL + GitHub App + Node 服务，没有 Workers 方案。R2 存储仍标「Soon」，日期没有时区选项。
- Sveltia CMS 是纯静态单页应用，可以自托管在 `/admin/`，用 GitHub 细粒度 PAT 登录，不需要服务端。它有 zh-CN 界面和移动端支持，DateTime 字段支持 `input_timezone`，图片可以按条目相对路径存放。

## 决定

1. 写作后台采用 Sveltia CMS，版本锁定为 `@sveltia/cms@0.228.0`，从 `node_modules` 自托管，不从 CDN 加载主程序。
2. 后台配置用 TypeScript 生成（`src/admin/cms-config.ts`），分类、训练类型等枚举直接引用网站代码里的常量，避免后台和 Zod schema 不一致。生成结果用 Sveltia 自带的 JSON Schema 在单元测试里校验。
3. 两个入口：
   - `/admin/`：连接公开仓库，用于已发布内容和 `site.yaml`；
   - `/admin/drafts/`：连接私有仓库 `moose-lab/moose-drafts`，用于写草稿。
4. 不使用 editorial workflow（它会在公开仓库建分支和 PR），也不在公开仓库存未发表的草稿。
5. 发布草稿：在私有仓库运行 GitHub Action，先在网站仓库里做完整构建校验，通过后再提交到 `main`。保存草稿不会触发 Cloudflare 构建。
6. 登录方式：GitHub 细粒度 PAT，只授权这两个仓库，权限为 Contents 读写。暂不部署 OAuth Worker。
7. `/admin/*` 单独设置 CSP，允许 Sveltia 需要的 unpkg（语言包）、GitHub API 等来源；公开页面的 CSP 不变。

## 代价与风险

- Sveltia 仍是 0.x，minor 版本可能有破坏性变更。缓解：锁定版本，用 JSON Schema 和 E2E 守住，升级前先在本地验证。
- MDX 组件靠正则匹配插入，复杂组件可能识别不了。缓解：四个组件都有往返单元测试。
- 中文界面的语言包从 unpkg 加载（按版本号锁定）。unpkg 不可用时界面会退回英文，不影响写作。
- PAT 存在浏览器本地。缓解：细粒度、90 天轮换，手机丢失后立刻撤销。

## 备选

Pages CMS 托管版（零基础设施）。在 Sveltia 出现阻断性问题时切换。
