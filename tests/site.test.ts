import { describe, it, expect } from 'vitest';
import { site, siteSchema, pickSocialLinks } from '../src/lib/site';

const valid = {
  name: 'Moose', tagline: 't', bio: 'b',
  social: { xiaohongshu: { label: '小红书', url: '' }, github: { label: 'GitHub', url: 'https://github.com/moose-lab' }, email: { label: '邮箱', url: '  ' } },
};

describe('site data', () => {
  it('the committed site.yaml is valid', () => {
    expect(site.name).toBe('Moose');
    expect(site.now.length).toBeGreaterThan(0);
  });
  it('rejects an empty name', () => {
    expect(siteSchema.safeParse({ ...valid, name: '' }).success).toBe(false);
  });
  it('applies defaults for optional lists', () => {
    const s = siteSchema.parse(valid);
    expect(s.now).toEqual([]);
    expect(s.topics).toEqual([]);
  });
  it('only links with a non-blank url are rendered', () => {
    expect(pickSocialLinks(siteSchema.parse(valid)).map((l) => l.label)).toEqual(['GitHub']);
  });
});

describe('placeholders and optional hero fields', () => {
  it('isFilled rejects empty and [bracket] placeholders', async () => {
    const { isFilled } = await import('../src/lib/site');
    expect(isFilled('')).toBe(false);
    expect(isFilled('  ')).toBe(false);
    expect(isFilled('[产品名]')).toBe(false);
    expect(isFilled('HYROX 备赛')).toBe(true);
    expect(isFilled('备赛 [一部分]')).toBe(true);
  });
  it('identity chips and photo caption default to empty', () => {
    const s = siteSchema.parse(valid);
    expect(s.identity).toEqual([]);
    expect(s.photoCaption).toBe('');
  });
});

describe('about text', () => {
  it('defaults to empty so the about page can hide it until filled', () => {
    expect(siteSchema.parse(valid).about).toBe('');
  });
});
