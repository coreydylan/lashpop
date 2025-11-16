'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            'w-full appearance-none rounded-2xl px-4 py-2.5 pr-10',
            'bg-cream/50 border border-sage/20',
            'text-dune text-sm',
            'hover:border-dusty-rose/30 focus:border-dusty-rose focus:outline-none focus:ring-2 focus:ring-dusty-rose/20',
            'transition-all cursor-pointer',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dune/40 pointer-events-none" />
      </div>
    );
  }
);

Select.displayName = 'Select';
