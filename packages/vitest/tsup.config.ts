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
    '@vitest/runner',
    '@sentry/scrapbook',
  ],
});
