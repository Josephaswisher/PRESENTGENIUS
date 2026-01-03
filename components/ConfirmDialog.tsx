/**
 * Confirmation Dialog Component
 * Modal dialog with backdrop, keyboard support, and animations
 * Supports success/danger/info variants with themed colors
 */
import React, { useEffect, useCallback } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { useDialogStore, DialogVariant } from '../stores/dialog.store';

const variantConfig: Record<DialogVariant, {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  confirmBg: string;
  confirmHover: string;
  borderColor: string;
}> = {
  success: {
    icon: CheckCircleIcon,
    iconColor: 'text-green-400',
    confirmBg: 'bg-green-600',
    confirmHover: 'hover:bg-green-700',
    borderColor: 'border-green-500/30',
  },
  danger: {
    icon: ExclamationTriangleIcon,
    iconColor: 'text-red-400',
    confirmBg: 'bg-red-600',
    confirmHover: 'hover:bg-red-700',
    borderColor: 'border-red-500/30',
  },
  info: {
    icon: InformationCircleIcon,
    iconColor: 'text-blue-400',
    confirmBg: 'bg-blue-600',
    confirmHover: 'hover:bg-blue-700',
    borderColor: 'border-blue-500/30',
  },
};

export const ConfirmDialog: React.FC = () => {
  const { dialog, closeDialog } = useDialogStore();

  const handleConfirm = useCallback(() => {
    closeDialog(true);
  }, [closeDialog]);

  const handleCancel = useCallback(() => {
    closeDialog(false);
  }, [closeDialog]);

  // Keyboard support
  useEffect(() => {
    if (!dialog.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialog.isOpen, handleConfirm, handleCancel]);

  if (!dialog.isOpen) return null;

  const config = variantConfig[dialog.variant || 'info'];
  const Icon = config.icon;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-message"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className={`
          relative bg-zinc-900 border ${config.borderColor} rounded-2xl shadow-2xl
          max-w-md w-full mx-auto
          animate-in zoom-in-95 slide-in-from-bottom-4 duration-300
        `}
      >
        {/* Content */}
        <div className="p-6">
          {/* Icon & Title */}
          <div className="flex items-start gap-4 mb-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center ${config.iconColor}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3
                id="dialog-title"
                className="text-lg font-semibold text-white mb-2"
              >
                {dialog.title}
              </h3>
              <p
                id="dialog-message"
                className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap"
              >
                {dialog.message}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 justify-end mt-6">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:ring-offset-2 focus:ring-offset-zinc-900"
              autoFocus={dialog.variant === 'danger'}
            >
              {dialog.cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`px-4 py-2 text-sm font-medium text-white ${config.confirmBg} ${config.confirmHover} rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900`}
              autoFocus={dialog.variant !== 'danger'}
            >
              {dialog.confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
