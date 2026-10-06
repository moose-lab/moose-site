# moose-drafts（私有草稿仓库模板）

这个目录是私有仓库 `moose-lab/moose-drafts` 的模板。网站仓库是公开的，未发表的草稿放在这里。

## 一次性设置

1. 在 GitHub 新建**私有**仓库 `moose-lab/moose-drafts`，把本目录下的全部内容（包括 `.github/` 和 `src/`）复制进去并推送。
2. 新建一个细粒度 PAT 给发布工作流用：仓库只选 `moose-lab/moose-site`，权限给 Contents：Read and write。
3. 在 `moose-drafts` → Settings → Secrets and variables → Actions 里新建 secret `MOOSE_SITE_TOKEN`，值填上一步的令牌。

## 日常使用

- 写草稿：打开网站的 `/admin/drafts/`。保存只会提交到这个私有仓库，不会触发网站构建。
- 发布：在 GitHub（网页或手机 App）打开 `moose-drafts` → Actions → 「发布草稿」→ Run workflow，填入文件路径，例如 `src/content/posts/hello.mdx`。工作流会：
  1. 把文件和它引用的图片复制进网站仓库，并把 `draft` 设为 `false`；
  2. 在网站仓库跑完整的检查、测试和构建，任何一步失败都不会发布；
  3. 推送到网站 `main`，Cloudflare 自动部署；
  4. 从草稿仓库删除这份草稿（Git 历史里仍保留）。

图片要放在条目同级的 `images/` 文件夹里，例如 `src/content/posts/images/`。后台默认就是这样存的。
