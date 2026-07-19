/**
 * MODULE 5: MARKETING SCORE GENERATOR
 * ---------------------------------------
 * Combines the three module scores (Tracking, SEO, Performance)
 * into one Overall Marketing Health Score, and assigns a status
 * label using the SRS's "Conditional Logic" algorithm
 * (Excellent / Good / Average / Poor).
 */

/**
 * Combines individual module scores into an overall score + status.
 * @param {number} trackingScore
 * @param {number} seoScore
 * @param {number} performanceScore
 * @returns {{overallScore: number, status: string}}
 */
function generateOverallScore(trackingScore, seoScore, performanceScore) {
  // Overall Score: simple average of the three module scores.
  // Matches the SRS's own example: (85 + 90 + 80) / 3 = 85.
  const overallScore = Math.round((trackingScore + seoScore + performanceScore) / 3);

  // Website Status, based on the Overall Score
  let status;
  if (overallScore >= 90) status = 'Excellent';
  else if (overallScore >= 75) status = 'Good';
  else if (overallScore >= 50) status = 'Average';
  else status = 'Poor';

  return { overallScore, status };
}

module.exports = { generateOverallScore };
