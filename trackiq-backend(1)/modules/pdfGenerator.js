/**
 * MODULE 7: PDF REPORT GENERATOR
 * ---------------------------------------
 * Builds a PDF document containing the complete audit report:
 * Website URL, Tracking Report, SEO Report, Performance Report,
 * Marketing Health Score, Recommendations, and Date/Time - per
 * the SRS's Output section.
 */

const PDFDocument = require('pdfkit');

/**
 * Writes one section (e.g. Tracking Report) as a heading followed
 * by label: value lines, plus an optional score line.
 * @param {PDFKit.PDFDocument} doc
 * @param {string} title
 * @param {Object<string,string|number>} resultsObj
 * @param {number} [score]
 */
function renderSection(doc, title, resultsObj, score) {
  doc.fontSize(14).font('Helvetica-Bold').text(title);
  doc.moveDown(0.3);
  doc.fontSize(11).font('Helvetica');

  Object.entries(resultsObj).forEach(([key, value]) => {
    doc.text(`${key}: ${value}`);
  });

  if (score !== undefined) {
    doc.moveDown(0.2);
    doc.font('Helvetica-Bold').text(`Score: ${score} / 100`);
    doc.font('Helvetica');
  }

  doc.moveDown();
}

/**
 * Creates a complete PDF audit report as a PDFDocument.
 * The caller is responsible for piping it to a response or file;
 * this function calls .end() once all content has been added.
 * @param {Object} data - Full audit result: url, tracking, seo, performance, overall, recommendations
 * @returns {PDFKit.PDFDocument}
 */
function createPDFReport(data) {
  const doc = new PDFDocument({ margin: 50 });

  // --- Title ---
  doc.fontSize(20).font('Helvetica-Bold').text('TrackIQ - Website Marketing Audit Report', {
    align: 'center'
  });
  doc.moveDown();

  // --- Website URL & Date/Time ---
  doc.fontSize(11).font('Helvetica').fillColor('#555555');
  doc.text(`Website: ${data.url}`);
  doc.text(`Generated: ${new Date().toLocaleString()}`);
  doc.fillColor('#000000');
  doc.moveDown();

  // --- Marketing Health Score ---
  doc
    .fontSize(16)
    .font('Helvetica-Bold')
    .text(`Marketing Health Score: ${data.overall.score} / 100  (${data.overall.status})`);
  doc.font('Helvetica');
  doc.moveDown();

  // --- Module reports ---
  renderSection(doc, 'Tracking Report', data.tracking.results, data.tracking.score);
  renderSection(doc, 'SEO Report', data.seo.results, data.seo.score);
  renderSection(doc, 'Performance Report', data.performance.metrics, data.performance.score);

  // --- Recommendations ---
  doc.fontSize(14).font('Helvetica-Bold').text('Recommendations');
  doc.moveDown(0.3);
  doc.fontSize(11).font('Helvetica');
  data.recommendations.forEach((rec, i) => {
    doc.text(`${i + 1}. ${rec}`);
  });

  doc.end();
  return doc;
}

module.exports = { createPDFReport };
