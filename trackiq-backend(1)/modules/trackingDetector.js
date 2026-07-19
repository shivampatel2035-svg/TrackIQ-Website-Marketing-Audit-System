/**
 * MODULE 2: TRACKING DETECTOR  (v5 - multi-signal, tiered confidence)
 * ---------------------------------------
 * Detects GA4, GTM, Meta Pixel, and Microsoft Clarity using multiple
 * independent evidence sources:
 *
 *   - html        rendered HTML (inline JS included)
 *   - noscript    <noscript> fallback blocks
 *   - metaTag     name/property/content of <meta> tags
 *   - cookie      cookies the tracker sets as a side effect of running
 *   - scriptSrc   <script src="..."> URLs (from $ and/or extras.scriptUrls)
 *   - network     URLs actually requested during the page load
 *   - jsGlobal    tracker functions/objects actually present on window
 *
 * DETECTION RULE - two tiers, by how forgeable each source is:
 *
 *   BEHAVIORAL evidence (scriptSrc, network, jsGlobal) proves the
 *   browser actually loaded/ran/contacted something - a script tag
 *   really in the rendered DOM, a request really sent over the
 *   network, a runtime global really set on window. A SINGLE match
 *   in any of these is enough to call it Detected.
 *
 *   TEXT evidence (html, noscript, metaTag) and cookie NAMES can
 *   coincidentally appear in comments, dead code, unrelated prose, or
 *   (for very short/common patterns) unrelated systems. These require
 *   TWO independent matches before being trusted - one bare mention
 *   is not proof something is actually running.
 *
 * This gives "detect using any evidence source" its full effect for
 * the sources where that's safe, while keeping the corroboration that
 * keeps HTML/text matching from false-positiving on comments,
 * documentation, or a blog post that just happens to mention a
 * tracker by name.
 *
 * jsGlobal/cookie/network evidence require scanner.js to supply
 * `jsGlobals`, `cookieNames`, and `requestUrls`; scriptSrc evidence
 * can come from `extras.$` (parsed) and/or a direct `extras.scriptUrls`
 * array, merged together. Any/all of these may be missing - detection
 * degrades gracefully to whatever evidence is actually available and
 * never throws.
 */

// Confidence contributed by each evidence category, if it has at
// least one match. This is REPORTING ONLY (shown in `details`) - the
// actual Detected/Not Detected verdict uses the tiered rule below,
// not a raw score threshold.
const SOURCE_WEIGHTS = {
  html: 15,
  noscript: 15,
  scriptSrc: 25,
  jsGlobal: 25,
  network: 25,
  cookie: 10,
  metaTag: 10
};

// Sources that prove the browser actually did something (loaded a
// script, sent a request, ran code that set a global) - forging one
// of these by accident (e.g. via a comment) isn't realistic, so a
// single match here is sufficient.
const BEHAVIORAL_SOURCES = ['scriptSrc', 'network', 'jsGlobal'];

// Text/cookie-name sources - individually more forgeable, so at least
// this many independent categories must agree before trusting them.
const MIN_TEXT_SOURCES_FOR_DETECTION = 2;

