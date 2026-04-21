import { chromium, type Browser, type BrowserContext, type BrowserType, type Page } from 'playwright';

let _browser: Browser | null = null;
let _context: BrowserContext | null = null;
let _page: Page | null = null;

// Optional override — lets the host project inject its own playwright instance
// to avoid peer-dependency version conflicts (e.g. when installed via file:).
let _playwrightChromium: BrowserType | null = null;

export function setChromium(chromium: BrowserType): void {
  _playwrightChromium = chromium;
}

/**
 * Lazily launches a Chromium browser and returns a shared context.
 * Call closeBrowser() in afterAll to clean up.
 */
export async function getBrowserContext(
  args: string[] = [],
): Promise<BrowserContext> {
  if (_context) {
    return _context;
  }

  const resolvedChromium = _playwrightChromium ?? chromium;

  _browser = await resolvedChromium.launch({ args });
  _context = await _browser.newContext();
  return _context;
}

/**
 * Returns a shared Page, creating it lazily on first call.
 * Reusing one page across snapshots avoids newPage()/close() overhead per snapshot.
 */
export async function getPage(args: string[] = []): Promise<Page> {
  if (_page) {
    return _page;
  }
  const ctx = await getBrowserContext(args);
  _page = await ctx.newPage();
  return _page;
}

/**
 * Discards the cached page so the next getPage() call creates a fresh one.
 * Call this when a Playwright operation fails and the page may be in a bad state.
 */
export function discardPage(): void {
  _page = null;
}

export async function closeBrowser(): Promise<void> {
  if (_page) {
    await _page.close();
    _page = null;
  }
  if (_context) {
    await _context.close();
    _context = null;
  }
  if (_browser) {
    await _browser.close();
    _browser = null;
  }
}
