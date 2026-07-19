/**
 * MODULE 1: WEBSITE SCANNER  (SRS v2.0)
 * ---------------------------------------
 * Launches a real Chromium browser with Playwright, renders the page
 * exactly like a real browser (JavaScript included), and extracts the
 * fully rendered HTML - plus page metadata (title, final URL, image/
 * CSS/JS counts, estimated page size, load time) AND raw tracking
 * evidence (script/network URLs, cookies, JS globals) for Module 2.
 *
 * The return shape is unchanged for `success`, `error`, `html`, `$`,
 * `statusCode`, and `loadTimeMs` - every other module still reads
 * exactly those fields. Additional fields (finalUrl, pageTitle,
 * imageCount, cssFileCount, jsFileCount, pageSizeBytes, jsGlobals,
 * cookieNames, requestUrls, scriptUrls, partial) are additions.
 */

const { chromium } = require('playwright');
const cheerio = require('cheerio');

// Per-attempt navigation timeout. Only `domcontentloaded` (Step 4) is
// gated by this - it's the one call that can fail an attempt.
const NAVIGATION_TIMEOUT_MS = 45000;

// Retry navigation this many times before giving up, with an
// increasing delay between attempts (transient network/server issues
// often clear up within a few seconds).
const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [2000, 5000];

// Best-effort upgrades attempted AFTER domcontentloaded already
// succeeded - both allowed to time out silently without failing the
// scan, since some sites never fire `load` quickly and many never go
// fully idle (ads, chat widgets, analytics beacons polling forever).
const LOAD_EVENT_TIMEOUT_MS = 8000;
const SETTLE_TIMEOUT_MS = 5000;

// Small fixed buffer after that, for last-moment async tag injection.
const FINAL_BUFFER_MS = 1000;

// Per-attempt timeout when looking for a cookie-consent button. Kept
// short since, by the time we call this, the banner (if any) has
// already rendered - we're not waiting for it to appear, just
// checking whether it's already there and clickable.
const CONSENT_CLICK_TIMEOUT_MS = 500;

/**
 * Adds "https://" to bare inputs like "example.com" or "www.nike.in"
 * (SRS Scanner Feature: "Automatically add HTTPS if missing"), then
 * validates the result is a well-formed http/https URL. Inputs that
 * already specify some other scheme (e.g. "ftp://...") are left as-is
 * and will fail validation below, since this scanner only handles
 * http/https websites.
 * @param {string} rawUrl
 * @returns {string|null} the normalized URL, or null if invalid
 */
function normalizeUrl(rawUrl) {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return null;

  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed);
  const candidate = hasScheme ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.href;
  } catch (err) {
    return null;
  }
}

/**
 * Validates that a string is (or can become, via normalizeUrl) a
 * well-formed http/https URL. Kept as a named export for API
 * compatibility with the previous version of this module.
 * @param {string} url
 * @returns {boolean}
 */
function isValidUrl(url) {
  return normalizeUrl(url) !== null;
}

/**
 * Turns a Playwright/Chromium navigation error into a plain-language
 * message, mirroring how the old Axios version mapped ENOTFOUND /
 * ECONNABORTED / response-status errors to friendly text.
 * @param {Error} err
 * @returns {string}
 */
function friendlyErrorMessage(err) {
  const msg = (err && err.message) || '';

  if (msg.includes('ERR_NAME_NOT_RESOLVED')) {
    return 'Website not found. Check the URL.';
  }
  if (msg.includes('ERR_CONNECTION_REFUSED')) {
    return 'Connection refused by the website. It may be down or blocking automated visits.';
  }
  if (msg.includes('ERR_CERT') || msg.includes('SSL')) {
    return 'The website has an invalid or untrusted SSL certificate.';
  }
  if (msg.includes('crashed') || msg.includes('Target closed') || msg.includes('has been closed')) {
    return 'The browser tab crashed or closed unexpectedly while loading this page.';
  }
  if (msg.includes('Timeout') && msg.includes('exceeded')) {
    return `The website took too long to load (timed out after ${NAVIGATION_TIMEOUT_MS / 1000} seconds, across ${MAX_ATTEMPTS} attempts).`;
  }
  if (msg.includes("Executable doesn't exist")) {
    return "Couldn't launch Chromium. Run 'npx playwright install chromium' to download the browser, then try again.";
  }

  return 'Failed to load the website.';
}

/**
 * Best-effort attempt to dismiss a cookie-consent banner, so trackers
 * gated behind consent (common on EU-facing sites using OneTrust,
 * Cookiebot, or a custom CMP) get a chance to actually fire before we
 * collect evidence. There's no universal consent-banner selector, so
 * this tries a short list of common patterns and gives up quietly if
 * none match - it must never throw or block the scan. Worst case (no
 * banner present, the common case) costs about 3 seconds.
 * @param {import('playwright').Page} page
 * @returns {Promise<boolean>} whether a consent button was clicked
 */
