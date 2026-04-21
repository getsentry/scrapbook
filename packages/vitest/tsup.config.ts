import { copyFileSync, mkdirSync } from 'node:fs';
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/setup.ts',
    'src/framework.ts',
  ],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'vitest',
    '@sentry/scrapbook',
  ],
  async onSuccess() {
    mkdirSync('dist', { recursive: true });
    copyFileSync('src/framework-augment.d.ts', 'dist/framework-augment.d.ts');
  },
});
