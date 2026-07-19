/**
 * AUDIT RUNNER
 * ---------------------------------------
 * Runs the full audit pipeline (Modules 1-6) for a given URL.
 * Shared by the HTTP API (server.js) and the CLI (cli.js), so
 * both entry points always produce identical results from the
 * same code path.
 */

const { scanWebsite } = require('./scanner');
const { detectTracking } = require('./trackingDetector');
const { analyzeSEO } = require('./seoAnalyzer');
const { analyzePerformance } = require('./performanceAnalyzer');
const { generateOverallScore } = require('./scoreGenerator');
const { generateRecommendations } = require('./recommendationEngine');

/**
 * @param {string} url - The website URL to audit
 * @returns {Promise<{success: boolean, error?: string, data?: Object}>}
 */
async function runAudit(url) {
  // Module 1: Website Scanner
  const result = await scanWebsite(url);
  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Module 2: Tracking Detector - pass the full evidence bundle
  // scanner.js collected (parsed HTML via $, JS globals, cookie
  // names, and every network request URL seen during the load), not
  // just the raw HTML string. This lets detection corroborate across
  // independent signals (a script loading AND its runtime global AND
  // a cookie it sets) instead of trusting one regex match against
  // static markup, which is what made the old HTML-only version easy
  // to fool on JS-heavy or consent-gated sites.
  const tracking = detectTracking(result.html, {
    $: result.$,
    jsGlobals: result.jsGlobals,
    cookieNames: result.cookieNames,
    requestUrls: result.requestUrls
  });

  // Module 3: SEO Analyzer
  const seo = await analyzeSEO(url, result.$);

  // Module 4: Performance Analyzer
  const performance = analyzePerformance(result.html, result.$, result.loadTimeMs);

  // Module 5: Marketing Score Generator
  const overall = generateOverallScore(tracking.score, seo.score, performance.score);

  // Module 6: Recommendation Engine - unchanged call. tracking.results
  // is still the same { [name]: 'Detected'|'Not Detected' } shape it
  // always was, so this module needs no changes at all.
  const recommendations = generateRecommendations(tracking.results, seo.results, performance.metrics);

  return {
    success: true,
    data: {
      url,
      statusCode: result.statusCode,
      htmlLength: result.html.length,
      // `details` is new (per-tracker confidence/evidence/reason) -
      // additive only. Nothing downstream reads it yet, but it's now
      // available for a future PDF/console-output enhancement.
      tracking: { results: tracking.results, score: tracking.score, details: tracking.details },
      seo: { results: seo.results, score: seo.score },
      performance: { metrics: performance.metrics, score: performance.score },
      overall: { score: overall.overallScore, status: overall.status },
      recommendations
    }
  };
}

module.exports = { runAudit };
