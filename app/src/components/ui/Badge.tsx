'use client';

import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-panel border-border text-text-secondary',
    primary: 'bg-primary/20 border-primary text-primary',
    secondary: 'bg-secondary/20 border-secondary text-secondary',
    success: 'bg-success/20 border-success text-success',
    warning: 'bg-warning/20 border-warning text-warning',
    danger: 'bg-danger/20 border-danger text-danger',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