async function tryAcceptConsent(page) {
  const knownSelectors = [
    '#onetrust-accept-btn-handler', // OneTrust
    'button#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll', // Cookiebot
    '.cc-btn.cc-allow' // Cookieconsent (Osano)
  ];

  for (const selector of knownSelectors) {
    try {
      await page.locator(selector).first().click({ timeout: CONSENT_CLICK_TIMEOUT_MS });
      return true;
    } catch (err) {
      // Not present, not visible, or not clickable in time - try the next pattern
    }
  }

  // Fallback for custom-built banners that don't use a known CMP:
  // look for a visible button whose accessible name matches common
  // consent-banner wording.
  try {
    await page
      .getByRole('button', { name: /accept all|accept cookies|i agree|allow all|agree|continue/i })
      .first()
      .click({ timeout: CONSENT_CLICK_TIMEOUT_MS });
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Scrolls through the page so lazy/scroll-triggered content (images,
 * and occasionally trackers gated behind an Intersection Observer)
 * gets a chance to load, then returns to the top. Best-effort only -
 * a failure here should never affect the rest of the scan.
 * @param {import('playwright').Page} page
 */
async function scrollThroughPage(page) {
  try {
    await page.evaluate(async () => {
      const step = Math.max(window.innerHeight, 400);
      const height = document.body ? document.body.scrollHeight : 0;
      for (let y = 0; y < height; y += step) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
      window.scrollTo(0, 0);
    });
  } catch (err) {
    // Page may not support scrolling (rare), or navigated away - non-fatal
  }
}

/**
 * Renders a website with headless Chromium, retrying navigation if it
 * fails, and extracts its rendered HTML, page metadata, and raw
 * tracking evidence. Once the page itself has loaded (domcontentloaded
 * succeeds), every step after that is individually defensive - a
 * failure in any one of them degrades that field to a safe default
 * instead of failing the whole scan (`partial: true` is set when this
 * happens, so callers can tell a full result from a degraded one).
 * @param {string} url - The website URL to scan
 * @returns {Promise<{
 *   success: boolean,
 *   error?: string,
 *   html?: string,
 *   $?: import('cheerio').CheerioAPI,
 *   statusCode?: number,
 *   loadTimeMs?: number,
 *   finalUrl?: string,
 *   pageTitle?: string,
 *   imageCount?: number,
 *   cssFileCount?: number,
 *   jsFileCount?: number,
 *   pageSizeBytes?: number,
 *   jsGlobals?: Object<string,boolean>,
 *   cookieNames?: string[],
 *   requestUrls?: string[],
 *   scriptUrls?: string[],
 *   partial?: boolean
 * }>}
 */
async function scanWebsite(url) {
  // Step 1: Validate (and normalize) the URL
  const normalizedUrl = normalizeUrl(url);
  if (!normalizedUrl) {
    return {
      success: false,
      error: 'Invalid URL. Please enter a valid website address (e.g. example.com or https://example.com).'
    };
  }

  let browser;
  let context;
  try {
    // Step 2: Launch Chromium with args that reduce the most common
    // automated-browser fingerprints. --disable-dev-shm-usage avoids a
    // known cause of headless Chrome crashing on resource-heavy pages.
    // This is standard "look like an ordinary browser" hygiene, not an
    // attempt to defeat CAPTCHAs or challenge-based protections - the
    // SRS's own Limitations section already accounts for sites that
    // still block us (CAPTCHA, auth walls, advanced anti-bot).
    browser = await chromium.launch({
      headless: true,
      args: ['--disable-blink-features=AutomationControlled', '--no-sandbox', '--disable-dev-shm-usage']
    });

    // Step 3: Create a context that looks like an ordinary desktop
    // Chrome visit. Deliberately NOT overriding userAgent: Playwright's
    // own default for headless Chromium is already normalized to look
    // like regular Chrome, and is internally consistent with the
    // Client-Hints headers Chromium actually sends. Hand-typing a UA
    // string here would create a UA/Client-Hints mismatch, which is
    // itself a stronger bot-detection signal than being headless.
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US',
      ignoreHTTPSErrors: true
    });

    // Belt-and-suspenders patch for navigator.webdriver, on top of the
    // launch arg above (some Chromium builds need both).
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    context.setDefaultTimeout(NAVIGATION_TIMEOUT_MS);

    // Step 4: Navigate, retrying on failure. `domcontentloaded` is the
    // ONLY condition that can fail an attempt - it fires fast (doesn't
    // wait for images/ads/analytics), which is what makes retrying it
    // cheap and worthwhile. `load` and `networkidle` are attempted
    // afterward as non-fatal upgrades (Step 6).
    let page;
    let mainResponse;
    let loadTimeMs;
    let imageCount = 0;
    let cssFileCount = 0;
    let jsFileCount = 0;
    let pageSizeBytes = 0;
    let requestUrls;
    let scriptUrls;
    let lastError;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      page = await context.newPage();

      // Reset per-attempt evidence - a failed attempt's partial data
      // is discarded, not merged with the successful attempt's.
      imageCount = 0;
      cssFileCount = 0;
      jsFileCount = 0;
      pageSizeBytes = 0;
      const requestUrlSet = new Set();
      const scriptUrlSet = new Set();

      page.on('response', (response) => {
        try {
          const resourceType = response.request().resourceType();
          if (resourceType === 'image') imageCount++;
          else if (resourceType === 'stylesheet') cssFileCount++;
          else if (resourceType === 'script') jsFileCount++;

          const contentLength = response.headers()['content-length'];
          if (contentLength) pageSizeBytes += parseInt(contentLength, 10) || 0;
        } catch (err) {
          // One resource failing to report metadata shouldn't fail the whole scan
        }
      });

      // Every request URL (strongest tracking evidence - proves a
      // beacon/config call actually fired) plus script URLs tracked
      // separately, both capped so a resource-heavy page can't grow
      // these unboundedly.
      page.on('request', (request) => {
        try {
          const requestUrl = request.url();
          if (requestUrlSet.size < 500) requestUrlSet.add(requestUrl);
          if (request.resourceType() === 'script' && scriptUrlSet.size < 200) {
            scriptUrlSet.add(requestUrl);
          }
        } catch (err) {
          // one bad request shouldn't fail the whole scan
        }
      });

      try {
        const startTime = Date.now();
        mainResponse = await page.goto(normalizedUrl, {
          waitUntil: 'domcontentloaded',
          timeout: NAVIGATION_TIMEOUT_MS
        });
        loadTimeMs = Date.now() - startTime;
        requestUrls = Array.from(requestUrlSet);
        scriptUrls = Array.from(scriptUrlSet);
        lastError = null;
        break; // this attempt succeeded, stop retrying
      } catch (err) {
        lastError = err;
        await page.close().catch(() => {});
        if (attempt < MAX_ATTEMPTS) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt - 1]));
        }
      }
    }

    if (lastError) {
      // All attempts failed - this is the only case that fails the
      // whole scan, per requirement #7 (partial success elsewhere).
      throw lastError;
    }

    let partial = false;

    // Step 5: Best-effort consent-banner acceptance, so trackers gated
    // behind consent get a chance to actually fire before we collect
    // evidence. Never blocks or fails the scan.
    await tryAcceptConsent(page).catch(() => false);

    // Step 6: Best-effort upgrades past domcontentloaded. Both allowed
    // to time out silently - a site that's slow to fully load, or one
    // that never goes network-idle, should never fail an already-
    // successful scan.
    await page.waitForLoadState('load', { timeout: LOAD_EVENT_TIMEOUT_MS }).catch(() => {});
    await scrollThroughPage(page);
    await page.waitForLoadState('networkidle', { timeout: SETTLE_TIMEOUT_MS }).catch(() => {});
    await page.waitForTimeout(FINAL_BUFFER_MS);

    // Step 7: Runtime evidence Module 2 can't get from HTML alone -
    // whether the trackers' own JS actually initialized. Defaults to
    // {} rather than throwing, so one failure here doesn't blank out
    // everything else this function has already gathered.
    let jsGlobals = {};
    try {
      jsGlobals = await page.evaluate(() => ({
        gtag: typeof window.gtag === 'function',
        dataLayer: Array.isArray(window.dataLayer),
        fbq: typeof window.fbq === 'function',
        clarity: typeof window.clarity === 'function'
      }));
    } catch (err) {
      partial = true;
    }

    let cookieNames = [];
    try {
      const cookies = await context.cookies();
      cookieNames = cookies.map((c) => c.name);
    } catch (err) {
      partial = true;
    }

    // Step 8: Extract the rendered HTML and page metadata. These are
    // very unlikely to fail if navigation succeeded, but every field
    // still gets a safe default per requirement #7.
    let html = '';
    try {
      html = await page.content();
    } catch (err) {
      partial = true;
    }

    let pageTitle = '';
    try {
      pageTitle = await page.title();
    } catch (err) {
      partial = true;
    }

    let finalUrl = normalizedUrl;
    try {
      finalUrl = page.url();
    } catch (err) {
      partial = true;
    }

    const statusCode = mainResponse ? mainResponse.status() : null;

    // Step 9: Load whatever HTML we have into Cheerio for later
    // modules. cheerio.load('') is safe - it yields an empty document
    // rather than throwing, so downstream modules see empty results
    // instead of crashing.
    const $ = cheerio.load(html);

    return {
      success: true,
      html,
      $,
      statusCode,
      loadTimeMs,
      finalUrl,
      pageTitle,
      imageCount,
      cssFileCount,
      jsFileCount,
      pageSizeBytes,
      jsGlobals,
      cookieNames,
      requestUrls: requestUrls || [],
      scriptUrls: scriptUrls || [],
      ...(partial ? { partial: true } : {})
    };
  } catch (err) {
    return { success: false, error: friendlyErrorMessage(err) };
  } finally {
    // Always close context + browser, even if something above threw -
    // otherwise every failed scan leaks a Chromium process.
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }
}

module.exports = { scanWebsite, isValidUrl };
