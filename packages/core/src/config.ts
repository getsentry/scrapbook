import fs from 'node:fs';
import path from 'node:path';

import { createJiti } from 'jiti';

import type { Renderer } from './renderers/types';

export interface ScrapbookConfig {
  /**
   * Required. Provide a renderer instance (staticRenderer, createEmotionRenderer()),
   * or any object implementing the Renderer interface.
   */
  renderer: Renderer;

  /** CSS injected into <head> before component styles. For @font-face, variables. Default: '' */
  headCSS?: string;

  /** Global reset CSS after component styles. Default: box-sizing + animation:none reset */
  globalCSS?: string;

  /** Output directory. Default: '.artifacts/scrapbook'. Env: SCRAPBOOK_OUTPUT_DIR */
  outputDir?: string;

  /** SSR environment shims applied in setup. Default: { window: true, document: false } */
  ssrShims?: { window?: boolean; document?: boolean };
}

export interface SnapshotResult {
  screenshot: Buffer;
  metadata: { display_name: string; group?: string | null;[key: string]: unknown };
  filePaths: { imageFile: string; metaFile: string; outputDir: string };
}

const DEFAULT_GLOBAL_CSS = `
*, *::before, *::after {
  box-sizing: border-box;
}
*, *::before, *::after, body * {
  animation-duration: 0s !important;
  animation-delay: 0s !important;
  transition-duration: 0s !important;
  transition-delay: 0s !important;
}
`;

export const CONFIG_DEFAULTS: Omit<ScrapbookConfig, 'renderer'> = {
  headCSS: '',
  globalCSS: DEFAULT_GLOBAL_CSS,
  outputDir: '.artifacts/scrapbook',
  ssrShims: { window: true, document: false },
};

let _resolvedConfig: ScrapbookConfig | null = null;

/**
 * Resolves config from (highest priority first):
 * 1. SCRAPBOOK_CONFIG env var pointing to a config file
 * 2. scrapbook.config.ts / .js / .mjs in project root
 *
 * Will throw if no renderer is configured.
 */
export function resolveConfig(cwd = process.cwd()): ScrapbookConfig {
  if (_resolvedConfig) {
    return _resolvedConfig;
  }

  const userConfig = loadUserConfig(cwd);

  if (!userConfig?.renderer) {
    throw new Error(
      '[scrapbook] No renderer configured. Set `renderer` in your scrapbook.config.ts.'
    );
  }

  _resolvedConfig = {
    ...CONFIG_DEFAULTS,
    ...userConfig,
    ssrShims: { ...CONFIG_DEFAULTS.ssrShims, ...userConfig.ssrShims },
    outputDir:
      process.env['SCRAPBOOK_OUTPUT_DIR'] ??
      userConfig.outputDir ??
      CONFIG_DEFAULTS.outputDir,
  } as ScrapbookConfig;

  return _resolvedConfig;
}

function loadUserConfig(cwd: string): Partial<ScrapbookConfig> | null {
  const envConfigPath = process.env['SCRAPBOOK_CONFIG'];
  if (envConfigPath) {
    const resolved = path.resolve(cwd, envConfigPath);
    return requireConfig(resolved);
  }

  const configNames = [
    'scrapbook.config.ts',
    'scrapbook.config.mjs',
    'scrapbook.config.js',
  ];
  for (const name of configNames) {
    const filePath = path.join(cwd, name);
    if (fs.existsSync(filePath)) {
      return requireConfig(filePath);
    }
  }

  return null;
}

function requireConfig(filePath: string): Partial<ScrapbookConfig> {
  const projectRoot = path.dirname(filePath);

  // Resolve react and react-dom from the project root so that user configs that
  // import from @sentry/scrapbook (e.g. staticRenderer) end up using the same
  // React version as the project, rather than scrapbook's own devDependencies.
  // This prevents "Objects are not valid as a React child" errors when the
  // project uses a different major React version than scrapbook.
  let alias: Record<string, string> = {};
  try {
    alias = {
      react: require.resolve('react', { paths: [projectRoot] }),
      'react-dom': require.resolve('react-dom', { paths: [projectRoot] }),
      'react-dom/server': require.resolve('react-dom/server', { paths: [projectRoot] }),
    };
  } catch {
    // If resolution fails, jiti falls back to its own node_modules
  }

  const jiti = createJiti(filePath, { alias });
  const mod = jiti(filePath) as { default?: Partial<ScrapbookConfig> } & Partial<ScrapbookConfig>;
  return mod.default ?? mod;
}
