import { applySSRShims, resolveConfig } from '@sentry/scrapbook';

/**
 * Jest setup file — applies SSR environment shims based on config.
 * Add to your Jest config's `setupFiles` (before `setupFilesAfterEnv`).
 *
 * The key concern is Emotion: it checks for `globalThis.document` at module
 * load time to decide whether it's in a browser. If document is defined,
 * CSS extraction silently fails. The default config sets `document: false`
 * to prevent this.
 */
applySSRShims(resolveConfig());
