import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-heading font-medium text-charcoal">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-muted">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full rounded-xl border border-blush bg-white px-3.5 py-2 text-sm text-charcoal placeholder:text-charcoal-faded transition-colors duration-150',
              'focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest/20',
              leftIcon && 'pl-10',
              error && 'border-rose focus:border-rose focus:ring-rose/20',
              className
            )}
            {...props}
          />
        </div>
        {error ? (
          <p className="text-xs text-rose font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-charcoal-muted">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
