// Public API

// Config types
export type {
  ResolvedConfig,
  SnapshotResult,
  VisualSnapshotConfig,
} from './config';
export {resolveConfig} from './config';

// HTML document helper — for custom renderer authors
export {buildDocument} from './document';
export type {BuildDocumentOptions} from './document';

// Renderer interface and built-in renderers
export type {Renderer, RenderOutput} from './renderers/types';
export {createEmotionRenderer} from './renderers/emotion';
export type {EmotionRendererOptions} from './renderers/emotion';
export {staticRenderer} from './renderers/static';

// Snapshot options type — for typing wrapper optionsFn in tests
export type {SnapshotOptions} from './jest/framework';

// Core snapshot capture
export {captureSnapshot} from './snapshot';
export type {SnapshotImageMetadata} from './snapshot';

// Browser lifecycle (for advanced use outside Jest)
export {closeBrowser, getBrowserContext, setChromium} from './browser';

// Output helpers (for custom outputHandler implementations)
export {buildFilePaths, defaultOutputHandler} from './output';
