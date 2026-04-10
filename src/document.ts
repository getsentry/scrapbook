export interface BuildDocumentOptions {
  /** CSS to inject before component styles (fonts, variables) */
  headCSS?: string;
  /** Inline style tags string (e.g. from styled-components sheet.getStyleTags()) */
  styleTags?: string;
  /** Global CSS injected after component styles */
  globalCSS?: string;
  /** The rendered body HTML */
  body: string;
}

export function buildDocument({
  headCSS = '',
  styleTags = '',
  globalCSS = '',
  body,
}: BuildDocumentOptions): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    ${headCSS ? `<style>${headCSS}</style>` : ''}
    ${styleTags}
    ${globalCSS ? `<style>${globalCSS}</style>` : ''}
  </head>
  <body>
    ${body}
  </body>
</html>`;
}
