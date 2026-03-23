
import React from 'react';
import ReactDOM from 'react-dom';
import { cn } from '../../lib/utils';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, children, title, description }) => {
  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Use Portal to render at document body level (avoids z-index stacking context issues)
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      {/* 1. Glass Backdrop Layer */}
      <div
        className="absolute inset-0 bg-black/40 transition-all duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 2. Modal Content Layer (Stays sharp, no blur inheritance) */}
      <div
        className={cn(
          "relative z-10 w-full max-w-md m-4 rounded-xl bg-white border border-slate-200 shadow-2xl flex flex-col scale-100 opacity-100",
          "animate-in fade-in-0 zoom-in-95"
        )}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex flex-col space-y-1.5 p-6 pb-4"
        >
          {title && (
            <h3 className="text-xl font-semibold leading-none tracking-tight" style={{ color: 'var(--text-heading)' }}>
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
              {description}
            </p>
          )}
        </div>

        <div className="p-6 pt-0 overflow-y-auto max-h-[80vh]">
          {children}
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white transition-all duration-200 shadow-lg"
          style={{ color: 'var(--text-secondary)' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>,
    document.body
  );
};

export default Dialog;