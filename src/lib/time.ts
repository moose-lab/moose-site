/** All dates are shown and grouped in this time zone. */
export const SITE_TZ = 'Asia/Shanghai';

const partsFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: SITE_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Calendar date of `date` in SITE_TZ. month is 1–12. */
export function zonedYMD(date: Date): { y: number; m: number; d: number } {
  const parts = Object.fromEntries(partsFmt.formatToParts(date).map((p) => [p.type, p.value]));
  return { y: Number(parts.year), m: Number(parts.month), d: Number(parts.day) };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Card date, e.g. "09.26". */
export function formatShort(date: Date): string {
  const { m, d } = zonedYMD(date);
  return `${pad(m)}.${pad(d)}`;
}

/** Full date, e.g. "2026.09.28". */
export function formatLong(date: Date): string {
  const { y, m, d } = zonedYMD(date);
  return `${y}.${pad(m)}.${pad(d)}`;
}
