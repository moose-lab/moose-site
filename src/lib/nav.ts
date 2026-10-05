export interface NavItem { label: string; href: string; match: (path: string) => boolean }

const under = (prefix: string) => (path: string) => path.startsWith(prefix);

/** Header navigation. "博客" owns the feed and every content permalink. */
export const NAV: NavItem[] = [
  { label: '博客', href: '/', match: (p) => p === '/' || ['/feed/', '/posts/', '/notes/', '/logs/'].some((x) => p.startsWith(x)) },
  { label: '训练', href: '/category/train/', match: under('/category/train/') },
  { label: 'AI 实验', href: '/category/ai/', match: under('/category/ai/') },
  { label: '做产品', href: '/category/product/', match: under('/category/product/') },
  { label: '关于我', href: '/about/', match: under('/about/') },
];
