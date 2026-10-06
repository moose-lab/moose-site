import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

type Step = { name?: string; if?: string; run?: string; uses?: string; with?: Record<string, string> };
const wf = parse(readFileSync('ops/drafts-repo/.github/workflows/publish.yml', 'utf8'));
const steps: Step[] = wf.jobs.publish.steps;

describe('moose-drafts publish workflow', () => {
  it('refuses to run unless moose-drafts is private (drafts must never be public)', () => {
    expect(steps[0].if).toMatch(/github\.event\.repository\.private\s*!=\s*true/);
    expect(steps[0].run).toMatch(/exit 1/);
  });

  it('never interpolates the user-supplied path into a shell script (injection-safe)', () => {
    expect(wf.jobs.publish.env.DRAFT_PATH).toBe('${{ inputs.path }}');
    for (const s of steps) expect(s.run ?? '').not.toContain('${{');
  });

  it('pushes the site with the MOOSE_SITE_TOKEN secret and validates before publishing', () => {
    const site = steps.find((s) => s.with?.repository === 'moose-lab/moose-site')!;
    expect(site.with!.token).toBe('${{ secrets.MOOSE_SITE_TOKEN }}');
    const names = steps.map((s) => s.name ?? s.uses ?? '');
    const validate = names.findIndex((n) => /Validate/.test(n));
    const publish = names.findIndex((n) => /Publish to main/.test(n));
    expect(validate).toBeGreaterThan(-1);
    expect(validate).toBeLessThan(publish);
    expect(steps[validate].run).toContain('pnpm check && pnpm test && pnpm build');
  });
});

describe('publish workflow: republishing identical content', () => {
  it('does not fail when the draft equals what is already published (nothing to commit)', () => {
    const publish = steps.find((s) => s.name === 'Publish to main')!;
    expect(publish.run).toMatch(/git diff --cached --quiet/);
  });
});

describe('moose-drafts check workflow', () => {
  const check = parse(readFileSync('ops/drafts-repo/.github/workflows/check.yml', 'utf8'));
  const cs: Step[] = check.jobs.check.steps;

  it('runs on every save of a draft (push to src/content on main) and on demand', () => {
    expect(check.on.push.branches).toEqual(['main']);
    expect(check.on.push.paths).toEqual(['src/content/**']);
    expect(check.on).toHaveProperty('workflow_dispatch');
  });

  it('only reads, and coalesces rapid saves into one run', () => {
    expect(check.permissions).toEqual({ contents: 'read' });
    expect(check.concurrency['cancel-in-progress']).toBe(true);
  });

  it('has the same public-repo guard first', () => {
    expect(cs[0].if).toMatch(/github\.event\.repository\.private\s*!=\s*true/);
  });

  it('validates every draft by building the site with the drafts as its content root', () => {
    const validate = cs.find((s) => /Validate/.test(s.name ?? ''))! as Step & { env?: Record<string, string>; ['working-directory']?: string };
    expect(validate['working-directory']).toBe('site');
    expect(validate.env?.MOOSE_CONTENT_ROOT).toBe('../drafts/src/content');
    expect(validate.run).toContain('pnpm build');
    for (const s of cs) expect(s.run ?? '').not.toContain('${{');
  });
});
