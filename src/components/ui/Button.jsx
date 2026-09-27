import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  href,
  to,
  type = 'button',
  className = '',
  children,
  icon,
  ...props
}) {
  const navigate = useNavigate();
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-navy-900 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
  
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white focus:ring-blue-500',
    secondary: 'bg-white/10 hover:bg-white/20 text-white border border-white/20 focus:ring-white/50',
    ghost: 'bg-transparent hover:bg-white/5 text-gray-300 focus:ring-white/20',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white focus:ring-rose-500',
    outline: 'border border-blue-500 text-blue-400 hover:bg-blue-500/10 focus:ring-blue-500'
  };

  const sizes = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-3'
  };

  const handleClick = (e) => {
    if (onClick) onClick(e);
    const destination = href || to;
    if (destination) {
      if (destination.startsWith('http')) {
        window.open(destination, '_blank');
      } else {
        navigate(destination);
      }
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {!loading && icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
}
