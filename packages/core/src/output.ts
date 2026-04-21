import fs from 'node:fs';
import path from 'node:path';

import { CONFIG_DEFAULTS, type ScrapbookConfig, type SnapshotResult } from './config';

const _createdDirs = new Set<string>();

/**
 * Default output handler: writes a PNG screenshot and a JSON metadata file
 * side-by-side in the configured output directory.
 */
export async function defaultOutputHandler(result: SnapshotResult): Promise<void> {
  const { screenshot, metadata, filePaths } = result;
  if (!_createdDirs.has(filePaths.outputDir)) {
    fs.mkdirSync(filePaths.outputDir, { recursive: true });
    _createdDirs.add(filePaths.outputDir);
  }

  fs.writeFileSync(filePaths.imageFile, screenshot);
  fs.writeFileSync(filePaths.metaFile, JSON.stringify(metadata, null, 2));
}

export function buildFilePaths(
  displayName: string,
  outputDir: string,
): SnapshotResult['filePaths'] {
  const safeName = displayName.replace(/[^a-zA-Z0-9_-]/g, '_');
  return {
    outputDir,
    imageFile: path.join(outputDir, `${safeName}.png`),
    metaFile: path.join(outputDir, `${safeName}.json`),
  };
}

export function getOutputDir(config: ScrapbookConfig): string {
  return (
    config.outputDir ??
    process.env['SCRAPBOOK_OUTPUT_DIR'] ??
    CONFIG_DEFAULTS.outputDir!
  );
}
