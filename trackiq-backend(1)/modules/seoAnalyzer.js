/**
 * MODULE 3: SEO ANALYZER
 * ---------------------------------------
 * Checks essential on-page and site-level SEO elements:
 * title tag, meta description, H1, robots.txt, sitemap.xml,
 * and Open Graph tags. Robots.txt and sitemap.xml live at the
 * site root (not inside the scanned page's HTML), so they need
 * their own separate requests.
 */

const axios = require('axios');

/**
 * Checks whether a URL exists and returns a successful status.
 * Used for robots.txt / sitemap.xml.
 * @param {string} url
 * @returns {Promise<boolean>}
 */
async function urlExists(url) {
  try {
    const response = await axios.get(url, {
      timeout: 5000,
      validateStatus: (status) => status < 400 // treat any 2xx/3xx as "exists"
    });
    return response.status < 400;
  } catch (err) {
    return false;
  }
}

/**
 * Analyzes essential SEO elements for a scanned page.
 * @param {string} pageUrl - The original URL that was scanned
 * @param {import('cheerio').CheerioAPI} $ - Cheerio-loaded HTML of that page
 * @returns {Promise<{results: Object<string, string>, score: number}>}
 */
async function analyzeSEO(pageUrl, $) {
  const results = {};

  // --- On-page checks (from the already-downloaded HTML) ---
  const title = $('title').first().text().trim();
  results['Title'] = title.length > 0 ? 'Present' : 'Missing';

  const metaDescription = $('meta[name="description"]').attr('content');
  results['Meta Description'] =
    metaDescription && metaDescription.trim().length > 0 ? 'Present' : 'Missing';

  const h1Count = $('h1').length;
  results['H1'] = h1Count > 0 ? 'Present' : 'Missing';

  const openGraphCount = $('meta[property^="og:"]').length;
  results['Open Graph'] = openGraphCount > 0 ? 'Present' : 'Missing';

  // --- Site-level checks (separate requests, since these live at the domain root) ---
  let origin;
  try {
    origin = new URL(pageUrl).origin;
  } catch (err) {
    origin = null;
  }

  if (origin) {
    const [robotsOk, sitemapOk] = await Promise.all([
      urlExists(`${origin}/robots.txt`),
      urlExists(`${origin}/sitemap.xml`)
    ]);
    results['Robots.txt'] = robotsOk ? 'Present' : 'Missing';
    results['Sitemap.xml'] = sitemapOk ? 'Present' : 'Missing';
  } else {
    results['Robots.txt'] = 'Missing';
    results['Sitemap.xml'] = 'Missing';
  }

  // --- Score: percentage of the 6 checks that are Present ---
  const checks = Object.values(results);
  const presentCount = checks.filter((v) => v === 'Present').length;
  const score = Math.round((presentCount / checks.length) * 100);

  return { results, score };
}

module.exports = { analyzeSEO };
