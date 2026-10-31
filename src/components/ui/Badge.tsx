import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'forest' | 'rose' | 'gold' | 'blush' | 'outline' | 'slate';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'forest',
  size = 'md',
  children,
  ...props
}) => {
  const variants = {
    forest: 'bg-forest/10 text-forest border-forest/15',
    rose: 'bg-rose/15 text-rose hover:bg-rose/20 border-rose/20',
    gold: 'bg-gold/20 text-charcoal border-gold/30',
    blush: 'bg-blush/50 text-charcoal-muted border-blush-border',
    slate: 'bg-charcoal/10 text-charcoal border-charcoal/20',
    outline: 'border border-blush text-charcoal-muted bg-transparent',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 tracking-wider uppercase font-semibold rounded-full',
    md: 'text-xs px-2.5 py-1 font-medium rounded-full',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center border font-sans select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
