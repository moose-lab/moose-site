// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { initFeedFilter } from '../src/lib/feed-filter';

beforeEach(() => {
  document.body.innerHTML = `
    <div data-feed-filter>
      <a href="/" data-cat="all" aria-pressed="true">全部</a>
      <a href="/category/ai/" data-cat="ai" aria-pressed="false">AI</a>
      <a href="/category/acg/" data-cat="acg" aria-pressed="false">二次元</a>
    </div>
    <article data-feed-item data-cat="ai">a</article>
    <article data-feed-item data-cat="train">t</article>
    <p data-feed-empty hidden>空</p>`;
  initFeedFilter(document);
});

const btn = (cat: string) => document.querySelector<HTMLAnchorElement>(`[data-cat="${cat}"]`)!;
const cards = () => [...document.querySelectorAll<HTMLElement>('[data-feed-item]')];

describe('initFeedFilter', () => {
  it('filters cards and updates aria-pressed', () => {
    btn('ai').click();
    expect(cards().map((c) => c.hidden)).toEqual([false, true]);
    expect(btn('ai').getAttribute('aria-pressed')).toBe('true');
    expect(btn('all').getAttribute('aria-pressed')).toBe('false');
  });
  it('shows the empty state when nothing matches', () => {
    btn('acg').click();
    expect(document.querySelector<HTMLElement>('[data-feed-empty]')!.hidden).toBe(false);
  });
  it('"all" restores every card', () => {
    btn('ai').click();
    btn('all').click();
    expect(cards().every((c) => !c.hidden)).toBe(true);
  });
  it('gives links button semantics', () => {
    expect(btn('ai').getAttribute('role')).toBe('button');
  });
});

describe('initFeedFilter on server markup without ARIA state', () => {
  it('adds button semantics and marks 全部 as pressed on init', () => {
    document.body.innerHTML = `
      <div data-feed-filter>
        <a href="/" data-cat="all">全部</a>
        <a href="/category/ai/" data-cat="ai">AI</a>
      </div>
      <article data-feed-item data-cat="ai">a</article>
      <p data-feed-empty hidden>空</p>`;
    initFeedFilter(document);
    expect(btn('all').getAttribute('aria-pressed')).toBe('true');
    expect(btn('ai').getAttribute('aria-pressed')).toBe('false');
    expect(btn('ai').getAttribute('role')).toBe('button');
    expect(document.querySelector<HTMLElement>('[data-feed-empty]')!.hidden).toBe(true);
  });
});
