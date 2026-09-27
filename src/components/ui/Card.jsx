import React from 'react';

export default function Card({ className = '', children, hover = false, onClick, ...props }) {
  const baseStyles = 'bg-white/5 border border-white/10 rounded-xl p-6';
  const hoverStyles = hover ? 'hover:bg-white/8 hover:border-white/20 transition-all cursor-pointer' : '';

  return (
    <div 
      className={`${baseStyles} ${hoverStyles} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}
