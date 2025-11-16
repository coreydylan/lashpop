'use client';

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export function Dialog({ open = false, onOpenChange, children }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange?.(false)}
      />
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function DialogContent({ children, className, ...props }: DialogContentProps) {
  return (
    <div
      className={cn(
        'relative max-h-[85vh] w-full max-w-2xl overflow-auto rounded-3xl',
        'glass border border-sage/20 p-6 shadow-2xl',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface DialogHeaderProps {
  children?: React.ReactNode;
  onClose?: () => void;
}

export function DialogHeader({ children, onClose }: DialogHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        {children}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-4 p-1 rounded-full hover:bg-dune/10 transition-colors"
        >
          <X className="h-5 w-5 text-dune/60" />
        </button>
      )}
    </div>
  );
}

interface DialogTitleProps {
  children?: React.ReactNode;
}

export function DialogTitle({ children }: DialogTitleProps) {
  return (
    <h2 className="text-2xl font-light text-dune">
      {children}
    </h2>
  );
}

interface DialogDescriptionProps {
  children?: React.ReactNode;
}

export function DialogDescription({ children }: DialogDescriptionProps) {
  return (
    <p className="text-sm text-dune/60 mt-1">
      {children}
    </p>
  );
}

interface DialogFooterProps {
  children?: React.ReactNode;
}

export function DialogFooter({ children }: DialogFooterProps) {
  return (
    <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-sage/10">
      {children}
    </div>
  );
}
