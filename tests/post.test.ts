import { describe, it, expect } from 'vitest';
import { neighbors, splitHighlight, blogPostingJsonLd } from '../src/lib/post';

describe('neighbors (list is newest-first)', () => {
  const list = [{ id: 'c' }, { id: 'b' }, { id: 'a' }]; // c newest … a oldest
  it('prev is the older post, next is the newer post', () => {
    expect(neighbors(list, 'b')).toEqual({ prev: { id: 'a' }, next: { id: 'c' } });
  });
  it('newest has no next, oldest has no prev', () => {
    expect(neighbors(list, 'c').next).toBeNull();
    expect(neighbors(list, 'a').prev).toBeNull();
  });
  it('unknown id gives no neighbours', () => {
    expect(neighbors(list, 'zzz')).toEqual({ prev: null, next: null });
  });
});

describe('splitHighlight', () => {
  it('splits around the first occurrence', () => {
    expect(splitHighlight('HYROX 八站：配速该怎么分？', '配速')).toEqual(['HYROX 八站：', '配速', '该怎么分？']);
  });
  it('returns null when there is nothing to highlight', () => {
    expect(splitHighlight('标题', undefined)).toBeNull();
    expect(splitHighlight('标题', '不存在')).toBeNull();
    expect(splitHighlight('标题', '')).toBeNull();
  });
});

describe('blogPostingJsonLd', () => {
  it('builds a BlogPosting with absolute URLs', () => {
    const ld = blogPostingJsonLd({
      title: 't', description: 'd', date: new Date('2026-09-28'), updated: undefined,
      url: new URL('https://moose.example/posts/x/'), image: new URL('https://moose.example/og.png'), author: 'Moose',
    });
    expect(ld['@type']).toBe('BlogPosting');
    expect(ld.headline).toBe('t');
    expect(ld.datePublished).toBe('2026-09-28T00:00:00.000Z');
    expect(ld.dateModified).toBe('2026-09-28T00:00:00.000Z');
    expect(ld.mainEntityOfPage).toBe('https://moose.example/posts/x/');
    expect(ld.image).toBe('https://moose.example/og.png');
    expect(ld.author).toEqual({ '@type': 'Person', name: 'Moose' });
  });
});

describe('serializeJsonLd', () => {
  it('escapes < so content can never close the <script> element', async () => {
    const { serializeJsonLd } = await import('../src/lib/post');
    const out = serializeJsonLd({ headline: '</script><script>alert(1)</script>' });
    expect(out).not.toContain('<');
    expect(JSON.parse(out).headline).toBe('</script><script>alert(1)</script>');
  });
});
