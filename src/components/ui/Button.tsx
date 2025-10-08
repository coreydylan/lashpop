'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-full font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:pointer-events-none disabled:opacity-50 transform hover:scale-105 active:scale-95';
    
    const variants = {
      primary: 'bg-orange-200 text-gray-800 hover:bg-orange-300 active:bg-orange-400 shadow-sm hover:shadow-md',
      secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200 hover:border-gray-300',
      ghost: 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
    };

    const sizes = {
      sm: 'h-9 px-6 text-sm',
      md: 'h-11 px-8 text-base',
      lg: 'h-12 px-10 text-lg'
    };

    return (
      <button
        ref={ref}
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };