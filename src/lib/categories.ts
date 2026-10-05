export const CATEGORIES = [
  { name: '训练', slug: 'train', token: '--cat-train' },
  { name: 'AI', slug: 'ai', token: '--cat-ai' },
  { name: '产品', slug: 'product', token: '--cat-product' },
  { name: '二次元', slug: 'acg', token: '--cat-acg' },
  { name: '小红书', slug: 'xhs', token: '--cat-xhs' },
] as const;

export type Category = (typeof CATEGORIES)[number];
export type CategoryName = Category['name'];
export type CategorySlug = Category['slug'];

export const CATEGORY_NAMES = CATEGORIES.map((c) => c.name) as [CategoryName, ...CategoryName[]];

export function categoryByName(name: CategoryName): Category {
  const found = CATEGORIES.find((c) => c.name === name);
  if (!found) throw new Error(`Unknown category name: ${name}`);
  return found;
}

export function categoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
