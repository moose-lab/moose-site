import { CATEGORY_NAMES } from '../lib/categories';
import { LOG_KINDS } from '../content/schemas';

/**
 * Sveltia CMS configuration, generated from the site's own constants so the admin can never drift
 * from the Zod schemas (ADR 0002). `site` edits the public repo; `drafts` edits the private drafts repo.
 */
export type CmsTarget = 'site' | 'drafts';
type Field = { name: string; label: string; widget: string; [k: string]: unknown };
type Collection = { name: string; label: string; [k: string]: unknown };
export interface CmsConfig {
  load_config_file: false;
  app_title: string;
  backend: { name: 'github'; repo: string; branch: string; auth_methods: string[]; commit_messages: Record<string, string> };
  publish_mode: 'simple';
  site_url?: string;
  media_folder: string;
  public_folder: string;
  slug: Record<string, unknown>;
  output: Record<string, unknown>;
  collections: Collection[];
}

const REPOS: Record<CmsTarget, string> = { site: 'moose-lab/moose-site', drafts: 'moose-lab/moose-drafts' };
const STAMP = '{{year}}-{{month}}-{{day}}-{{hour}}{{minute}}';
const opt = { required: false };

const category = (): Field => ({ name: 'category', label: '分类', widget: 'select', options: [...CATEGORY_NAMES] });
const imagesNextToEntry = { media_folder: 'images', public_folder: './images' };

function postFields(): Field[] {
  return [
    { name: 'slug', label: '网址名（英文小写、数字、短横线）', widget: 'string', pattern: ['^[a-z0-9]+(-[a-z0-9]+)*$', '只能用小写字母、数字和短横线，例如 hyrox-8-stations'] },
    { name: 'title', label: '标题', widget: 'string' },
    { name: 'titleHighlight', label: '标题里要荧光笔高亮的几个字', widget: 'string', ...opt },
    { name: 'description', label: '摘要（卡片和分享预览用）', widget: 'text', maxlength: 120 },
    { name: 'date', label: '发布日期', widget: 'datetime', type: 'date' },
    { name: 'updated', label: '更新日期', widget: 'datetime', type: 'date', ...opt },
    category(),
    { name: 'tags', label: '标签', widget: 'list', ...opt },
    { name: 'cover', label: '封面图', widget: 'image', ...opt },
    { name: 'coverAlt', label: '封面图描述（有封面时必填）', widget: 'string', ...opt },
    { name: 'pinned', label: '置顶到首页', widget: 'boolean', default: false },
    { name: 'draft', label: '暂时下线（线上隐藏）', widget: 'boolean', default: false },
    { name: 'body', label: '正文', widget: 'richtext' },
  ];
}

function contentCollections(): Collection[] {
  const posts = (name: string, label: string, extension: 'md' | 'mdx'): Collection => ({
    name, label, folder: 'src/content/posts', extension, format: 'yaml-frontmatter', create: true,
    slug: '{{fields.slug}}', identifier_field: 'title', ...imagesNextToEntry,
    sortable_fields: { fields: ['date', 'title'], default: { field: 'date', direction: 'descending' } },
    fields: postFields(),
  });
  return [
    posts('posts', '长文', 'md'),
    posts('posts_mdx', '长文（带组件 · MDX）', 'mdx'),
    {
      name: 'notes', label: '碎碎念', folder: 'src/content/notes', extension: 'md', format: 'yaml-frontmatter', create: true,
      slug: STAMP, identifier_field: 'body', summary: '{{body | truncate(40)}}',
      sortable_fields: { fields: ['date'], default: { field: 'date', direction: 'descending' } },
      fields: [
        { name: 'date', label: '时间（北京时间）', widget: 'datetime', input_timezone: 'Asia/Shanghai', default: '{{now}}' },
        category(),
        { name: 'body', label: '内容（最多 280 字）', widget: 'text', maxlength: 280 },
      ],
    },
    {
      name: 'logs', label: '训练日志', folder: 'src/content/logs', extension: 'md', format: 'yaml-frontmatter', create: true,
      slug: STAMP, identifier_field: 'title',
      sortable_fields: { fields: ['date'], default: { field: 'date', direction: 'descending' } },
      fields: [
        { name: 'title', label: '标题', widget: 'string' },
        { name: 'date', label: '日期', widget: 'datetime', type: 'date', default: '{{now}}' },
        { name: 'kind', label: '类型', widget: 'select', options: [...LOG_KINDS] },
        {
          name: 'items', label: '动作和结果', widget: 'list',
          field: { name: 'item', label: '一行：动作 | 结果', widget: 'string', pattern: ['^[^|]*[^|\\s][^|]* \\| [^|]+$', '格式：动作 | 结果，例如「1km 跑 ×4 | 4:58」'] },
        },
        { name: 'body', label: '一句话感受', widget: 'string', ...opt },
      ],
    },
    {
      name: 'xhs', label: '小红书笔记卡片', folder: 'src/content/xhs', extension: 'md', format: 'yaml-frontmatter', create: true,
      slug: STAMP, identifier_field: 'title', ...imagesNextToEntry,
      fields: [
        { name: 'title', label: '标题', widget: 'string' },
        { name: 'date', label: '发布日期', widget: 'datetime', type: 'date' },
        { name: 'url', label: '小红书笔记链接', widget: 'string', pattern: ['^https://(www\\.)?xiaohongshu\\.com/', '必须是 xiaohongshu.com 的链接'] },
        { name: 'cover', label: '封面（3:4 竖图）', widget: 'image', ...opt },
        { name: 'coverAlt', label: '封面描述（有封面时必填）', widget: 'string', ...opt },
      ],
    },
  ];
}

