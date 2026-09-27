/**
 * Deterministic Scoring Engine
 *
 * The LLM provides rubric_scores (0–5) and evidence text per criterion.
 * This engine applies the fixed weights and calculates:
 *   - criterion_scores (weighted)
 *   - final_score (sum of weighted criterion scores)
 *   - evidence_coverage (%)
 *   - confidence (HIGH / MEDIUM / LOW)
 *
 * The LLM cannot override this engine's output.
 */

import { SCORING_CRITERIA, SCORE_BANDS } from './constants.js'

/**
 * Calculate a single criterion's weighted score.
 * @param {number} rubricScore  0–5
 * @param {number} weight       criterion weight
 * @returns {number}            weighted score (decimal)
 */
export function calcCriterionScore(rubricScore, weight) {
  const clamped = Math.max(0, Math.min(5, rubricScore))
  return parseFloat(((clamped / 5) * weight).toFixed(2))
}

/**
 * Main scoring engine.
 *
 * @param {Object} criteriaScores  { criterion_id: { rubric_score, evidence, evidence_source, evidence_level, strength, weakness, recommendation, confidence } }
 * @param {Object} evidenceMap     { criterion_id: boolean } — whether evidence was found
 * @returns {Object}               complete score breakdown
 */
export function calculateScore(criteriaScores) {
  if (!criteriaScores || typeof criteriaScores !== 'object') {
    throw new Error('criteriaScores must be an object')
  }

  const breakdown = []
  let totalScore = 0
  let evidenceCount = 0
  let weightedEvidenceScore = 0

  for (const criterion of SCORING_CRITERIA) {
    const input = criteriaScores[criterion.id] || {}
    const rubricScore = typeof input.rubric_score === 'number'
      ? input.rubric_score
      : 0

    const criterionScore = calcCriterionScore(rubricScore, criterion.weight)
    totalScore += criterionScore

    // Evidence coverage: evidence_level A or B = full coverage, C = partial, D or missing = none
    const level = input.evidence_level || 'D'
    let coverage = 0
    if (level === 'A')      coverage = 1.0
    else if (level === 'B') coverage = 0.8
    else if (level === 'C') coverage = 0.5
    else                    coverage = 0.1

    evidenceCount     += coverage
    weightedEvidenceScore += coverage * criterion.weight

    breakdown.push({
      criterion_id:    criterion.id,
      label:           criterion.label,
      weight:          criterion.weight,
      rubric_score:    rubricScore,
      criterion_score: criterionScore,
      evidence:        input.evidence        || null,
      evidence_source: input.evidence_source || null,
      evidence_level:  level,
      strength:        input.strength        || null,
      weakness:        input.weakness        || null,
      recommendation:  input.recommendation  || null,
      confidence:      input.confidence      || 'LOW',
    })
  }

  const finalScore = parseFloat(totalScore.toFixed(1))
  const evidenceCoverage = parseFloat(
    ((weightedEvidenceScore / 100) * 100).toFixed(1)
  )

  // Confidence
  let confidence
  if (evidenceCoverage >= 70)      confidence = 'HIGH'
  else if (evidenceCoverage >= 45) confidence = 'MEDIUM'
  else                             confidence = 'LOW'

  // Score band
  const band = SCORE_BANDS.find(b => finalScore >= b.min && finalScore <= b.max)
    || SCORE_BANDS[SCORE_BANDS.length - 1]

  return {
    final_score:       finalScore,
    display_score:     Math.round(finalScore),
    breakdown,
    evidence_coverage: evidenceCoverage,
    confidence,
    score_band:        band.label,
    score_band_color:  band.color,
    scoring_version:   '1.0.0',
    calculated_at:     new Date().toISOString(),
  }
}

/**
 * Calculate the potential score improvement if all weak criteria are improved.
 */
export function calculateImprovementPotential(scoreResult) {
  const improvements = []

  for (const item of scoreResult.breakdown) {
    const maxScore = item.weight
    const gap = maxScore - item.criterion_score

    if (gap >= 1 && item.recommendation) {
      improvements.push({
        criterion_id:       item.criterion_id,
        label:              item.label,
        current_score:      item.criterion_score,
        max_score:          item.weight,
        gap,
        gap_percentage:     parseFloat(((gap / item.weight) * 100).toFixed(1)),
        recommendation:     item.recommendation,
        evidence_level:     item.evidence_level,
      })
    }
  }

  // Sort by largest gap first
  improvements.sort((a, b) => b.gap - a.gap)

  const totalGap = improvements.reduce((s, i) => s + i.gap, 0)

  return {
    improvements,
    total_potential_gain: parseFloat(totalGap.toFixed(1)),
    current_score: scoreResult.final_score,
    potential_score: Math.min(100, parseFloat((scoreResult.final_score + totalGap).toFixed(1))),
  }
}

/**
 * Compare two score versions to show delta.
 */
export function compareScoreVersions(previousScore, currentScore) {
  const delta = parseFloat((currentScore.final_score - previousScore.final_score).toFixed(1))
  const changedCriteria = []

  for (const curr of currentScore.breakdown) {
    const prev = previousScore.breakdown.find(b => b.criterion_id === curr.criterion_id)
    if (prev && Math.abs(curr.criterion_score - prev.criterion_score) >= 0.1) {
      changedCriteria.push({
        criterion_id:   curr.criterion_id,
        label:          curr.label,
        previous_score: prev.criterion_score,
        current_score:  curr.criterion_score,
        delta:          parseFloat((curr.criterion_score - prev.criterion_score).toFixed(2)),
      })
    }
  }

  return {
    previous_score:   previousScore.final_score,
    current_score:    currentScore.final_score,
    delta,
    improved:         delta > 0,
    changed_criteria: changedCriteria,
  }
}
