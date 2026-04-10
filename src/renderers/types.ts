import type {ReactElement} from 'react';

export interface RenderOutput {
  /** The rendered HTML string (body content, not a full document) */
  html: string;
  /** Extracted CSS-in-JS style tags to inject into <head> (e.g. from Emotion) */
  styleTags?: string;
}

export interface Renderer {
  render(element: ReactElement): RenderOutput | Promise<RenderOutput>;
}
