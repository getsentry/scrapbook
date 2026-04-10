# @sentry/scrapbook

Visual snapshot testing for React components. Renders via SSR, screenshots with Playwright.

## Local development

Build the package, then link it into your project:

```sh
# in this repo
npm run build
npm link

# in your project
npm link @sentry/scrapbook
```

Or reference it directly in your project's `package.json`:

```json
"devDependencies": {
  "@sentry/scrapbook": "file:../path/to/scrapbook"
}
```

## Configuration

Create `snapshot.config.ts` in your project root:

```ts
import { staticRenderer } from '@sentry/scrapbook';
import type { VisualSnapshotConfig } from '@sentry/scrapbook';

const config: VisualSnapshotConfig = {
  renderer: staticRenderer,
  headCSS: '/* your compiled CSS here */',
};

export default config;
```

For Emotion projects:

```ts
import { createEmotionRenderer } from '@sentry/scrapbook/emotion';

export default {
  renderer: createEmotionRenderer({ cacheKey: 'snap' }),
  headCSS: fontFaceCSS,
} satisfies VisualSnapshotConfig;
```

### Renderers

Scrapbook requires a renderer. A `renderer` is the object responsible for turning a React element into an HTML string. Two are provided out of the box.

### Static renderer

For Tailwind, CSS modules, vanilla CSS, or any setup where styles come from `headCSS` config. No extra dependencies.

```ts
import { staticRenderer } from '@sentry/scrapbook';
```

### Emotion renderer

For Emotion CSS-in-JS. Extracts critical styles during SSR and injects them into the document.

```ts
import { createEmotionRenderer } from '@sentry/scrapbook/emotion';
```

Requires `@emotion/cache`, `@emotion/react`, and `@emotion/server` as peer dependencies.

### Custom renderer

Implement the `Renderer` interface to support any other styling approach:

```ts
import type { Renderer } from '@sentry/scrapbook';

const myRenderer: Renderer = {
  render(element) {
    const html = renderToString(element);
    return { html };               // optionally include styleTags
  },
};
```

### Wrapper

Use `wrapper` to inject React providers (themes, context) around every rendered component. Per-snapshot data is passed via `extras`:

```ts
export default {
  renderer: createEmotionRenderer(),
  wrapper: (element, extras) => (
    <ThemeProvider theme={extras.theme === 'dark' ? darkTheme : lightTheme}>
      {element}
    </ThemeProvider>
  ),
} satisfies VisualSnapshotConfig;
```

## Writing snapshot tests

Test files must match `**/*.snapshots.tsx`.

```tsx
// button.snapshots.tsx
import { Button } from './button';

describe('Button', () => {
  it.snapshot('default', () => <Button>Click</Button>);

  it.snapshot.each(['primary', 'danger'])('variant-%s', variant => (
    <Button variant={variant}>{variant}</Button>
  ));
});
```

Pass `extras` to feed data into your `wrapper`, and `metadata` for the output JSON:

```tsx
it.snapshot('dark', () => <Button>Click</Button>, {
  extras: { theme: 'dark' },
  metadata: { theme: 'dark' },
});

it.snapshot.each(['light', 'dark'])('theme-%s', theme => <Button>Click</Button>, theme => ({
  extras: { theme },
  metadata: { theme },
}));
```

## Jest setup

```ts
// jest.config.snapshots.ts
import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: '@sentry/scrapbook/jest-preset',
  // add your own transform, moduleNameMapper, etc.
};

export default config;
```

Run with:

```sh
jest --config jest.config.snapshots.ts
```

## Vitest setup

The Jest preset doesn't apply to Vitest. Wire it up manually:

```ts
// vitest.config.snapshots.mts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.snapshots.tsx'],
    environment: 'node',
    setupFiles: ['./vitest.setup.snapshots.ts'],
  },
});
```

```ts
// vitest.setup.snapshots.ts
if (typeof globalThis.window === 'undefined') {
  (globalThis as any).window = {
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {}, length: 0, key: () => null },
  };
}
```

Use `captureSnapshot` directly in your tests:

```ts
import { captureSnapshot, resolveConfig, closeBrowser } from '@sentry/scrapbook';
import { afterAll } from 'vitest';

afterAll(() => closeBrowser());

async function snap(name: string, element: ReactElement) {
  await captureSnapshot(element, name, resolveConfig());
}
```

## Output

Snapshots are written to `.artifacts/snapshots/` by default. Override with:

```sh
SNAPSHOT_OUTPUT_DIR=/tmp/snaps jest --config jest.config.snapshots.ts
```
