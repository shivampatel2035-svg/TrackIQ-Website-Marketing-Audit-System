/**
 * TrackIQ CLI
 * ---------------------------------------
 * Interactive command-line entry point. Prompts for a website URL,
 * runs the full audit pipeline (Modules 1-6), prints a summary to
 * the console, and saves a PDF report (Module 7) into ./reports/.
 *
 * This is a second way to run the same audit logic your HTTP API
 * uses (server.js) - useful for quick demos/testing without needing
 * Postman, curl, or a frontend running.
 *
 * Usage:
 *   node cli.js
 *   (or "npm run audit" if you add that script to package.json)
 */

const fs = require('fs');
const path = require('path');
const readline = require('node:readline/promises');
const { runAudit } = require('./modules/auditRunner');
const { createPDFReport } = require('./modules/pdfGenerator');

const REPORTS_DIR = path.join(__dirname, 'reports');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/** Keeps asking until the person types something non-empty. */
async function askForUrl() {
  let url = '';
  while (!url) {
    url = (await rl.question('Enter site URL :- ')).trim();
    if (!url) console.log('Please enter a URL.\n');
  }
  // Convenience: if they typed "www.nike.in" instead of
  // "https://www.nike.in", assume https rather than failing validation.
  if (!/^https?:\/\//i.test(url)) {
    const withProtocol = `https://${url}`;
    console.log(`(No http:// or https:// given - trying ${withProtocol})\n`);
    return withProtocol;
  }
  return url;
}

/** Prints a { key: value, ... } object as indented, dot-leader console lines. */
function printResults(resultsObj) {
  Object.entries(resultsObj).forEach(([key, value]) => {
    console.log(`   ${key.padEnd(28, '.')} ${value}`);
  });
}

/** Prints the full audit summary to the console, mirroring the PDF's sections. */
function printSummary(data) {
  console.log('\nTRACKING REPORT');
  printResults(data.tracking.results);
  console.log(`   Score: ${data.tracking.score} / 100`);

  console.log('\nSEO REPORT');
  printResults(data.seo.results);
  console.log(`   Score: ${data.seo.score} / 100`);

  console.log('\nPERFORMANCE REPORT');
  printResults(data.performance.metrics);
  console.log(`   Score: ${data.performance.score} / 100`);

  console.log(`\nMARKETING HEALTH SCORE: ${data.overall.score} / 100  (${data.overall.status})`);

  console.log('\nRECOMMENDATIONS');
  data.recommendations.forEach((rec, i) => console.log(`   ${i + 1}. ${rec}`));
  console.log('');
}

/**
 * Builds a filename from the scanned hostname + timestamp, e.g.
 * trackiq-report-www.nike.in-2026-07-15T18-30-00.pdf
 * Every scan gets its own file named after the site it scanned,
 * so nothing gets mixed up with a previous run's report.
 */
function buildReportFilename(url) {
  const host = new URL(url).hostname.replace(/[^a-z0-9.-]/gi, '-');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `trackiq-report-${host}-${stamp}.pdf`;
}

/** Renders the PDF (Module 7) and writes it to ./reports/, returning the full path. */
function savePdfReport(data) {
  if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const filepath = path.join(REPORTS_DIR, buildReportFilename(data.url));

  return new Promise((resolve, reject) => {
    const doc = createPDFReport(data);
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);
    stream.on('finish', () => resolve(filepath));
    stream.on('error', reject);
  });
}

/** Runs one full scan: ask -> audit -> print -> save PDF. */
async function runOnce() {
  const url = await askForUrl();

  console.log(`Scanning ${url} ...`);

  try {
    const audit = await runAudit(url);

    if (!audit.success) {
      console.log(`\nScan failed: ${audit.error}\n`);
      return;
    }

    printSummary(audit.data);
    const filepath = await savePdfReport(audit.data);
    console.log(`PDF report saved: ${filepath}\n`);
  } catch (err) {
    console.log(`\nUnexpected error while scanning: ${err.message}\n`);
  }
}

async function main() {
  console.log('=== TrackIQ: Website Marketing Audit ===\n');

  let again = true;
  while (again) {
    try {
      await runOnce();
      const answer = (await rl.question('Scan another site? (y/n): ')).trim().toLowerCase();
      again = answer === 'y' || answer === 'yes';
      console.log('');
    } catch (err) {
      // Input stream ended (Ctrl+D, or piped input ran out) - stop asking and exit cleanly
      again = false;
    }
  }

  console.log('Done. Goodbye!');
  rl.close();
}

main();
