import type { ReactElement } from 'react';

import { discardPage, getPage } from './browser';
import type { ScrapbookConfig, SnapshotResult } from './config';
import { buildDocument } from './document';
import { buildFilePaths, defaultOutputHandler, getOutputDir } from './output';

export interface SnapshotImageMetadata {
  display_name: string;
  group?: string | null;
}

/**
 * Captures a PNG snapshot of a React element.
 * Orchestrates: renderer → document assembly → browser → screenshot → output.
 */
export async function captureSnapshot(
  element: ReactElement,
  displayName: string,
  config: ScrapbookConfig,
  metadata: Record<string, string> = {},
): Promise<SnapshotResult> {
  const { html, styleTags } = await config.renderer.render(element);

  const doc = buildDocument({
    headCSS: config.headCSS,
    styleTags,
    globalCSS: config.globalCSS,
    body: html,
  });

  const page = await getPage();

  let screenshot: Buffer;
  try {
    await page.setContent(doc, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    screenshot = await page.locator('#scrapbook-root').screenshot({ omitBackground: true });
  } catch (err) {
    discardPage();
    throw err;
  }

  const snapshotMetadata: SnapshotResult['metadata'] = {
    display_name: displayName,
    ...metadata,
  };

  const filePaths = buildFilePaths(displayName, getOutputDir(config));

  const result: SnapshotResult = {
    screenshot,
    metadata: snapshotMetadata,
    filePaths,
  };

  await defaultOutputHandler(result);

  return result;
}
