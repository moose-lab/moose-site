// Sveltia CMS editor components for the MDX components a CMS-edited post may contain.
// Plain browser ES module: copied to /admin/ by src/integrations/admin-cms.ts and unit-tested from here.
// <Figure> is deliberately absent: it needs an `import` line the editor cannot manage — use the image button
// (Markdown images are optimised by Astro and framed like a polaroid by PostLayout).

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ESC[ch]);

/** JSX string attributes have no escapes, so values containing `"` fall back to a JS expression. */
const jsxString = (s) => (s.includes('"') ? `{${JSON.stringify(s)}}` : `"${s}"`);

const wrapper = (id, label, tag, previewClass) => ({
  id,
  label,
  fields: [{ name: 'text', label: '内容', widget: 'string' }],
  pattern: new RegExp(`^<${tag}>([\\s\\S]*?)</${tag}>$`),
  fromBlock: (m) => ({ text: m[1] }),
  toBlock: ({ text = '' }) => `<${tag}>${text}</${tag}>`,
  toPreview: ({ text = '' }) => `<div class="${previewClass}">${esc(text)}</div>`,
});

export const components = [
  wrapper('aside', '页边批注', 'Aside', 'cms-aside'),
  wrapper('pullquote', '金句', 'PullQuote', 'cms-pullquote'),
  {
    id: 'logcard',
    label: '训练卡',
    fields: [
      { name: 'title', label: '标题', widget: 'string' },
      { name: 'items', label: '动作 | 结果', widget: 'list' },
    ],
    pattern: /^<LogCard title=(?:"([^"]*)"|\{("(?:[^"\\]|\\.)*")\}) items=\{(\[.*?\])\} \/>$/,
    fromBlock: (m) => ({ title: m[1] !== undefined ? m[1] : JSON.parse(m[2]), items: JSON.parse(m[3]) }),
    toBlock: ({ title = '', items = [] }) => `<LogCard title=${jsxString(title)} items={${JSON.stringify(items)}} />`,
    toPreview: ({ title = '', items = [] }) =>
      `<div class="cms-logcard"><strong>${esc(title)}</strong><ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></div>`,
  },
];
