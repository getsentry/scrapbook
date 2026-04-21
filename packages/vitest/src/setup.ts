import { applySSRShims, resolveConfig } from '@sentry/scrapbook';

/**
 * Vitest setup file — applies SSR environment shims based on config.
 * Add to your Vitest config's `setupFiles` (before the framework setup).
 *
 * The key concern is Emotion: it checks for `globalThis.document` at module
 * load time to decide whether it's in a browser. If document is defined,
 * CSS extraction silently fails. The default config sets `document: false`
 * to prevent this.
 */
applySSRShims(resolveConfig());
