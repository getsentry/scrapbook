import fs from 'node:fs';
import path from 'node:path';

import type {SnapshotResult} from './config';

/**
 * Default output handler: writes a PNG screenshot and a JSON metadata file
 * side-by-side in the configured output directory.
 */
export async function defaultOutputHandler(result: SnapshotResult): Promise<void> {
  const {screenshot, metadata, filePaths} = result;

  fs.mkdirSync(filePaths.outputDir, {recursive: true});

  fs.writeFileSync(filePaths.imageFile, screenshot);
  fs.writeFileSync(filePaths.metaFile, JSON.stringify(metadata, null, 2));
}

export function buildFilePaths(
  displayName: string,
  outputDir: string
): SnapshotResult['filePaths'] {
  const safeName = displayName.replace(/[^a-zA-Z0-9_-]/g, '_');
  return {
    outputDir,
    imageFile: path.join(outputDir, `${safeName}.png`),
    metaFile: path.join(outputDir, `${safeName}.json`),
  };
}
