import React from 'react';

export default function Input({
  label,
  error,
  hint,
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled,
  required,
  className = '',
  icon,
  multiline = false,
  rows = 4,
  ...props
}) {
  const baseInputStyles = "w-full bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const paddingStyles = icon ? "pl-10 pr-4 py-2.5" : "px-4 py-2.5";

  return (
    <div className={`flex flex-col space-y-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-gray-200">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            {icon}
          </div>
        )}
        
        {multiline ? (
          <textarea
            value={value}
            onChange={onChange}
            disabled={disabled}
            required={required}
            placeholder={placeholder}
            rows={rows}
            className={`${baseInputStyles} ${paddingStyles} resize-y`}
            {...props}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={onChange}
            disabled={disabled}
            required={required}
            placeholder={placeholder}
            className={`${baseInputStyles} ${paddingStyles}`}
            {...props}
          />
        )}
      </div>

      {error && <p className="text-sm text-rose-400 mt-1">{error}</p>}
      {hint && !error && <p className="text-sm text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}
