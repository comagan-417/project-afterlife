import React from 'react';

export default function EvidenceIndicator({ level, showLabel = true }) {
  const config = {
    A: { color: 'bg-green-500', label: 'Verified' },
    B: { color: 'bg-blue-500', label: 'Documented' },
    C: { color: 'bg-amber-500', label: 'Described' },
    D: { color: 'bg-rose-500', label: 'Claimed' }
  };

  const current = config[level] || config.D;

  return (
    <div className="flex items-center space-x-2">
      <span className={`block w-2.5 h-2.5 rounded-full ${current.color}`} />
      {showLabel && <span className="text-sm text-gray-300">{current.label}</span>}
    </div>
  );
}
