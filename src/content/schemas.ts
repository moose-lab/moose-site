import { z } from 'astro/zod';
import { CATEGORY_NAMES } from '../lib/categories';

// Astro passes its `image()` helper in; tests pass a stub.
// Generic so the cover field keeps Astro's ImageMetadata type.

const category = z.enum(CATEGORY_NAMES);
const draft = z.boolean().default(false);
const coverAltRule = {
  message: 'coverAlt is required when cover is set',
  path: ['coverAlt'],
};

export const LOG_KINDS = ['CrossFit', 'HYROX', '跑步', '力量', '其他'] as const;

export const postSchema = <T extends z.ZodType>(image: () => T) =>
  z
    .object({
      title: z.string().min(1),
      titleHighlight: z.string().optional(),
      description: z.string().min(1).max(120),
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      category,
      tags: z.array(z.string()).default([]),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      pinned: z.boolean().default(false),
      draft,
    })
    .refine((d) => !d.cover || !!d.coverAlt?.trim(), coverAltRule);

export const noteSchema = z.object({
  date: z.coerce.date(),
  category,
  draft,
});

export const logSchema = z.object({
  title: z.string().min(1),
  date: z.coerce.date(),
  kind: z.enum(LOG_KINDS),
  items: z.array(z.string().min(1)).min(1),
  draft,
});

export const xhsSchema = <T extends z.ZodType>(image: () => T) =>
  z
    .object({
      title: z.string().min(1),
      date: z.coerce.date(),
      url: z.url(),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      draft,
    })
    .refine((d) => !d.cover || !!d.coverAlt?.trim(), coverAltRule);
