import type { ReactElement } from 'react';

export interface SnapshotOptions {
  metadata?: Record<string, string>;
}

export type RenderFn = () => ReactElement;
