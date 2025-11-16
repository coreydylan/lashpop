'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, required, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'block text-sm font-medium text-dune mb-1.5',
          className
        )}
        {...props}
      >
        {children}
        {required && <span className="text-terracotta ml-1">*</span>}
      </label>
    );
  }
);

Label.displayName = 'Label';
