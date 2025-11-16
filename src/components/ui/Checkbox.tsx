'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, ...props }, ref) => {
    const checkboxId = props.id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="checkbox"
            ref={ref}
            id={checkboxId}
            className={cn(
              'peer sr-only',
              className
            )}
            {...props}
          />
          <label
            htmlFor={checkboxId}
            className={cn(
              'flex h-5 w-5 items-center justify-center rounded border-2 border-sage/30',
              'cursor-pointer transition-all',
              'peer-checked:bg-dusty-rose peer-checked:border-dusty-rose',
              'peer-disabled:opacity-50 peer-disabled:cursor-not-allowed',
              'hover:border-dusty-rose/50'
            )}
          >
            <Check className="h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100" />
          </label>
        </div>
        {label && (
          <label
            htmlFor={checkboxId}
            className="text-sm text-dune cursor-pointer select-none"
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
