// Config types
export type { SnapshotResult, ScrapbookConfig } from './config';
export { resolveConfig } from './config';

// HTML document helper — for custom renderer authors
export { buildDocument } from './document';
export type { BuildDocumentOptions } from './document';

// Renderer interface and built-in renderers
export type { Renderer, RenderOutput } from './renderers/types';
export { createEmotionRenderer } from './renderers/emotion';
export type { EmotionRendererOptions } from './renderers/emotion';
export { staticRenderer } from './renderers/static';

// Shared types for framework adapter authors
export type { SnapshotOptions, RenderFn } from './types';

// Core snapshot capture
export { captureSnapshot } from './snapshot';
export type { SnapshotImageMetadata } from './snapshot';

// Browser lifecycle (for advanced use and framework adapters)
export { closeBrowser, getBrowserContext, setChromium } from './browser';

// Output helpers (for custom outputHandler implementations)
export { buildFilePaths, defaultOutputHandler, getOutputDir } from './output';

// SSR shim helper — call in your framework's setupFiles
export { applySSRShims } from './ssr-shims';
