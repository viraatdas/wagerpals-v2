'use client';

import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  type?: ToastType;
  duration?: number;
}

export default function Toast({
  isOpen,
  onClose,
  message,
  type = 'info',
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose, duration]);

  if (!isOpen) return null;

  const typeStyles = {
    success: {
      icon: '✓',
      borderColor: 'border-neon-mint/30',
      textColor: 'text-neon-mint',
      iconBg: 'bg-neon-mint/15',
    },
    error: {
      icon: '✕',
      borderColor: 'border-neon-rose/30',
      textColor: 'text-neon-rose',
      iconBg: 'bg-neon-rose/15',
    },
    warning: {
      icon: '⚠',
      borderColor: 'border-neon-amber/30',
      textColor: 'text-neon-amber',
      iconBg: 'bg-neon-amber/15',
    },
    info: {
      icon: 'ℹ',
      borderColor: 'border-neon-cyan/30',
      textColor: 'text-neon-cyan',
      iconBg: 'bg-neon-cyan/15',
    },
  };

  const styles = typeStyles[type];

  return (
    <div className="fixed left-4 right-4 top-4 z-50 animate-fade-in sm:left-auto">
      <div className={`glass-strong ${styles.borderColor} border rounded-2xl p-4 max-w-md flex items-start gap-3`}>
        <div className={`${styles.iconBg} rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0`}>
          <span className={`${styles.textColor} font-semibold text-lg`}>{styles.icon}</span>
        </div>
        <div className="flex-1">
          <p className="text-foreground">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-muted-2 hover:text-foreground transition-colors flex-shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
