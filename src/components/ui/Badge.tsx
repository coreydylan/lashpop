'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'accent';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-gray-800 text-white hover:bg-gray-700',
      secondary: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
      outline: 'text-gray-600 border border-gray-300 hover:bg-gray-50',
      accent: 'bg-orange-200 text-gray-800 hover:bg-orange-300'
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-orange-500',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };