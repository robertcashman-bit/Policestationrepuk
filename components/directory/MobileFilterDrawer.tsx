'use client';

import { useEffect } from 'react';

interface MobileFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function MobileFilterDrawer({ open, onClose, children }: MobileFilterDrawerProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div className="absolute inset-y-0 left-0 flex w-full max-w-sm flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="font-bold text-[var(--navy)]">Filters</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close filters"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
        <div className="border-t border-slate-100 p-4">
          <button
            type="button"
            onClick={onClose}
            className="btn-gold w-full !min-h-[44px]"
          >
            Show results
          </button>
        </div>
      </div>
    </div>
  );
}
