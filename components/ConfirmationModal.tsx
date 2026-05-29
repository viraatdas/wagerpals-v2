'use client';

import { useEffect } from 'react';

export type ConfirmationType = 'danger' | 'warning' | 'success';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmationType;
  loading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  loading = false,
}: ConfirmationModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, loading]);

  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      icon: '🗑️',
      iconBg: 'bg-neon-rose/10 border border-neon-rose/25',
      iconColor: 'text-neon-rose',
      confirmBg: 'bg-neon-rose/15 border border-neon-rose/40 text-neon-rose hover:bg-neon-rose/25 hover:shadow-glow-rose focus:ring-neon-rose/40',
    },
    warning: {
      icon: '⚠️',
      iconBg: 'bg-neon-amber/10 border border-neon-amber/25',
      iconColor: 'text-neon-amber',
      confirmBg: 'bg-neon-amber/15 border border-neon-amber/40 text-neon-amber hover:bg-neon-amber/25 focus:ring-neon-amber/40',
    },
    success: {
      icon: '✓',
      iconBg: 'bg-neon-mint/10 border border-neon-mint/25',
      iconColor: 'text-neon-mint',
      confirmBg: 'bg-neon-mint/15 border border-neon-mint/40 text-neon-mint hover:bg-neon-mint/25 hover:shadow-glow-mint focus:ring-neon-mint/40',
    },
  };

  const styles = typeStyles[type];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={loading ? undefined : onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative glass-strong rounded-3xl max-w-md w-full transform transition-all animate-slide-up overflow-hidden">
          {/* Icon */}
          <div className="flex items-center justify-center pt-6">
            <div className={`${styles.iconBg} ${styles.iconColor} rounded-full w-16 h-16 flex items-center justify-center`}>
              <span className="text-3xl">{styles.icon}</span>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 text-center">
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">
              {title}
            </h3>
            <p className="text-muted">
              {message}
            </p>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="btn-glass flex-1 px-4 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-0"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 px-4 py-2.5 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-offset-0 ${styles.confirmBg}`}
            >
              {loading ? 'Processing...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

