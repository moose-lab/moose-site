# 设计参考（design/）

这些文件来自 claude.ai 的 Design 画布，是 Moose 网站「草稿本涂鸦 v2」的设计源文件。

| 文件 | 内容 |
|---|---|
| `Home.dc.html` | 桌面首页（1440 宽，可流式缩放） |
| `HomeMobile.dc.html` | 手机首页（390 宽） |
| `Post.dc.html` | 文章详情页（以 HYROX 那篇为样板） |
| `Style.dc.html` | 设计规范：色彩、字体、涂鸦元素、组件、画图守则 |
| `tokens.css` | 从以上文件提取的设计 token，实现时以它为准 |

## 怎么读这些 .dc.html

它们依赖画布自己的运行时（`./support.js`，不在这里），所以不能直接在浏览器里打开预览。把它们当成「带精确数值的结构稿」来读：

- `<x-dc>` 里面就是页面结构，样式几乎都写在行内 `style` 里，数值可以直接照搬。
- `<helmet><style>` 里是共用的 class（`.sk-box`、`.sk-tape`、`.sk-ruled` 等），已整理进 `tokens.css`，对应关系：`.sk-box` → `.sketch-a`，`.sk-box2` → `.sketch-b`，`.sk-paper` → `.paper`，`.sk-hl` → `.hl`，`.sk-ruled` → `.ruled`。
- `{{accent}}` 是可调强调色，默认值 `#2A4BD7`（即 `--marker`）；`{{wobble}}` 是倾斜系数，默认 1。
- `<sc-for list="{{items}}" as="item">` 是循环，`<sc-if value="{{x}}">` 是条件分支。
- 文件末尾 `<script type="text/x-dc">` 里的 `renderVals()` 是样例数据和筛选逻辑。样例数据只能当测试 fixture，不能当真实内容上线。
- Google Fonts 的 `<link>` 只是画布预览用的。实现时必须自托管字体（见 spec 第 6 节）。

## 可视化预览

渲染效果在站长的 claude.ai 设计画布里（私有，「A · 深化 v2」页面）。需要对照效果时，请站长截图提供。

## 与画板不一致之处（以代码为准）

- 文章页 h2：画板里是荧光笔底，实际改为手绘下划线，荧光笔只用于标题和金句（spec r3，画图守则第 2 条）。
