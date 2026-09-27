const CRITERIA = [
  { id: 'problem_relevance',       weight: 12 },
  { id: 'solution_quality',        weight: 10 },
  { id: 'innovation',              weight: 10 },
  { id: 'technical_implementation',weight: 15 },
  { id: 'prototype_completeness',  weight: 10 },
  { id: 'feasibility',             weight: 10 },
  { id: 'validation',              weight: 10 },
  { id: 'scalability',             weight:  6 },
  { id: 'social_impact',           weight:  6 },
  { id: 'industry_potential',      weight:  5 },
  { id: 'documentation',           weight:  3 },
  { id: 'deployment_readiness',    weight:  3 },
]

const SCORE_BANDS = [
  { min: 90, max: 100, label: 'Highly Developed Evidence' },
  { min: 75, max: 89,  label: 'Strong Development Evidence' },
  { min: 60, max: 74,  label: 'Promising — Requires Development' },
  { min: 40, max: 59,  label: 'Early Development' },
  { min: 0,  max: 39,  label: 'Insufficient Evidence / Early Stage' },
]

function calculateScore(criteriaScores) {
  let totalWeightedScore = 0;
  let totalPossibleWeight = 0;
  let validCriteriaCount = 0;
  const breakdown = [];

  for (const crit of CRITERIA) {
    const scoreData = criteriaScores[crit.id];
    let score = scoreData ? scoreData.rubric_score : 0;
    
    if (score < 0) score = 0;
    if (score > 5) score = 5;

    const weightedScore = (score / 5) * crit.weight;
    totalWeightedScore += weightedScore;
    totalPossibleWeight += crit.weight;
    
    if (score > 0) validCriteriaCount++;

    breakdown.push({
      id: crit.id,
      score: score,
      weighted_score: Number(weightedScore.toFixed(2)),
      max_weighted_score: crit.weight,
      evidence: scoreData ? scoreData.evidence : 'No evidence provided',
      evidence_source: scoreData ? scoreData.evidence_source : null,
      evidence_level: scoreData ? scoreData.evidence_level : 'D',
      strength: scoreData ? scoreData.strength : '',
      weakness: scoreData ? scoreData.weakness : '',
      recommendation: scoreData ? scoreData.recommendation : '',
      confidence: scoreData ? scoreData.confidence : 'Low'
    });
  }

  // totalWeightedScore is already out of 100 since weights sum to 100
  // Formula: criterion_score = (rubric_score / 5) * weight  →  sum = final score out of 100
  const final_score = Number(totalWeightedScore.toFixed(1));
  const display_score = Math.round(final_score);
  
  let score_band = SCORE_BANDS[SCORE_BANDS.length - 1];
  for (const band of SCORE_BANDS) {
    if (display_score >= band.min && display_score <= band.max) {
      score_band = band;
      break;
    }
  }

  const evidence_coverage = (validCriteriaCount / CRITERIA.length) * 100;
  
  let confidence = 'Low';
  if (evidence_coverage >= 80) confidence = 'High';
  else if (evidence_coverage >= 50) confidence = 'Medium';

  return {
    final_score: final_score,
    display_score: display_score,
    breakdown: breakdown,
    evidence_coverage: evidence_coverage,
    confidence: confidence,
    score_band: score_band.label,
    scoring_version: '1.0.0',
    calculated_at: new Date().toISOString()
  };
}

module.exports = { calculateScore, CRITERIA }
