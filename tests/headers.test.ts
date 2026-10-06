import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

/** Parses Cloudflare's public/_headers into { pattern: { header: value } }. */
function parseHeaders(text: string): Record<string, Record<string, string>> {
  const rules: Record<string, Record<string, string>> = {};
  let current = '';
  for (const line of text.split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) { current = line.trim(); rules[current] = {}; continue; }
    const i = line.indexOf(':');
    rules[current][line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim();
  }
  return rules;
}
const rules = parseHeaders(readFileSync('public/_headers', 'utf8'));
const directives = (csp: string) => Object.fromEntries(csp.split(';').map((d) => d.trim()).filter(Boolean).map((d) => [d.split(/\s+/)[0], d.split(/\s+/).slice(1)]));

describe('_headers', () => {
  it('keeps the site-wide rule free of admin-only origins', () => {
    expect(JSON.stringify(rules['/*'])).not.toMatch(/unpkg|githubusercontent|api\.github\.com/);
  });

  it('gives /admin/* its own CSP with exactly what Sveltia needs, and keeps it out of search engines', () => {
    const admin = rules['/admin/*'];
    expect(admin['x-robots-tag']).toBe('noindex, nofollow');
    const d = directives(admin['content-security-policy']);
    expect(d['script-src']).toEqual(["'self'", 'https://unpkg.com']);
    expect(d['script-src']).not.toContain("'unsafe-inline'");
    expect(d['script-src']).not.toContain("'unsafe-eval'");
    expect(d['connect-src']).toEqual(expect.arrayContaining(["'self'", 'https://unpkg.com', 'https://api.github.com', 'https://www.githubstatus.com']));
    expect(d['img-src']).toEqual(expect.arrayContaining(["'self'", 'blob:', 'data:', 'https://*.githubusercontent.com']));
    expect(d['object-src']).toEqual(["'none'"]);
    // Sveltia 0.228 loads its UI and icon fonts (Material Symbols) from jsDelivr; without this the admin has no icons.
    expect(d['font-src']).toEqual(["'self'", 'https://cdn.jsdelivr.net']);
    expect(d['frame-ancestors']).toEqual(["'none'"]);
  });
});
