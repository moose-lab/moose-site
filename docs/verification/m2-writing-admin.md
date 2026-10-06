# M2 写作后台 · 人工验证清单

自动化测试覆盖不到的部分在这里逐项手动验证：真实登录和保存、Cloudflare 部署、GitHub Actions、手机输入法。这些都需要你的账号和令牌。

按顺序做。每一步都写了「预期」；结果不一致就停下，把「不符时发我」里列的东西发给我。预计 40–60 分钟。下文的 `<预览站>` 指 `https://moose-site.<子域>.workers.dev`。

## 0. 前置检查

- [ ] **0.1 把仓库改名为 `moose-drafts`，并确认是私有的**
  - 操作：GitHub → `moose-admin` → Settings → General → Repository name 改为 `moose-drafts` → Rename。改名后旧地址会自动跳转。
  - 预期：
    - 仓库页面显示 `moose-lab/moose-drafts`，名字旁边标着 Private；
    - 用无痕窗口（未登录）打开 `https://github.com/moose-lab/moose-drafts`，显示 404。
  - 如果仓库是公开的：Settings → General → 最下方 Danger Zone → Change repository visibility → Private。
  - 不符时发我：仓库设置页和无痕窗口的截图。
- [ ] **0.2 本机 pnpm 版本**
  - 操作：在 `~/moose-site` 里运行 `pnpm --version`。
  - 预期：`12.9.1`。不是的话先运行 `npm install -g pnpm@12.9.1`。

## 1. 推送代码，部署到预览站

- [ ] **1.1 应用补丁并推送**

  ```bash
  cd ~/moose-site && git switch main && git pull --ff-only
  rm -rf /tmp/m2 && unzip -o ~/Downloads/m2-writing-admin-patches.zip -d /tmp/m2
  git am --3way /tmp/m2/m2-patches/*.patch
  git log --oneline origin/main..HEAD | wc -l    # 预期 10
  git push
  ```

  - 不符时发我：`git am` 的完整输出。
- [ ] **1.2 Cloudflare 构建**
  - 预期：构建日志里有 `[moose-admin-cms] writing admin generated in public/admin/`，并且部署成功。
  - 不符时发我：完整构建日志（下载 .log 文件）。
- [ ] **1.3 打开 `<预览站>/admin/`**
  - 预期：
    - 出现登录页，按钮是「使用访问令牌登录」，界面是中文；
    - 图标正常显示，不是方框，也不是英文单词（比如 "edit"）；
    - 浏览器标签标题是「Moose 写作后台」。
  - 不符时发我：页面截图，以及浏览器开发者工具 Console 里的红色报错。
- [ ] **1.4 打开 `<预览站>/admin/drafts/`**
  - 预期：同 1.3，标签标题是「Moose 草稿箱」。
- [ ] **1.5 后台的响应头**
  - 操作：`curl -sI <预览站>/admin/ | grep -iE "x-robots-tag|content-security-policy"`
  - 预期：
    - 有 `x-robots-tag: noindex, nofollow`；
    - 有一条包含 `cdn.jsdelivr.net` 和 `api.github.com` 的 `content-security-policy`。
- [ ] **1.6 公开页面没有受影响**
  - 预期：
    - 首页、文章页显示正常；
    - `curl -s <预览站>/robots.txt` 的结果是 `Disallow: /`（预览模式下整站禁止抓取）。

## 2. 生成两个令牌

两个令牌分开的原因：发布工作流用的令牌会长期存放在 GitHub 上，所以只给它写网站仓库的权限；后台登录用的令牌只存在你自己的浏览器里。

- [ ] **2.1 令牌 A（后台登录用）**
  - 操作：GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token：
    - Resource owner 选 `moose-lab`；
    - Repository access 选 Only select repositories，勾选 `moose-site` 和 `moose-drafts`；
    - Permissions → Repository permissions → Contents 设为 Read and write（Metadata: Read 会自动带上）；
    - Expiration 设为 90 天。
  - 生成后在日历里设一个第 85 天的提醒。
- [ ] **2.2 令牌 B（发布工作流用）**
  - 操作：同上，但仓库只勾选 `moose-site`。先别关页面，第 5.2 步要用。

