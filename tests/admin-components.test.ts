import { describe, it, expect } from 'vitest';
import { components } from '../src/admin/cms-components.mjs';

type C = { id: string; pattern: RegExp; fromBlock: (m: RegExpMatchArray) => Record<string, unknown>; toBlock: (d: Record<string, unknown>) => string; toPreview: (d: Record<string, unknown>) => string };
const byId = (id: string) => (components as C[]).find((c) => c.id === id)!;
const roundTrip = (c: C, block: string) => {
  const m = block.match(c.pattern);
  expect(m, `pattern must match: ${block}`).not.toBeNull();
  return c.toBlock(c.fromBlock(m!));
};

describe('MDX editor components', () => {
  it('registers exactly the components that can live in a CMS-edited post', () => {
    expect((components as C[]).map((c) => c.id)).toEqual(['aside', 'pullquote', 'logcard']);
  });

  it.each([
    ['aside', '<Aside>二次元那栏大概会写得最勤</Aside>'],
    ['pullquote', '<PullQuote>跑步段不是休息，是下一站的准备。</PullQuote>'],
    ['logcard', '<LogCard title="HYROX 模拟日" items={["1km 跑 ×4 | 4:58","雪橇推 / 拉 | 152 kg"]} />'],
  ])('%s: what the site already uses survives parse → serialise unchanged', (id, block) => {
    expect(roundTrip(byId(id), block)).toBe(block);
  });

  it('logcard keeps quotes and pipes inside values intact', () => {
    const c = byId('logcard');
    const data = { title: '他说"再来一组"', items: ['波比跳 | 50 次 "不停"', '划船 | 2000 m'] };
    const block = c.toBlock(data);
    expect(c.fromBlock(block.match(c.pattern)!)).toEqual(data);
  });

  it('aside/pullquote serialise data back into the same pattern', () => {
    for (const id of ['aside', 'pullquote']) {
      const c = byId(id);
      const block = c.toBlock({ text: '一句话' });
      expect(c.fromBlock(block.match(c.pattern)!)).toEqual({ text: '一句话' });
    }
  });

  it('previews escape HTML so a note cannot inject markup into the editor', () => {
    const html = byId('aside').toPreview({ text: '<img src=x onerror=alert(1)>' });
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
    expect(byId('logcard').toPreview({ title: '<b>', items: ['<i> | x'] })).not.toMatch(/<b>|<i>/);
  });
});
