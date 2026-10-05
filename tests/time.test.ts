import { describe, it, expect } from 'vitest';
import { zonedYMD, formatShort, formatLong } from '../src/lib/time';

describe('time (Asia/Shanghai)', () => {
  it('uses the Shanghai calendar date across the UTC day boundary', () => {
    // 2026-10-01 06:00 in Shanghai is still 2026-09-30 in UTC
    const d = new Date('2026-10-01T06:00:00+08:00');
    expect(zonedYMD(d)).toEqual({ y: 2026, m: 10, d: 1 });
    expect(formatShort(d)).toBe('10.01');
  });
  it('date-only frontmatter (UTC midnight) stays on the same day', () => {
    expect(formatLong(new Date('2026-09-28'))).toBe('2026.09.28');
  });
  it('late evening in Shanghai does not roll into the next day', () => {
    expect(formatLong(new Date('2026-12-31T23:59:00+08:00'))).toBe('2026.12.31');
  });
});
