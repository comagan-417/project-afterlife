import React from 'react';

export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white/5 border border-white/10 rounded-xl border-dashed">
      {icon && (
        <div className="mb-4 text-4xl text-gray-500">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-400 max-w-md mb-6">{description}</p>
      )}
      {action && (
        <div>{action}</div>
      )}
    </div>
  );
}
