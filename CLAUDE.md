# Moose 个人网站 · 项目约定（给 Claude Code）

## 这是什么

Moose 的个人博客：运动（CrossFit / HYROX）× AI × 做产品 × 二次元。Feed 流是核心，视觉风格是「草稿本涂鸦」。

## 开工前必读

1. `docs/superpowers/specs/2026-10-05-moose-site-v1-design.md`：需求、内容模型、路由、质量门槛、里程碑
2. `docs/adr/0001-tech-stack.md`：为什么选这套技术栈
3. `design/README.md`，以及 `design/` 下的画板和 `tokens.css`：唯一视觉来源

spec 和设计稿冲突时，先停下来问站长，不要自己选一边。

## 工作流（superpowers）

- brainstorming 已在 claude.ai 完成，spec 已定稿。
- M1 计划已写好：`docs/superpowers/plans/2026-10-05-m1-skeleton.md`（核心代码已在沙盒验证），直接执行；M2 起每个里程碑用 `writing-plans` 新写一份，放在同一目录。
- 执行用 `subagent-driven-development`，坚持 TDD，频繁小步提交。
- 宣布完成前，必须跑 `verification-before-completion`，对照 spec 第 9 节逐条验证，并用 `requesting-code-review` 审查一次。

## 技术栈

Astro 7（`output: 'static'`）· Content Collections + zod · Pages CMS（`.pages.yml`）· Cloudflare Workers 静态资源 · pnpm · Vitest · Playwright · Lighthouse CI · axe

## 常用命令（M1 搭好后保持这些名字）

- `pnpm dev`：本地开发
- `pnpm build`：生产构建
- `pnpm check`：`astro check` 类型检查
- `pnpm test`：Vitest 单元测试
- `pnpm test:schema-guard`：确认非法内容会让构建失败
- `pnpm test:e2e`：Playwright
- `pnpm lhci`：Lighthouse CI

## 已知坑（沙盒验证得出）

- `astro check` 不支持 TypeScript 7，固定 `typescript@^6`。
- pnpm 12 需要 `pnpm approve-builds esbuild sharp -y`（写入 `pnpm-workspace.yaml` 的 `allowBuilds`）。
- zod 从 `astro/zod` 引入；URL 用 `z.url()`。
- YAML 不能直接 import，需要 `@rollup/plugin-yaml`。
- 内置 CSP 的 script/style 规则只能写进 `scriptDirective` / `styleDirective`，不能写进 `directives`。

## 硬性规则

- 内容：不编造经历、成绩、数据、引用。缺失的信息用 `[方括号占位]`。设计稿里的样例文案只能放在 `tests/fixtures/`。
- 字体：自托管，禁止引用 fonts.googleapis.com 等外部字体 CDN；正文用系统字体栈。
- 脚本：除 Cloudflare Web Analytics 外不引第三方脚本；客户端 JS 只用于首页筛选 island。
- 视觉：遵守 spec 第 6 节的 6 条画图守则；不用渐变铺底、模糊阴影、emoji 图标。
- 可访问性：原生 `<a>` / `<button>`，触控目标 ≥ 44px，对比度达标，尊重 `prefers-reduced-motion`。
- 公开仓库：没确认要发布的草稿写在 `drafts/`（已 gitignore），不要放进 `src/content/`；不提交私人信息和真实邮箱；本地密钥放 `.dev.vars`（已忽略）。
- 时间：所有日期按北京时间显示和分组，统一用 `src/lib/time.ts`，不要自己调用 `getUTC*` 或 `toLocaleDateString`。
- 密钥：任何 token 都不写进仓库或日志。需要登录 Cloudflare、GitHub、Pages CMS 时，停下来请站长自己操作。
- 文案语言：界面文案用简体中文；代码标识符用英文。