// --- Signature database -----------------------------------------
// One entry per tracker. Each key is an evidence category; the value
// is the list of patterns checked against that category's evidence.
// html / noscript / scriptSrc / metaTag / network patterns are
// RegExp, tested against text. cookie patterns are RegExp, tested
// against each cookie NAME (never the value). jsGlobal entries are
// plain string keys, checked against the jsGlobals object's boolean
// flags. scriptSrc/network patterns are deliberately kept to real,
// specific endpoints/paths (not bare words) even though they're in
// the "behavioral" tier - a specific URL pattern is still far more
// reliable evidence than a generic keyword.
const SIGNATURES = {
  'Google Analytics 4 (GA4)': {
    html: [/gtag\(\s*['"]config['"]\s*,\s*['"]G-[A-Z0-9]+['"]/i, /gtag\(\s*['"]js['"]/i],
    scriptSrc: [/googletagmanager\.com\/gtag\/js\?id=G-/i, /google-analytics\.com\/analytics\.js/i],
    network: [
      /google-analytics\.com\/g\/collect/i,
      /analytics\.google\.com\/g\/collect/i,
      /googletagmanager\.com\/gtag\/js\?id=G-/i
    ],
    jsGlobal: ['gtag'],
    // _ga_<CONTAINER_ID> is GA4-specific (plain _ga alone is legacy
    // Universal Analytics, but gtag.js sets it too, so it's still
    // decent corroborating evidence).
    cookie: [/^_ga_/, /^_ga$/, /^_gid$/]
  },

  'Google Tag Manager (GTM)': {
    // The real GTM snippet builds its script URL via JS string
    // concatenation ('...gtm.js?id='+i+dl), so the full URL is never
    // one literal string - what IS literal is the quoted container ID
    // passed as the IIFE's last argument: ...'dataLayer','GTM-XXXXX').
    html: [/['"]GTM-[A-Z0-9]{4,}['"]/],
    // The <noscript> fallback iframe DOES write its URL literally.
    noscript: [/googletagmanager\.com\/ns\.html\?id=GTM-[A-Z0-9]+/i],
    scriptSrc: [/googletagmanager\.com\/gtm\.js/i],
    network: [/googletagmanager\.com\/gtm\.js/i],
    // dataLayer is shared with GA4's gtag.js (which also pushes into
    // it even without GTM present), so on its own it's ambiguous
    // between the two - still a valid behavioral signal for "some
    // Google tagging system is running", scored under GTM here since
    // dataLayer is GTM's own mechanism.
    jsGlobal: ['dataLayer']
  },

  'Meta Pixel': {
    html: [/fbq\(\s*['"]init['"]/i],
    scriptSrc: [/connect\.facebook\.net\/[^"']*\/fbevents\.js/i],
    network: [
      /connect\.facebook\.net\/[^"']*\/fbevents\.js/i,
      // The actual pixel-firing beacon - strongest possible evidence,
      // since it proves an event was actually sent to Meta.
      /(www\.)?facebook\.com\/tr\/?\?/i
    ],
    // The classic <noscript><img src="facebook.com/tr?..."> fallback,
    // present even with JS disabled.
    noscript: [/(www\.)?facebook\.com\/tr\/?\?/i],
    jsGlobal: ['fbq'],
    cookie: [/^_fbp$/, /^_fbc$/],
    // Meta Business domain-verification tag - unrelated trackers
    // don't set this, so it's a real (if supporting) signal.
    metaTag: [/facebook-domain-verification/i]
  },

  'Microsoft Clarity': {
    // 'set'/'identify'/'event' calls only appear on sites that ALSO
    // use Clarity's custom-tagging API - real, but narrower than the
    // baseline install. The loader-URL pattern catches a basic
    // install (snippet only, no custom calls) too.
    html: [/clarity\(\s*['"](set|identify|event)['"]/i, /clarity\.ms\/tag\//i],
    scriptSrc: [/clarity\.ms\/tag\//i],
    network: [/clarity\.ms\/tag\//i, /clarity\.ms\/collect/i],
    jsGlobal: ['clarity'],
    cookie: [/^_clck$/, /^_clsk$/]
  }
};

// --- Evidence extraction (from cheerio $) -------------------------
// Each extractor is defensive: missing/broken input never throws, it
// just yields empty evidence for that category.

function extractScriptSrcs($, extraScriptUrls) {
  const fromDom = [];
  if ($) {
    try {
      fromDom.push(
        ...$('script[src]')
          .map((i, el) => $(el).attr('src') || '')
          .get()
      );
    } catch (err) {
      // fall through with whatever we already collected
    }
  }
  const fromExtras = Array.isArray(extraScriptUrls) ? extraScriptUrls : [];
  return dedupeNonEmpty([...fromDom, ...fromExtras]);
}

function extractNoscriptText($) {
  if (!$) return '';
  try {
    return $('noscript')
      .map((i, el) => $(el).html() || '')
      .get()
      .join(' ');
  } catch (err) {
    return '';
  }
}

function extractMetaTagsText($) {
  if (!$) return '';
  try {
    return $('meta')
      .map((i, el) => {
        const $el = $(el);
        return `${$el.attr('name') || ''} ${$el.attr('property') || ''} ${$el.attr('content') || ''}`;
      })
      .get()
      .join(' ');
  } catch (err) {
    return '';
  }
}

/** Removes empty/whitespace-only entries and duplicates from a list. */
function dedupeNonEmpty(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const out = [];
  for (const item of list) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

// --- Generic matchers (one per evidence shape) --------------------
// Each returns the SPECIFIC matched text (for reporting) or null.

/** Tests patterns against a single blob of text; returns the matched substring or null. */
function textMatch(patterns, text) {
  if (!patterns || !text) return null;
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }
  return null;
}

/** Tests patterns against every item in a list; returns the matching item or null. */
function listMatch(patterns, list) {
  if (!patterns || !list || list.length === 0) return null;
  for (const item of list) {
    if (typeof item === 'string' && item && patterns.some((pattern) => pattern.test(item))) return item;
  }
  return null;
}

/** Returns the first jsGlobal key flagged true (as "window.KEY"), or null. */
function jsGlobalMatch(keys, jsGlobals) {
  if (!keys || !jsGlobals) return null;
  const hit = keys.find((key) => jsGlobals[key] === true);
  return hit ? `window.${hit}` : null;
}

/**
 * Scores one tracker's signature against the full evidence bundle.
 * @param {Object} signature - one entry from SIGNATURES
 * @param {Object} evidence - extracted + passed-through evidence
 * @returns {{confidence: number, matchedEvidence: string[], matchedSignatures: string[], isDetected: boolean}}
 */
function evaluateTracker(signature, evidence) {
  const matchedEvidence = [];
  const matchedSignatures = [];
  let confidence = 0;

  const checks = [
    ['html', () => textMatch(signature.html, evidence.html)],
    ['noscript', () => textMatch(signature.noscript, evidence.noscriptText)],
    ['metaTag', () => textMatch(signature.metaTag, evidence.metaText)],
    ['scriptSrc', () => listMatch(signature.scriptSrc, evidence.scriptSrcs)],
    ['network', () => listMatch(signature.network, evidence.requestUrls)],
    ['cookie', () => listMatch(signature.cookie, evidence.cookieNames)],
    ['jsGlobal', () => jsGlobalMatch(signature.jsGlobal, evidence.jsGlobals)]
  ];

  checks.forEach(([source, check]) => {
    try {
      if (!signature[source]) return;
      const matched = check();
      if (matched) {
        confidence += SOURCE_WEIGHTS[source];
        matchedEvidence.push(source);
        matchedSignatures.push(matched);
      }
    } catch (err) {
      // A single bad evidence source should never take down detection
      // for the other categories, or for the other trackers.
    }
  });

  const hasBehavioralMatch = matchedEvidence.some((s) => BEHAVIORAL_SOURCES.includes(s));
  const textMatchCount = matchedEvidence.filter((s) => !BEHAVIORAL_SOURCES.includes(s)).length;
  const isDetected = hasBehavioralMatch || textMatchCount >= MIN_TEXT_SOURCES_FOR_DETECTION;

  return { confidence: Math.min(confidence, 100), matchedEvidence, matchedSignatures, isDetected };
}

// Human-readable label for each evidence category, used to build the
// "reason" sentence below.
const EVIDENCE_LABELS = {
  html: 'an inline snippet in the page HTML',
  noscript: 'a <noscript> fallback tag',
  scriptSrc: 'its loader script actually present on the page',
  network: 'a live network request observed during the scan',
  jsGlobal: 'its runtime variable set on window',
  cookie: 'a cookie it sets',
  metaTag: 'a verification meta tag'
};

/**
 * Builds a short, human-readable explanation of a tracker's verdict.
 * @param {string} techName
 * @param {boolean} isDetected
 * @param {string[]} matchedEvidence
 * @param {number} confidence
 * @returns {string}
 */
function buildReason(techName, isDetected, matchedEvidence, confidence) {
  if (matchedEvidence.length === 0) {
    return `No evidence of ${techName} found in HTML, scripts, network requests, cookies, or page globals.`;
  }

  const parts = matchedEvidence.map((source) => EVIDENCE_LABELS[source] || source);
  const joined =
    parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;

  if (isDetected) {
    return `${techName} confirmed via ${joined} (confidence ${confidence}%).`;
  }
  return `${techName} shows ${joined} only - not enough on its own (a single text-based or cookie match) to rule out a comment, dead code, or unrelated mention. Confidence ${confidence}%.`;
}

/**
 * Detects which tracking technologies are present, and calculates a
 * Tracking Score based on how many were found.
 *
 * Backward compatible: `detectTracking(html)` still works exactly as
 * before (html/noscript/scriptSrc/metaTag evidence only, since $ isn't
 * passed). Pass the second argument to unlock the full multi-signal
 * detection once scanner.js supplies the extra data.
 *
 * @param {string} html - Rendered HTML source of the scanned website
 * @param {Object} [extras]
 * @param {import('cheerio').CheerioAPI} [extras.$] - parsed HTML, for scriptSrc/noscript/metaTag evidence
 * @param {string[]} [extras.scriptUrls] - script URLs, if scanner.js provides them directly (merged with $-derived ones)
 * @param {Object<string,boolean>} [extras.jsGlobals] - e.g. { gtag: true, fbq: false, ... }
 * @param {string[]} [extras.cookieNames] - cookie names present after the scan
 * @param {string[]} [extras.requestUrls] - URLs requested during the page load
 * @returns {{
 *   results: Object<string,string>,
 *   score: number,
 *   details: Object<string,{
 *     detected: boolean,
 *     confidence: number,
 *     matchedEvidence: string[],
 *     matchedSignatures: string[],
 *     reason: string
 *   }>
 * }}
 */
function detectTracking(html, extras = {}) {
  const { $, scriptUrls, jsGlobals, cookieNames, requestUrls } = extras || {};

  const evidenceBundle = {
    html,
    scriptSrcs: extractScriptSrcs($, scriptUrls),
    noscriptText: extractNoscriptText($),
    metaText: extractMetaTagsText($),
    jsGlobals,
    cookieNames: dedupeNonEmpty(cookieNames),
    requestUrls: dedupeNonEmpty(requestUrls)
  };

  const results = {};
  const details = {};
  let detectedCount = 0;
  const trackerNames = Object.keys(SIGNATURES);

  trackerNames.forEach((name) => {
    const { confidence, matchedEvidence, matchedSignatures, isDetected } = evaluateTracker(
      SIGNATURES[name],
      evidenceBundle
    );

    results[name] = isDetected ? 'Detected' : 'Not Detected';
    details[name] = {
      detected: isDetected,
      confidence,
      matchedEvidence,
      matchedSignatures,
      reason: buildReason(name, isDetected, matchedEvidence, confidence)
    };
    if (isDetected) detectedCount++;
  });

  // Tracking Score: what percentage of the 4 known trackers were found
  // (unchanged formula - same field name/shape the rest of the project reads).
  const score = Math.round((detectedCount / trackerNames.length) * 100);

  return { results, score, details };
}

// --- Adding a new tracker ------------------------------------------
// 1. Add an entry to SIGNATURES with whichever evidence categories
//    are genuinely reliable for it (not every tracker needs all 7).
// 2. If it needs a category not listed here (e.g. 'jsonLd' or a
//    generic 'iframe'), add an extractor above (following
//    extractScriptSrcs etc.), a case in evaluateTracker's `checks`
//    array, a weight in SOURCE_WEIGHTS, and a label in
//    EVIDENCE_LABELS. Decide if it's BEHAVIORAL (add to
//    BEHAVIORAL_SOURCES) or text-based (leave it out - it'll need
//    MIN_TEXT_SOURCES_FOR_DETECTION corroboration by default).
// No other changes needed - detectTracking() and its return shape
// (results/score/details) stay the same.

module.exports = { detectTracking, BEHAVIORAL_SOURCES, MIN_TEXT_SOURCES_FOR_DETECTION };
