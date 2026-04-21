import type { ReactElement } from 'react';
import type { SnapshotOptions } from '@sentry/scrapbook';

/**
 * Type augmentation for Vitest's it/test globals.
 * Adds the `it.snapshot` and `test.snapshot` APIs to Vitest's TestAPI interface.
 *
 * Preferred: add the package to compilerOptions.types in your tsconfig.json —
 * this applies to all test files automatically, the same way vitest/globals works:
 *
 *   "compilerOptions": {
 *     "types": ["vitest/globals", "@sentry/scrapbook-vitest"]
 *   }
 *
 * Alternative: add a triple-slash reference in a setup .ts file that is
 * included in your TypeScript compilation:
 *   /// <reference types="@sentry/scrapbook-vitest/framework-augment" />
 */

type RenderFn = () => ReactElement;
type SnapshotTestFn = (name: string, renderFn: RenderFn, options?: SnapshotOptions) => void;
type SnapshotEachFn = <T>(
  table: T[]
) => (
  name: string,
  renderFn: (value: T) => ReactElement,
  optionsFn?: (value: T) => SnapshotOptions
) => void;

declare module 'vitest' {
  interface TestAPI {
    snapshot: SnapshotTestFn & { each: SnapshotEachFn };
  }
}
