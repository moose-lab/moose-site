import { z } from 'astro/zod';
import raw from '../data/site.yaml';

const link = z.object({ label: z.string(), url: z.string() });

export const siteSchema = z.object({
  name: z.string().min(1),
  tagline: z.string(),
  taglineWavy: z.string().default(''),
  bio: z.string(),
  avatar: z.string().default(''),
  now: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
  social: z.object({ xiaohongshu: link, github: link, email: link }),
  topics: z.array(z.string()).default([]),
  identity: z.array(z.string()).default([]),
  photoCaption: z.string().default(''),
  about: z.string().default(''),
});

export type Site = z.infer<typeof siteSchema>;

/** Parsed once at build time; a bad site.yaml fails the build with a readable error. */
export const site: Site = siteSchema.parse(raw);

/** Social links that actually have a URL. */
export function pickSocialLinks(s: Site) {
  return Object.values(s.social).filter((l) => l.url.trim() !== '');
}

export const socialLinks = pickSocialLinks(site);

/** False for empty strings and whole-value placeholders like "[产品名]" — those are hidden in production. */
export function isFilled(value: string): boolean {
  const v = value.trim();
  return v !== '' && !/^\[[^\]]*\]$/.test(v);
}
