/**
 * MODULE 6: RECOMMENDATION ENGINE
 * ---------------------------------------
 * Generates plain-language recommendations using simple predefined
 * if/else rules based on the results from Modules 2-4. No AI -
 * matches the SRS's Rule-Based Decision Algorithm.
 */

/**
 * Generates a list of recommendations based on tracking, SEO,
 * and performance results.
 * @param {Object<string,string>} tracking - results from Module 2
 * @param {Object<string,string>} seo - results from Module 3
 * @param {Object<string,string|number>} performance - metrics from Module 4
 * @returns {string[]}
 */
function generateRecommendations(tracking, seo, performance) {
  const recommendations = [];

  // --- Tracking rules ---
  if (tracking['Google Analytics 4 (GA4)'] === 'Not Detected') {
    recommendations.push('Install Google Analytics 4 (GA4) to track visitor behavior.');
  }
  if (tracking['Google Tag Manager (GTM)'] === 'Not Detected') {
    recommendations.push('Install Google Tag Manager (GTM) to manage tracking tags more easily.');
  }
  if (tracking['Meta Pixel'] === 'Not Detected') {
    recommendations.push('Install Meta Pixel to track and optimize Facebook/Instagram ad campaigns.');
  }
  if (tracking['Microsoft Clarity'] === 'Not Detected') {
    recommendations.push('Install Microsoft Clarity for free heatmaps and session recordings.');
  }

  // --- SEO rules ---
  if (seo['Title'] === 'Missing') {
    recommendations.push('Add a title tag to help search engines and users understand the page.');
  }
  if (seo['Meta Description'] === 'Missing') {
    recommendations.push('Add a meta description to improve click-through rate from search results.');
  }
  if (seo['H1'] === 'Missing') {
    recommendations.push("Add an H1 heading to clarify the page's main topic for SEO.");
  }
  if (seo['Open Graph'] === 'Missing') {
    recommendations.push('Add Open Graph tags so the page looks good when shared on social media.');
  }
  if (seo['Robots.txt'] === 'Missing') {
    recommendations.push('Create a robots.txt file to guide search engine crawlers.');
  }
  if (seo['Sitemap.xml'] === 'Missing') {
    recommendations.push('Create a sitemap.xml file to help search engines index the site.');
  }

  // --- Performance rules (thresholds match Module 4's scoring) ---
  if (performance['JavaScript Files'] > 10) {
    recommendations.push('Reduce the number of JavaScript files to improve load speed.');
  }
  if (performance['CSS Files'] > 5) {
    recommendations.push('Reduce the number of CSS files or combine them to improve load speed.');
  }
  if (performance['Images'] > 20) {
    recommendations.push('Reduce the number of images or compress them to improve load speed.');
  }

  const pageSizeMB = parseFloat(performance['Page Size']);
  if (!isNaN(pageSizeMB) && pageSizeMB > 1) {
    recommendations.push('Reduce overall page size (compress images, minify code) to improve load speed.');
  }

  const loadTimeSeconds = parseFloat(performance['Estimated Load Time']);
  if (!isNaN(loadTimeSeconds) && loadTimeSeconds > 2.5) {
    recommendations.push('Improve server response time or reduce page weight to speed up load time.');
  }

  // If nothing triggered any rule, the site is in good shape
  if (recommendations.length === 0) {
    recommendations.push('No major issues found. Keep monitoring tracking, SEO, and performance regularly.');
  }

  return recommendations;
}

module.exports = { generateRecommendations };
