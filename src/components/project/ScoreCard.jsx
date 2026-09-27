import React, { useState } from 'react';
import ScoreRing from '@/components/ui/ScoreRing';
import Badge from '@/components/ui/Badge';
import CriterionRow from '@/components/project/CriterionRow';
import { getConfidenceStyle } from '@/utils/helpers';
import { Info } from 'lucide-react';

export default function ScoreCard({ scoreData }) {
  const [expandedRows, setExpandedRows] = useState({});

  if (!scoreData) return null;

  const toggleRow = (index) => {
    setExpandedRows(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const overallScore = scoreData.overallScore ?? scoreData.final_score ?? scoreData.display_score ?? scoreData.totalScore ?? 0;
  const evidenceCoverage = scoreData.evidenceCoverage ?? scoreData.evidence_coverage ?? 0;
  const scoreBand = scoreData.scoreBand || scoreData.score_band || 'Evaluated';
  const confidenceLevel = scoreData.confidenceLevel || scoreData.confidence || 'MEDIUM';
  const breakdown = scoreData.breakdown || [];

  const confidenceStyle = getConfidenceStyle(confidenceLevel);

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden flex flex-col w-full">
      <div className="p-6 md:p-8 bg-navy-800 border-b border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <ScoreRing score={overallScore} size="lg" showLabel={true} label="Overall Score" />
          <div className="space-y-4 text-center md:text-left">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">{scoreBand}</h2>
              <p className="text-gray-400 max-w-sm">
                Score calculated by deterministic engine based on evidence.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <Badge variant="blue">Evidence Coverage: {evidenceCoverage}%</Badge>
              <Badge className={confidenceStyle}>Confidence: {confidenceLevel}</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {breakdown && breakdown.length > 0 ? (
          <div className="flex flex-col">
            {breakdown.map((criterion, idx) => (
              <CriterionRow 
                key={idx}
                criterion={criterion}
                isExpanded={!!expandedRows[idx]}
                onToggle={() => toggleRow(idx)}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500 flex items-center justify-center">
            <Info className="w-5 h-5 mr-2" />
            No criterion breakdown available.
          </div>
        )}
      </div>
    </div>
  );
}
