# moose-drafts（私有草稿仓库模板）

这个目录是 `moose-lab/moose-drafts` 仓库的模板。网站仓库 `moose-site` 是公开的，未发表的草稿存在 `moose-drafts` 里，由网站的 `/admin/drafts/` 编辑。

**`moose-drafts` 必须是私有仓库。** 公开的话，每一篇草稿都对所有人可见。发布工作流检测到仓库是公开的就会拒绝运行。

## 一次性设置

1. 确认 `moose-drafts` 是私有的：Settings → General → Danger Zone → Change repository visibility → Private。
2. 把本目录下的全部内容（包括 `.github/`、`src/` 和这份 README）复制到 `moose-drafts` 根目录，然后提交、推送。
3. 新建一个细粒度令牌给发布工作流用：仓库只选 `moose-lab/moose-site`，权限给 Contents：Read and write。
4. 在 `moose-drafts` → Settings → Secrets and variables → Actions 里新建 secret `MOOSE_SITE_TOKEN`，值填上一步的令牌。

## 日常使用

- **写草稿**：打开网站的 `/admin/drafts/`。保存只会提交到 `moose-drafts`，不会触发网站构建。
- **发布**：在 GitHub 网页或手机 App 上打开 `moose-drafts` → Actions → 「发布草稿」→ Run workflow，填入文件路径，例如 `src/content/posts/hello.mdx`。工作流会依次：
  1. 确认仓库是私有的；
  2. 把文件和它引用的图片复制进 `moose-site`，并把 `draft` 设为 `false`；
  3. 在 `moose-site` 里跑完整的检查、测试和构建，任何一步失败都不会发布；
  4. 推送到 `moose-site` 的 `main`，Cloudflare 自动部署；
  5. 从 `moose-drafts` 删除这份草稿（Git 历史里仍保留）。

## 自动检查

每次在 `/admin/drafts/` 保存后，「检查草稿」工作流会用网站的校验规则构建一遍全部草稿：

- 提交旁边显示绿色 ✓：所有草稿都可以发布；
- 显示红色 ✗：至少有一篇草稿发布时会失败。点进去看日志，日志会指出是哪个文件的哪个字段有问题。

连续快速保存时，旧的检查会被自动取消，只保留最后一次。

图片要放在条目同级的 `images/` 文件夹里，例如 `src/content/posts/images/`。后台默认就是这样存的。

完整的首次验证步骤见 `moose-site` 仓库的 `docs/verification/m2-writing-admin.md`。
