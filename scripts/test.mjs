import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
await mkdir('tmp/tests', { recursive: true });
await build({
  entryPoints: ['tests/engine.test.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'tmp/tests/engine.test.mjs',
});
const result = spawnSync(process.execPath, ['--test', 'tmp/tests/engine.test.mjs'], {
  stdio: 'inherit',
});
process.exitCode = result.status ?? 1;
