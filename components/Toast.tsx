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
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconBg: 'bg-green-100',
    },
    error: {
      icon: '✕',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconBg: 'bg-red-100',
    },
    warning: {
      icon: '⚠',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      iconBg: 'bg-yellow-100',
    },
    info: {
      icon: 'ℹ',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconBg: 'bg-blue-100',
    },
  };

  const styles = typeStyles[type];

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div className={`${styles.bgColor} ${styles.borderColor} border rounded-lg shadow-lg p-4 max-w-md flex items-start gap-3`}>
        <div className={`${styles.iconBg} rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0`}>
          <span className={`${styles.textColor} font-semibold text-lg`}>{styles.icon}</span>
        </div>
        <div className="flex-1">
          <p className={`${styles.textColor} font-light`}>{message}</p>
        </div>
        <button
          onClick={onClose}
          className={`${styles.textColor} hover:opacity-70 transition-opacity flex-shrink-0`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

