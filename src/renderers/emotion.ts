import type {ReactElement} from 'react';
import {renderToString} from 'react-dom/server';

import type {Renderer, RenderOutput} from './types';

export interface EmotionRendererOptions {
  cacheKey?: string;
}

/**
 * Emotion CSS-in-JS renderer. Extracts critical styles during SSR and returns
 * them as styleTags for injection into the document <head>.
 *
 * IMPORTANT: Requires `ssrShims: { document: false }` in config (the default).
 * Emotion checks for `globalThis.document` at module load time — if defined,
 * CSS extraction silently produces empty styles.
 *
 * Peer dependencies: @emotion/cache, @emotion/react, @emotion/server
 */
export function createEmotionRenderer(options: EmotionRendererOptions = {}): Renderer {
  const {cacheKey = 'css'} = options;

  return {
    render(element: ReactElement): RenderOutput {
      // Dynamic imports to avoid loading Emotion when not in use
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const createCache = require('@emotion/cache').default;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const {CacheProvider} = require('@emotion/react');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const createEmotionServer = require('@emotion/server/create-instance').default;

      const cache = createCache({key: cacheKey});
      const {extractCriticalToChunks, constructStyleTagsFromChunks} =
        createEmotionServer(cache);

      const html = renderToString(CacheProvider({value: cache, children: element}));
      const chunks = extractCriticalToChunks(html);
      const styleTags = constructStyleTagsFromChunks(chunks);

      return {html, styleTags};
    },
  };
}
