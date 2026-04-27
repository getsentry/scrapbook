# @sentry/scrapbook

> [!WARNING]
> Scrapbook is an experimental library and long-term support is not guaranteed.
> Use at your own risk.

Visual snapshot testing for React components. Renders via SSR, screenshots with Playwright.

## Packages

| Package | Description |
|---|---|
| `@sentry/scrapbook` | Core: rendering, browser lifecycle, config, output |
| `@sentry/scrapbook-jest` | Jest integration — preset, setup, `it.snapshot` API |
| `@sentry/scrapbook-vitest` | Vitest integration — setup, `it.snapshot` API |

## Installation

Install the core package and whichever framework integration you need:

```sh
# Jest
npm add -D @sentry/scrapbook @sentry/scrapbook-jest

# Vitest
npm add -D @sentry/scrapbook @sentry/scrapbook-vitest

# Both
npm add -D @sentry/scrapbook @sentry/scrapbook-jest @sentry/scrapbook-vitest
```

Playwright is a peer dependency, install it if you haven't already:

```sh
npm add -D playwright
npm exec playwright install chromium
```

## Configuration

Create `scrapbook.config.ts` in your project root:

```ts
import { staticRenderer } from '@sentry/scrapbook';
import type { ScrapbookConfig } from '@sentry/scrapbook';

const config: ScrapbookConfig = {
  renderer: staticRenderer,
  headCSS: '/* your compiled CSS here */',
};

export default config;
```

For Emotion projects:

```ts
import { createEmotionRenderer } from '@sentry/scrapbook/emotion';

export default {
  renderer: createEmotionRenderer({ cacheKey: 'scrapbook' }),
  headCSS: fontFaceCSS,
};
```

### Renderers

Scrapbook requires a renderer. A renderer is an object responsible for turning a React element into an HTML string.

#### Static renderer

For Tailwind, CSS modules, vanilla CSS, or any setup where styles come from `headCSS` config. No extra dependencies.

```ts
import { staticRenderer } from '@sentry/scrapbook';
```

#### Emotion renderer

For Emotion CSS-in-JS. Extracts critical styles during SSR and injects them into `<head>`.

```ts
import { createEmotionRenderer } from '@sentry/scrapbook/emotion';
```

Requires `@emotion/cache`, `@emotion/react`, and `@emotion/server` as peer dependencies. React 19 requires `>=11.13.0` of each; React 18 works with `>=11.11.0`.

#### Custom renderer

Implement the `Renderer` interface to support any other styling approach:

```ts
import type { Renderer } from '@sentry/scrapbook';

const myRenderer: Renderer = {
  render(element) {
    const html = renderToString(element);
    return { html };
  },
};
```

## Writing snapshot tests

Test files must match `**/*.snapshots.tsx`.

```tsx
// button.snapshots.tsx
import { Button } from './button';

describe('Button', () => {
  it.snapshot('default', () => <Button>Click</Button>);

  it.snapshot.each(['primary', 'danger'])('variant', variant => (
    <Button variant={variant}>{variant}</Button>
  ));
});
```

Pass `metadata` to add fields to the output sidecar JSON:

```tsx
it.snapshot('dark', () => <Button>Click</Button>, {
  metadata: { theme: 'dark' },
});

it.snapshot.each(['light', 'dark'])('theme', theme => <Button>Click</Button>, theme => ({
  metadata: { theme },
}));
```

The `" snapshot: "` marker in the test name populates `group` and `display_name` in the output metadata. Pass the full name directly:

```tsx
it.snapshot('Button snapshot: default', () => <Button>Click</Button>);
// → { group: "Button", display_name: "default" }
```

## Jest setup

```ts
// jest.config.snapshots.ts
import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: '@sentry/scrapbook-jest',
  // add your own transform, moduleNameMapper, etc.
};

export default config;
```

Run with:

```sh
jest --config jest.config.snapshots.ts
```

The preset sets `testEnvironment: 'node'`, `testMatch: ['**/*.snapshots.tsx']`, and wires up the SSR shims and `it.snapshot` API automatically.

If you need to configure the setup files manually instead of using the preset:

```ts
// jest.config.snapshots.ts
export default {
  testEnvironment: 'node',
  testMatch: ['**/*.snapshots.tsx'],
  setupFiles: ['@sentry/scrapbook-jest/setup'],
  setupFilesAfterEnv: ['@sentry/scrapbook-jest/framework'],
};
```

## Vitest setup

```ts
// vitest.config.snapshots.mts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.snapshots.tsx'],
    environment: 'node',
    setupFiles: [
      '@sentry/scrapbook-vitest/setup',
      '@sentry/scrapbook-vitest/framework',
    ],
  },
});
```

Run with:

```sh
vitest --config vitest.config.snapshots.mts
```

### TypeScript types for Vitest

Add the package to `compilerOptions.types` in your `tsconfig.json`. This applies the `it.snapshot` types to all test files automatically — the same pattern as `vitest/globals`:

```json
{
  "compilerOptions": {
    "types": ["vitest/globals", "@sentry/scrapbook-vitest"]
  }
}
```

Alternatively, add a triple-slash reference in any `.ts` file that is part of your TypeScript compilation:

```ts
/// <reference types="@sentry/scrapbook-vitest/framework" />
```

## Output

Snapshots are written to `.artifacts/scrapbook/` by default. Each snapshot produces a `.png` and a `.json` sidecar with its metadata.

Override the output directory with an env var:

```sh
SCRAPBOOK_OUTPUT_DIR=/tmp/snaps jest --config jest.config.snapshots.ts
```

Or set it in config:

```ts
export default {
  renderer: staticRenderer,
  outputDir: 'test-artifacts/snapshots',
};
```

## Local development

This repo is a pnpm workspace. To work on the packages locally:

```sh
pnpm install
pnpm build        # builds core first, then jest and vitest adapters
pnpm typecheck    # type-checks all packages
```

To use a local build in another project, reference the packages via `file:` in that project's `package.json`:

```json
"devDependencies": {
  "@sentry/scrapbook": "file:../path/to/scrapbook/packages/core",
  "@sentry/scrapbook-jest": "file:../path/to/scrapbook/packages/jest"
}
```

## Releasing

Releases are cut with [`craft`](https://github.com/getsentry/craft) via the **Prepare Release** GitHub Action. All three packages (`@sentry/scrapbook`, `@sentry/scrapbook-jest`, `@sentry/scrapbook-vitest`) are versioned and published together.

To cut a release:

1. Go to the [Prepare Release workflow](../../actions/workflows/release.yml) and click **Run workflow**.
2. Enter the version. Either an explicit version (`0.2.0`) or a bump type (`major`, `minor`, `patch`).
3. Run the workflow. Craft opens a `release/X.Y.Z` PR that bumps `package.json` versions and updates the changelog.
4. Review and merge the PR. Craft then publishes the three packages to npm (public access) and creates a GitHub release tagged `vX.Y.Z`.

Targets and changelog policy live in `.craft.yml`. The changelog is generated automatically from commit messages, so write clear, scoped commit subjects.
