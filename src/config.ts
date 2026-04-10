import fs from 'node:fs';
import path from 'node:path';

import type { ReactElement } from 'react';

import type { Renderer } from './renderers/types';

export interface VisualSnapshotConfig {
  /**
   * Provide a renderer instance — use staticRenderer, createEmotionRenderer(),
   * or any object implementing the Renderer interface. Default: staticRenderer
   */
  renderer?: Renderer;

  /** CSS injected into <head> before component styles. For @font-face, variables. Default: '' */
  headCSS?: string;

  /** Global reset CSS after component styles. Default: box-sizing + animation:none reset */
  globalCSS?: string;

  /** Wraps rendered body HTML. For dark-mode classes, background containers, etc. Default: identity */
  wrapBody?: (html: string) => string;

  /**
   * Wraps every rendered element. Use for providers that must be in the React tree
   * (themes, context). Receives per-snapshot extras passed from it.snapshot() calls.
   */
  wrapper?: (element: ReactElement, extras: Record<string, unknown>) => ReactElement;

  /** Playwright chromium.launch() args. Default: ['--font-render-hinting=none', '--disable-skia-runtime-opts'] */
  browserArgs?: string[];

  /** Screenshot DPI scale factor. Default: 2 */
  deviceScaleFactor?: number;

  /** Output directory. Default: '.artifacts/snapshots'. Env: SNAPSHOT_OUTPUT_DIR */
  outputDir?: string;

  /** SSR environment shims applied in Jest setup. Default: { window: true, document: false } */
  ssrShims?: { window?: boolean; document?: boolean };

  /** Extra metadata added to every snapshot's JSON. Default: {} */
  defaultMetadata?: Record<string, string>; // TODO: Transform

  /** Custom output handler replacing the default PNG+JSON writer */
  outputHandler?: (result: SnapshotResult) => Promise<void>;
}

export interface SnapshotResult {
  screenshot: Buffer;
  metadata: { display_name: string; group?: string | null;[key: string]: unknown };
  filePaths: { imageFile: string; metaFile: string; outputDir: string };
}

export interface ResolvedConfig extends Required<Omit<VisualSnapshotConfig, 'outputHandler' | 'wrapper'>> {
  wrapper?: VisualSnapshotConfig['wrapper'];
  outputHandler?: VisualSnapshotConfig['outputHandler'];
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

export const CONFIG_DEFAULTS = {
  headCSS: '',
  globalCSS: DEFAULT_GLOBAL_CSS,
  wrapBody: (html: string) => html,
  browserArgs: ['--font-render-hinting=none', '--disable-skia-runtime-opts'],
  deviceScaleFactor: 2,
  outputDir: '.artifacts/snapshots',
  ssrShims: { window: true, document: false },
  defaultMetadata: {},
} as const;

let _resolvedConfig: ResolvedConfig | null = null;

/**
 * Resolves config from (highest priority first):
 * 1. SNAPSHOT_CONFIG env var pointing to a config file
 * 2. snapshot.config.ts / .js / .mjs in project root
 * 3. snapshot key in package.json
 * 4. Built-in defaults (no renderer — will error if not configured)
 */
export function resolveConfig(cwd = process.cwd()): ResolvedConfig {
  if (_resolvedConfig) {
    return _resolvedConfig;
  }

  const userConfig = loadUserConfig(cwd);

  if (!userConfig?.renderer) {
    throw new Error(
      '[scrapbook] No renderer configured. Set `renderer` in your snapshot.config.ts.'
    );
  }

  _resolvedConfig = {
    ...CONFIG_DEFAULTS,
    ssrShims: { ...CONFIG_DEFAULTS.ssrShims, ...userConfig.ssrShims },
    ...userConfig,
    outputDir:
      process.env['SNAPSHOT_OUTPUT_DIR'] ??
      userConfig.outputDir ??
      CONFIG_DEFAULTS.outputDir,
  } as ResolvedConfig;

  return _resolvedConfig;
}

/** Reset cached config — useful for testing. */
export function resetConfig(): void {
  _resolvedConfig = null;
}

function loadUserConfig(cwd: string): Partial<VisualSnapshotConfig> | null {
  // 1. Env var pointing to config file
  const envConfigPath = process.env['SNAPSHOT_CONFIG'];
  if (envConfigPath) {
    const resolved = path.resolve(cwd, envConfigPath);
    return requireConfig(resolved);
  }

  // 2. Config file in project root
  const configNames = [
    'snapshot.config.ts',
    'snapshot.config.mjs',
    'snapshot.config.js',
  ];
  for (const name of configNames) {
    const filePath = path.join(cwd, name);
    if (fs.existsSync(filePath)) {
      return requireConfig(filePath);
    }
  }

  // 3. package.json key
  const pkgPath = path.join(cwd, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    if (pkg.visualSnapshot) {
      return pkg.visualSnapshot as Partial<VisualSnapshotConfig>;
    }
  }

  return null;
}

function requireConfig(filePath: string): Partial<VisualSnapshotConfig> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require(filePath);
  return mod.default ?? mod;
}
