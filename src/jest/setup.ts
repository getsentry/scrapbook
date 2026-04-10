import {resolveConfig} from '../config';

/**
 * Jest setup file — applies SSR environment shims based on config.
 *
 * The key concern is Emotion: it checks for `globalThis.document` at module
 * load time to decide whether it's in a browser. If document is defined,
 * CSS extraction silently fails. The default config sets `document: false`
 * to prevent this.
 *
 * This file runs in `setupFiles` (before test framework is installed).
 */

const config = resolveConfig();
const {ssrShims} = config;

// Apply window shim so browser APIs like localStorage, matchMedia, etc.
// are available during SSR rendering of components that reference them.
if (ssrShims.window !== false) {
  if (typeof (globalThis as Record<string, unknown>)['window'] === 'undefined') {
    Object.defineProperty(globalThis, 'window', {
      value: {
        localStorage: {
          getItem: () => null,
          setItem: () => undefined,
          removeItem: () => undefined,
          clear: () => undefined,
          length: 0,
          key: () => null,
        },
        matchMedia: () => ({
          matches: false,
          addListener: () => undefined,
          removeListener: () => undefined,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
          dispatchEvent: () => false,
        }),
        location: {href: 'http://localhost/', search: '', pathname: '/', hash: ''},
        navigator: {userAgent: ''},
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
        innerWidth: 1280,
        innerHeight: 720,
      },
      writable: true,
      configurable: true,
    });
  }
}

// Ensure document is NOT defined when using Emotion.
// Emotion detects browser context via `globalThis.document`. If it's defined
// during module load, CSS extraction silently produces empty styles.
if (ssrShims.document === false) {
  // Explicitly remove document if it exists (e.g., if jsdom leaked in)
  if (typeof (globalThis as Record<string, unknown>)['document'] !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (globalThis as Record<string, unknown>)['document'];
  }
}
