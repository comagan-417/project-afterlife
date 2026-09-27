import React from 'react';
import EvidenceIndicator from '@/components/ui/EvidenceIndicator';
import Badge from '@/components/ui/Badge';
import { CheckCircle2, HelpCircle } from 'lucide-react';

export default function EvidenceCard({ evidence }) {
  if (!evidence) return null;
  
  const { field, value, source, level, verified } = evidence;

  return (
    <div className="bg-navy-800 border border-white/10 rounded-xl p-4 flex flex-col space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{field}</span>
        {verified ? (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        ) : (
          <HelpCircle className="w-4 h-4 text-amber-500" />
        )}
      </div>
      
      <div className="text-sm text-white font-medium break-words">
        {value}
      </div>
      
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
        {source && (
          <Badge variant="blue" size="sm">
            Source: {source}
          </Badge>
        )}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">Level:</span>
          <EvidenceIndicator level={level} />
        </div>
      </div>
    </div>
  );
}
