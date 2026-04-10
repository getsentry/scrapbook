import type { ReactElement } from 'react';

import { closeBrowser, getBrowserContext } from './browser';
import type { ResolvedConfig, SnapshotResult } from './config';
import { buildDocument } from './document';
import { buildFilePaths, defaultOutputHandler } from './output';
import { staticRenderer } from './renderers/static';

export interface SnapshotImageMetadata {
  display_name: string;
  group?: string | null;
}

/**
 * Captures a visual snapshot of a React element.
 * Orchestrates: wrapper → renderer → document assembly → browser → screenshot → output.
 */
export async function captureSnapshot(
  element: ReactElement,
  displayName: string,
  config: ResolvedConfig,
  metadata: Record<string, string> = {},
  extras: Record<string, unknown> = {}
): Promise<SnapshotResult> {
  const wrappedElement = config.wrapper ? config.wrapper(element, extras) : element;
  const renderer = config.renderer ?? staticRenderer;

  const { html, styleTags } = await renderer.render(wrappedElement);

  const doc = buildDocument({
    headCSS: config.headCSS,
    styleTags,
    globalCSS: config.globalCSS,
    body: config.wrapBody(html),
  });

  const browserCtx = await getBrowserContext(config.browserArgs, config.deviceScaleFactor);
  const page = await browserCtx.newPage();

  try {
    await page.setContent(doc, { waitUntil: 'networkidle' });

    const bodySize = await page.evaluate(() => ({
      width: document.body.scrollWidth,
      height: document.body.scrollHeight,
    }));

    await page.setViewportSize(bodySize);

    const screenshot = await page.screenshot({ fullPage: true, omitBackground: true });

    const snapshotMetadata: SnapshotResult['metadata'] = {
      display_name: displayName,
      ...config.defaultMetadata,
      ...metadata,
    };

    const filePaths = buildFilePaths(displayName, config.outputDir);

    const result: SnapshotResult = {
      screenshot,
      metadata: snapshotMetadata,
      filePaths,
    };

    const outputHandler = config.outputHandler ?? defaultOutputHandler;
    await outputHandler(result);

    return result;
  } finally {
    await page.close();
  }
}

export { closeBrowser, buildDocument };
