import type { ReactElement } from 'react';

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

/**
 * Augment Jest's global test/it to add the .snapshot and .snapshot.each APIs.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface It {
      snapshot: SnapshotTestFn & { each: SnapshotEachFn };
    }
  }
}

/**
 * Parses the Jest test name to extract snapshot display name and group.
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

  test(name, async () => {
    const currentTestName = expect.getState().currentTestName ?? name;
    const { group, displayName } = parseSnapshotName(currentTestName);

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

(it as unknown as Record<string, unknown>)['snapshot'] = snapshotApi;
(test as unknown as Record<string, unknown>)['snapshot'] = snapshotApi;

afterAll(async () => {
  await closeBrowser();
});
