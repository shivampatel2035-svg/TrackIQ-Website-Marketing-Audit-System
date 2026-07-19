/**
 * MODULE 4: PERFORMANCE ANALYZER
 * ---------------------------------------
 * Collects basic performance signals from the already-downloaded
 * page: estimated page size, image/JS/CSS file counts, and the
 * time the initial HTML fetch took (used as Estimated Load Time).
 *
 * Score starts at 100 and deducts points when each metric crosses
 * a threshold, per the SRS's "Score Calculation Algorithm."
 */

/**
 * Analyzes basic performance metrics for a scanned page.
 * @param {string} html - Raw HTML source of the scanned website
 * @param {import('cheerio').CheerioAPI} $ - Cheerio-loaded HTML of that page
 * @param {number} loadTimeMs - Time (ms) the initial HTML fetch took
 * @returns {{metrics: Object<string, string|number>, score: number}}
 */
function analyzePerformance(html, $, loadTimeMs) {
  // Page size, estimated from the raw HTML's byte length
  const pageSizeBytes = Buffer.byteLength(html, 'utf8');
  const pageSizeMB = pageSizeBytes / (1024 * 1024);

  const imageCount = $('img').length;
  const jsFileCount = $('script[src]').length;
  const cssFileCount = $('link[rel="stylesheet"]').length;
  const loadTimeSeconds = loadTimeMs / 1000;

  const metrics = {
    'Page Size': `${pageSizeMB.toFixed(2)} MB`,
    Images: imageCount,
    'JavaScript Files': jsFileCount,
    'CSS Files': cssFileCount,
    'Estimated Load Time': `${loadTimeSeconds.toFixed(1)} Seconds`
  };

  // --- Score: start at 100, deduct points as each metric crosses a threshold ---
  let score = 100;

  if (pageSizeMB > 5) score -= 25;
  else if (pageSizeMB > 3) score -= 15;
  else if (pageSizeMB > 1) score -= 5;

  if (imageCount > 100) score -= 25;
  else if (imageCount > 50) score -= 15;
  else if (imageCount > 20) score -= 5;

  if (jsFileCount > 50) score -= 25;
  else if (jsFileCount > 25) score -= 15;
  else if (jsFileCount > 10) score -= 5;

  if (cssFileCount > 15) score -= 15;
  else if (cssFileCount > 5) score -= 5;

  if (loadTimeSeconds > 7) score -= 25;
  else if (loadTimeSeconds > 4) score -= 15;
  else if (loadTimeSeconds > 2.5) score -= 5;

  score = Math.max(0, Math.min(100, score));

  return { metrics, score };
}

module.exports = { analyzePerformance };
