import React from 'react';
import { LIFECYCLE_STAGES } from '@/utils/constants';

export default function LifecycleTimeline({ stages = LIFECYCLE_STAGES, currentStage, events = [] }) {
  const stageLabels = (Array.isArray(stages) ? stages : LIFECYCLE_STAGES).map(s => 
    typeof s === 'string' ? s : (s?.label || s?.value || String(s || ''))
  );
  
  const currentStageStr = typeof currentStage === 'string' ? currentStage : (currentStage?.label || currentStage?.value || 'Submitted');
  const currentIndex = Math.max(0, stageLabels.findIndex(s => s.toLowerCase() === currentStageStr.toLowerCase()));

  return (
    <div className="relative border-l border-white/10 ml-3 md:ml-4 py-2">
      {stageLabels.map((stageName, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        
        const stageEvent = events.find(e => e.stage === stageName);

        return (
          <div key={stageName} className="mb-8 last:mb-0 relative pl-6 md:pl-8">
            <div className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full ${
              isCompleted ? 'bg-green-500' :
              isCurrent ? 'bg-blue-500 animate-pulse' :
              'bg-gray-600'
            }`} />

            <div className="flex flex-col">
              <h4 className={`text-sm font-semibold ${
                isCompleted ? 'text-green-400' :
                isCurrent ? 'text-blue-400' :
                'text-gray-400'
              }`}>
                {stageName}
              </h4>
              
              {stageEvent && stageEvent.timestamp && (
                <span className="text-xs text-gray-500 mt-0.5">
                  {new Date(stageEvent.timestamp).toLocaleDateString()}
                </span>
              )}
              
              {stageEvent && stageEvent.note && (
                <p className="text-sm text-gray-300 mt-2 bg-white/5 p-3 rounded-lg border border-white/10">
                  {stageEvent.note}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
