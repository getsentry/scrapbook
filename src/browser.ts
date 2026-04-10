import type {Browser, BrowserContext} from 'playwright';

let browser: Browser | null = null;
let context: BrowserContext | null = null;

// Optional override — lets the host project inject its own playwright instance
// to avoid peer-dependency version conflicts (e.g. when installed via file:).
let _playwrightChromium: typeof import('playwright').chromium | null = null;

export function setChromium(chromium: typeof import('playwright').chromium): void {
  _playwrightChromium = chromium;
}

/**
 * Lazily launches a Chromium browser and returns a shared context.
 * Call closeBrowser() in afterAll to clean up.
 */
export async function getBrowserContext(
  args: string[] = [],
  deviceScaleFactor = 2
): Promise<BrowserContext> {
  if (context) {
    return context;
  }

  const chromium = _playwrightChromium ?? (await import('playwright')).chromium;

  browser = await chromium.launch({args});
  context = await browser.newContext({
    deviceScaleFactor,
  });

  return context;
}

export async function closeBrowser(): Promise<void> {
  if (context) {
    await context.close();
    context = null;
  }
  if (browser) {
    await browser.close();
    browser = null;
  }
}
