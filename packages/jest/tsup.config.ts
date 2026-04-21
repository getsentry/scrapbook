import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/setup.ts',
    'src/framework.ts',
    'src/preset.ts',
  ],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    '@sentry/scrapbook',
  ],
});
