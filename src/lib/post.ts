/** Older post = prev, newer post = next. `list` must be newest-first (buildFeed order). */
export function neighbors<T extends { id: string }>(list: T[], id: string): { prev: T | null; next: T | null } {
  const i = list.findIndex((p) => p.id === id);
  if (i === -1) return { prev: null, next: null };
  return { prev: list[i + 1] ?? null, next: list[i - 1] ?? null };
}

/** Split a title around the first occurrence of `sub` for the single allowed highlight (rule 2). */
export function splitHighlight(title: string, sub: string | undefined): [string, string, string] | null {
  if (!sub) return null;
  const i = title.indexOf(sub);
  if (i === -1) return null;
  return [title.slice(0, i), sub, title.slice(i + sub.length)];
}

interface PostingInput {
  title: string;
  description: string;
  date: Date;
  updated: Date | undefined;
  url: URL;
  image: URL;
  author: string;
}

export function blogPostingJsonLd(p: PostingInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: p.title,
    description: p.description,
    datePublished: p.date.toISOString(),
    dateModified: (p.updated ?? p.date).toISOString(),
    mainEntityOfPage: p.url.href,
    image: p.image.href,
    author: { '@type': 'Person', name: p.author },
  };
}

/** JSON for an inline <script type="application/ld+json">; `<` is escaped so text can't end the element early. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
