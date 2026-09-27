import React from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, HelpCircle } from 'lucide-react';
import EvidenceIndicator from '@/components/ui/EvidenceIndicator';
import Badge from '@/components/ui/Badge';

export default function CriterionRow({ criterion, isExpanded, onToggle }) {
  const name = criterion.name || criterion.label || 'Criterion';
  const score = criterion.score ?? criterion.criterion_score ?? criterion.rubric_score ?? 0;
  const weight = criterion.weight ?? 10;
  const evidenceText = criterion.evidenceText || criterion.evidence || 'Evidence evaluated from project documentation and repository metadata.';
  const source = criterion.source || criterion.evidence_source || 'Project Metadata';
  const level = criterion.evidenceLevel || criterion.evidence_level || 'B';
  const strength = criterion.strength || 'Core framework established.';
  const weakness = criterion.weakness || 'Requires expanded test coverage.';
  const recommendation = criterion.recommendation || 'Add unit tests and hardware integration benchmarks.';
  const confidence = criterion.confidence || 'Medium';

  const ratio = score / weight;
  let barColor = 'bg-rose-500';
  if (ratio > 0.8) barColor = 'bg-green-500';
  else if (ratio >= 0.5) barColor = 'bg-amber-500';

  return (
    <div className="border-b border-white/10 last:border-0">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition gap-2"
        onClick={onToggle}
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0 pr-2">
          {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" /> : <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />}
          <span className="font-medium text-white truncate" title={name}>{name}</span>
        </div>
        
        <div className="flex items-center space-x-4 shrink-0">
          <div className="w-20 md:w-24 h-2 bg-navy-900 rounded-full overflow-hidden shrink-0">
            <div 
              className={`h-full ${barColor}`} 
              style={{ width: `${Math.min(100, Math.max(0, ratio * 100))}%` }}
            />
          </div>
          <span className="text-sm font-bold text-white min-w-[3.5rem] text-right shrink-0">
            {score}/{weight}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 pt-0 pl-12 pr-4 bg-white/[0.02]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 text-sm">
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Evidence</h4>
              <p className="text-gray-200 mb-2">{evidenceText}</p>
              {source && (
                <div className="inline-flex items-center px-2 py-1 bg-white/10 rounded text-xs text-blue-400 mb-3">
                  Source: {source}
                </div>
              )}
              <div className="flex items-center space-x-4">
                <span className="text-gray-400 text-xs">Level:</span>
                <EvidenceIndicator level={level} />
                <Badge className="bg-navy-900 text-gray-400 text-[10px]">Confidence: {confidence}</Badge>
              </div>
            </div>
            
            <div className="space-y-3">
              {strength && (
                <div>
                  <h4 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-1 flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Strength
                  </h4>
                  <p className="text-gray-300">{strength}</p>
                </div>
              )}
              {weakness && (
                <div>
                  <h4 className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-1 flex items-center">
                    <HelpCircle className="w-3 h-3 mr-1" /> Weakness
                  </h4>
                  <p className="text-gray-300">{weakness}</p>
                </div>
              )}
              {recommendation && (
                <div>
                  <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">Recommendation</h4>
                  <p className="text-gray-300">{recommendation}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