function settingsCollection(): Collection {
  const link = (name: string, label: string): Field => ({
    name, label, widget: 'object',
    fields: [{ name: 'label', label: '显示文字', widget: 'string' }, { name: 'url', label: '链接（留空则不显示）', widget: 'string', ...opt }],
  });
  return {
    name: 'settings', label: '站点设置',
    files: [{
      name: 'site', label: '站点信息', file: 'src/data/site.yaml',
      fields: [
        { name: 'name', label: '名字', widget: 'string' },
        { name: 'tagline', label: '一句话身份', widget: 'string' },
        { name: 'taglineWavy', label: '波浪线强调的那句', widget: 'string', ...opt },
        { name: 'bio', label: '简介', widget: 'text' },
        { name: 'avatar', label: '头像', widget: 'image', ...opt },
        { name: 'photoCaption', label: '拍立得图注', widget: 'string', ...opt },
        { name: 'identity', label: '身份标签', widget: 'list', ...opt },
        {
          name: 'now', label: '现在在忙', widget: 'list',
          fields: [{ name: 'label', label: '项目', widget: 'string' }, { name: 'value', label: '内容', widget: 'string' }],
        },
        { name: 'topics', label: '常写的话题', widget: 'list', ...opt },
        { name: 'social', label: '社交链接', widget: 'object', fields: [link('xiaohongshu', '小红书'), link('github', 'GitHub'), link('email', '邮箱')] },
        { name: 'about', label: '关于页正文（空一行分段）', widget: 'text', ...opt },
      ],
    }],
  };
}

export function buildCmsConfig(target: CmsTarget, options: { siteUrl?: string } = {}): CmsConfig {
  const what = target === 'site' ? '' : '（草稿）';
  return {
    load_config_file: false,
    app_title: target === 'site' ? 'Moose 写作后台' : 'Moose 草稿箱',
    backend: {
      name: 'github', repo: REPOS[target], branch: 'main', auth_methods: ['token'],
      commit_messages: {
        create: `content: 新建 {{collection}}/{{slug}}${what}`,
        update: `content: 更新 {{collection}}/{{slug}}${what}`,
        delete: `content: 删除 {{collection}}/{{slug}}${what}`,
        uploadMedia: `media: 上传 {{path}}${what}`,
        deleteMedia: `media: 删除 {{path}}${what}`,
      },
    },
    publish_mode: 'simple',
    ...(options.siteUrl ? { site_url: options.siteUrl } : {}),
    // Global media (site.yaml avatar) lives in public/ and is referenced by absolute path, as BaseLayout expects.
    media_folder: 'public/images',
    public_folder: '/images',
    slug: { encoding: 'ascii', clean_accents: true },
    // Empty optional fields are omitted: Zod's `cover: image().optional()` rejects an empty string.
    output: { omit_empty_optional_fields: true },
    collections: target === 'site' ? [...contentCollections(), settingsCollection()] : contentCollections(),
  };
}