## 3. 在 `/admin/` 做一次真实的保存和删除

- [ ] **3.1 登录**
  - 操作：电脑浏览器打开 `<预览站>/admin/`，点「使用访问令牌登录」，粘贴令牌 A。
  - 预期：
    - 左侧有六项：长文、长文（带组件 · MDX）、碎碎念、训练日志、小红书笔记卡片、站点设置；
    - 「长文」里能看到现有的文章。
  - 不符时发我：截图。如果提示令牌无效，检查 2.1 的仓库和权限。
- [ ] **3.2 新建一条碎碎念**
  - 操作：分类选「训练」，内容写「后台测试，稍后删除」，时间保持默认，保存。
  - 预期：
    - `moose-site` 出现新提交，提交信息形如 `content: 新建 notes/2026-10-xx-hhmm`；
    - 打开这个文件，`date:` 的值以 `+08:00` 结尾；
    - Cloudflare 自动开始新的构建，并且成功；
    - 预览站首页出现这条碎碎念，时间是北京时间。
  - 不符时发我：提交链接，以及 Cloudflare 构建日志。
- [ ] **3.3 删除它**
  - 操作：在后台打开这条碎碎念，删除。
  - 预期：出现提交 `content: 删除 notes/…`，重新部署后首页上消失。
- [ ] **3.4 查看站点设置（不保存）**
  - 操作：打开「站点设置 → 站点信息」。
  - 预期：名字、简介、社交链接等现有内容都正确显示。
  - 注意：这里一旦保存，`site.yaml` 里原有的注释就会消失。等你准备好填真实内容时再保存。

## 4. 手机上验证（iPhone Safari 或你常用的手机浏览器）

调研时没有找到中文输入法在这个编辑器里表现如何的公开资料，这是唯一的未知风险，需要实测。

- [ ] **4.1 登录**
  - 操作：手机打开 `<预览站>/admin/drafts/`，用令牌 A 登录。
- [ ] **4.2 中文输入**
  - 操作：新建一篇「长文」，在正文里用拼音输入法打一段话，过程中包括选候选词、删除、换行。
  - 预期：没有重复字、没有丢字，光标不乱跳。
  - 不符时发我：录屏。可以改用编辑器里的 Markdown 模式作为替代。
- [ ] **4.3 上传照片**
  - 操作：在同一篇文章里，把一张手机照片设为封面。
  - 预期：上传成功，能看到预览。
  - 这篇是测试稿，不用发布，退出时选择不保存即可。

## 5. 设置 `moose-drafts`（草稿仓库）

- [ ] **5.1 应用 `moose-drafts` 补丁并推送**（必须先完成第 1 步：两个工作流都会读取 `moose-site` 的 `main`）

  ```bash
  cd ~ && git clone https://github.com/moose-lab/moose-drafts.git && cd moose-drafts
  rm -rf /tmp/ma && unzip -o ~/Downloads/moose-drafts-patches.zip -d /tmp/ma
  git am --3way /tmp/ma/moose-drafts-patches/*.patch
  git log --oneline origin/main..HEAD | wc -l    # 预期 2
  git push
  ```

  - 预期：
    - Actions 页出现「检查草稿」和「发布草稿」两个工作流；
    - 这次推送会自动触发一次「检查草稿」，结果为绿色 ✓。仓库里已经有开张文草稿，说明它能通过网站的校验。
  - 不符时发我：`git am` 的输出，或「检查草稿」失败那一步的日志。
- [ ] **5.2 添加 secret**
  - 操作：`moose-drafts` → Settings → Secrets and variables → Actions → New repository secret，名字填 `MOOSE_SITE_TOKEN`，值填令牌 B。

## 6. 在草稿箱写一篇测试文章

- [ ] **6.1 登录草稿箱**
  - 操作：电脑打开 `<预览站>/admin/drafts/` 并登录。
  - 预期：只有五项，没有「站点设置」；「长文（带组件 · MDX）」里有一篇「草稿本开张了」，其余都是空的。
