import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { postSchema, noteSchema, logSchema, xhsSchema } from './content/schemas';

// E2E builds point this at tests/fixtures/content; production uses src/content.
const ROOT = process.env.MOOSE_CONTENT_ROOT ?? './src/content';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: `${ROOT}/posts` }),
  schema: ({ image }) => postSchema(image),
});
const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: `${ROOT}/notes` }),
  schema: noteSchema,
});
const logs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: `${ROOT}/logs` }),
  schema: logSchema,
});
const xhs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: `${ROOT}/xhs` }),
  schema: ({ image }) => xhsSchema(image),
});

export const collections = { posts, notes, logs, xhs };
