import React, { useEffect, useState } from 'react';

export default function ScoreRing({ score = 0, size = 'md', showLabel = false, label }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timeout);
  }, [score]);

  const sizeMap = { sm: 80, md: 120, lg: 160 };
  const dimension = sizeMap[size] || 120;
  const strokeWidth = size === 'sm' ? 6 : size === 'lg' ? 12 : 8;
  const radius = (dimension - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedScore / 100) * circumference;

  let colorClass = 'text-rose-500';
  if (score >= 90) colorClass = 'text-green-500';
  else if (score >= 75) colorClass = 'text-blue-500';
  else if (score >= 60) colorClass = 'text-cyan-500';
  else if (score >= 40) colorClass = 'text-amber-500';

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: dimension, height: dimension }}>
        <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${dimension} ${dimension}`}>
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-white/10"
          />
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`transition-all duration-1000 ease-out ${colorClass}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold ${size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-4xl' : 'text-2xl'} text-white`}>
            {Math.round(animatedScore)}
          </span>
        </div>
      </div>
      {showLabel && label && (
        <span className="mt-2 text-sm font-medium text-gray-400">{label}</span>
      )}
    </div>
  );
}
