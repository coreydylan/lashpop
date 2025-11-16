'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'w-full rounded-2xl px-4 py-2.5',
          'bg-cream/50 border border-sage/20',
          'text-dune text-sm placeholder:text-dune/40',
          'hover:border-dusty-rose/30 focus:border-dusty-rose focus:outline-none focus:ring-2 focus:ring-dusty-rose/20',
          'transition-all resize-y min-h-[100px]',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-dune/5',
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
