import type {ReactElement} from 'react';
import {renderToString} from 'react-dom/server';

import type {Renderer, RenderOutput} from './types';

/**
 * Plain HTML renderer with no CSS-in-JS extraction.
 * For use with Tailwind, vanilla-extract, plain CSS, or any approach
 * where styles are provided via headCSS or globalCSS in config.
 */
export const staticRenderer: Renderer = {
  render(element: ReactElement): RenderOutput {
    return {html: renderToString(element)};
  },
};