- [ ] **6.2 新建测试长文**
  - 操作：新建「长文」，按下面填写后保存：
    - 网址名 `admin-smoke-test`，标题「后台发布测试」；
    - 写一句摘要，分类选「产品」，日期选今天；
    - 上传一张封面图并填写描述；
    - 正文写两段，再用图片按钮插入一张图。
  - 预期：
    - `moose-drafts` 出现提交 `content: 新建 posts/admin-smoke-test（草稿）`，并且 `src/content/posts/images/` 下有两张图；
    - 这次提交触发「检查草稿」，结果为绿色 ✓；
    - **Cloudflare 没有新的构建**；
    - `moose-site` 没有任何变化。

## 7. 发布工作流（正常流程）

- [ ] **7.1 运行工作流**
  - 操作：`moose-drafts` → Actions → 发布草稿 → Run workflow，path 填 `src/content/posts/admin-smoke-test.md`。手机上也可以在 GitHub App 里操作。
  - 预期：
    - 「Refuse to run in a public repository」显示为跳过（skipped）；
    - 其余步骤全部是绿色；
    - Validate 一步大约需要 1–2 分钟。
  - 不符时发我：失败那一步的日志。
- [ ] **7.2 网站仓库**
  - 预期：`moose-site` 出现提交 `content: 发布 src/content/posts/admin-smoke-test.md`，包含文章和两张图，文章里是 `draft: false`。
- [ ] **7.3 上线效果**
  - 预期：Cloudflare 自动部署成功；打开 `<预览站>/posts/admin-smoke-test/`，封面有胶带框，正文图片有拍立得边框。
- [ ] **7.4 草稿仓库**
  - 预期：`moose-drafts` 出现提交 `published: src/content/posts/admin-smoke-test.md`，草稿文件已删除。图片会保留，这是预期行为。

## 8. 发布工作流（异常情况：坏草稿不能上线）

- [ ] **8.1 内容不合规**
  - 操作：在 GitHub 网页上，在 `moose-drafts` 里新建文件 `src/content/notes/bad-test.md`，内容如下：

    ```
    ---
    date: 2026-10-06T10:00:00+08:00
    category: 不存在的分类
    ---
    这条不应该上线。
    ```

    然后用 path `src/content/notes/bad-test.md` 运行工作流。
  - 预期：
    - 新建文件的那次提交已经让「检查草稿」变成红色 ✗，日志里能看到 `bad-test` 和 `category`；
    - 发布工作流的 Validate 这一步失败（红色），后面的步骤都没有执行；
    - `moose-site` 没有新提交；
    - `bad-test.md` 仍然在 `moose-drafts` 里。
  - 验证完后，在 GitHub 网页上删除 `bad-test.md`。
- [ ] **8.2 越界路径**
  - 操作：用 path `../README.md` 运行工作流。
  - 预期：「Copy the draft into the site」这一步失败，日志里有「只能发布 src/content/{posts,notes,logs,xhs}/ 下的 .md / .mdx 文件」。

## 9. 清理测试内容

- [ ] **9.1 删除测试文章**
  - 操作：在 `<预览站>/admin/` 打开「长文 → 后台发布测试」，删除。再到素材库（Assets）里删掉它的两张图。
  - 预期：重新部署后，`<预览站>/posts/admin-smoke-test/` 变成 404，首页恢复原样。

## 10. 收尾

- [ ] **10.1 再次确认 `moose-drafts` 是私有的**：无痕窗口访问仍然显示 404。
- [ ] **10.2 记住这些应急操作**
  - 令牌丢了或泄露：GitHub → Settings → Developer settings → Fine-grained tokens → 找到对应令牌 → Revoke。然后重新生成，并更新后台登录或 `MOOSE_SITE_TOKEN`。
  - 发布了不该发布的内容：在 `moose-site` 里执行 `git revert <那次提交>`，然后 `git push`，Cloudflare 会自动部署回滚后的版本。

## 结果记录

| 步骤 | 结果（✅/❌） | 备注 |
|---|---|---|
| 0 前置 | | |
| 1 部署 | | |
| 2 令牌 | | |
| 3 /admin/ 保存与删除 | | |
| 4 手机 | | |
| 5 草稿仓库（补丁 + secret） | | |
| 6 草稿箱写作 | | |
| 7 发布（正常） | | |
| 8 发布（异常） | | |
| 9 清理 | | |
