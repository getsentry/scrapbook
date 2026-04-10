import {defineConfig} from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/renderers/emotion.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    'playwright',
    '@emotion/cache',
    '@emotion/react',
    '@emotion/server',
  ],
});
