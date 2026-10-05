// Builds with deliberately invalid content and passes only if the build fails
// with Astro's schema error. Guards spec §9: "schema 不合法时构建失败".
import { spawnSync } from 'node:child_process';

const res = spawnSync('pnpm', ['exec', 'astro', 'build', '--outDir', '.schema-guard-dist'], {
  env: { ...process.env, MOOSE_CONTENT_ROOT: './tests/fixtures/invalid' },
  encoding: 'utf8',
});
const out = `${res.stdout}\n${res.stderr}`;

if (res.status === 0) {
  console.error('✗ schema guard: build SUCCEEDED with invalid content — schemas are not enforced');
  process.exit(1);
}
if (!out.includes('InvalidContentEntryDataError')) {
  console.error('✗ schema guard: build failed, but not because of the content schema:\n' + out.slice(-2000));
  process.exit(1);
}
console.log('✓ schema guard: invalid content fails the build as expected');
