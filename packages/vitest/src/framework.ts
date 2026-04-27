import type { ReactElement } from 'react';
import { afterAll, it as vitestIt, test as vitestTest } from 'vitest';

import { captureSnapshot, closeBrowser, resolveConfig } from '@sentry/scrapbook';
import type { SnapshotOptions } from '@sentry/scrapbook';

type RenderFn = () => ReactElement;

type SnapshotTestFn = (name: string, renderFn: RenderFn, options?: SnapshotOptions) => void;

type SnapshotEachFn = <T>(
  table: T[]
) => (
  name: string,
  renderFn: (value: T) => ReactElement,
  optionsFn?: (value: T) => SnapshotOptions
) => void;

// vitest's `TestAPI` is a type alias (not an interface), so it can't be augmented
// directly. Augment `ExtendedAPI` from `@vitest/runner` instead — it's part of
// vitest's `TestAPI` intersection, so adding `snapshot` here flows through to
// `it.snapshot` and `test.snapshot`.
declare module '@vitest/runner' {
  interface ExtendedAPI<ExtraContext> {
    snapshot: SnapshotTestFn & { each: SnapshotEachFn };
  }
}

/**
 * Parses the test name to extract snapshot display name and group.
 * Uses the " snapshot: " marker convention.
 *
 * e.g. "MyComponent snapshot: variant name" -> { group: "MyComponent", name: "variant name" }
 */
function parseSnapshotName(testName: string): { group: string | null; displayName: string } {
  const MARKER = ' snapshot: ';
  const idx = testName.indexOf(MARKER);
  if (idx === -1) {
    return { group: null, displayName: testName };
  }
  return {
    group: testName.slice(0, idx),
    displayName: testName.slice(idx + MARKER.length),
  };
}

function registerSnapshot(name: string, renderFn: RenderFn, options: SnapshotOptions = {}): void {
  const config = resolveConfig();

  vitestTest(name, async () => {
    const { group, displayName } = parseSnapshotName(name);

    const metadata = {
      ...(group ? { group } : {}),
      ...options.metadata,
    };

    await captureSnapshot(renderFn(), displayName, config, metadata);
  });
}

const snapshotFn: SnapshotTestFn = (name, renderFn, options) => {
  registerSnapshot(name, renderFn, options);
};

const snapshotEachFn: SnapshotEachFn =
  <T>(table: T[]) =>
  (name: string, renderFn: (value: T) => ReactElement, optionsFn?: (value: T) => SnapshotOptions) => {
    for (const value of table) {
      const testName = typeof value === 'string' ? `${name} ${value}` : name;
      registerSnapshot(testName, () => renderFn(value), optionsFn?.(value));
    }
  };

const snapshotApi = Object.assign(snapshotFn, { each: snapshotEachFn });

(vitestIt as unknown as Record<string, unknown>)['snapshot'] = snapshotApi;
(vitestTest as unknown as Record<string, unknown>)['snapshot'] = snapshotApi;

afterAll(async () => {
  await closeBrowser();
});
