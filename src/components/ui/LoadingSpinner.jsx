import React from 'react';

const sizes = { sm: 'h-4 w-4 border-2', md: 'h-8 w-8 border-3', lg: 'h-12 w-12 border-4' };

export default function LoadingSpinner({ size = 'md', text, fullscreen, fullScreen }) {
  const isFullscreen = fullscreen || fullScreen;
  
  const spinner = (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div className={`animate-spin rounded-full border-blue-500 border-t-transparent ${sizes[size] || sizes.md}`}></div>
      {text && <span className="text-gray-300 text-sm font-medium">{text}</span>}
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0a0f1e] z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}
