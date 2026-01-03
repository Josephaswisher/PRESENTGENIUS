/**
 * Input Dialog Component
 * Modal dialog for text/number/URL input with validation
 * Auto-focuses on open, supports keyboard navigation
 */
import React, { useEffect, useCallback, useRef } from 'react';
import {
  PencilSquareIcon,
  HashtagIcon,
  LinkIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { useInputDialogStore, InputType } from '../stores/input-dialog.store';

const inputTypeConfig: Record<InputType, {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  inputType: string;
  pattern?: string;
}> = {
  text: {
    icon: PencilSquareIcon,
    iconColor: 'text-blue-400',
    inputType: 'text',
  },
  number: {
    icon: HashtagIcon,
    iconColor: 'text-green-400',
    inputType: 'number',
  },
  url: {
    icon: LinkIcon,
    iconColor: 'text-purple-400',
    inputType: 'url',
    pattern: 'https?://.+',
  },
  email: {
    icon: EnvelopeIcon,
    iconColor: 'text-cyan-400',
    inputType: 'email',
  },
};

export const InputDialog: React.FC = () => {
  const { dialog, closeInputDialog, setValue, setError } = useInputDialogStore();
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when dialog opens
  useEffect(() => {
    if (dialog.isOpen && inputRef.current) {
      // Small delay to ensure animation has started
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [dialog.isOpen]);

  const handleConfirm = useCallback(() => {
    const { value, validator } = dialog;

    // Run validation if provided
    if (validator) {
      const errorMessage = validator(value);
      if (errorMessage) {
        setError(errorMessage);
        return;
      }
    }

    // Basic validation for specific types
    if (dialog.type === 'url' && value && !value.match(/^https?:\/\/.+/)) {
      setError('Please enter a valid URL (starting with http:// or https://)');
      return;
    }

    if (dialog.type === 'email' && value && !value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Please enter a valid email address');
      return;
    }

    closeInputDialog(value || null);
  }, [dialog, closeInputDialog, setError]);

  const handleCancel = useCallback(() => {
    closeInputDialog(null);
  }, [closeInputDialog]);

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

  const config = inputTypeConfig[dialog.type || 'text'];
  const Icon = config.icon;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="input-dialog-title"
      aria-describedby={dialog.message ? "input-dialog-message" : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className="
          relative bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl
          max-w-md w-full mx-auto
          animate-in zoom-in-95 slide-in-from-bottom-4 duration-300
        "
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
                id="input-dialog-title"
                className="text-lg font-semibold text-white mb-1"
              >
                {dialog.title}
              </h3>
              {dialog.message && (
                <p
                  id="input-dialog-message"
                  className="text-sm text-zinc-400 leading-relaxed"
                >
                  {dialog.message}
                </p>
              )}
            </div>
          </div>

          {/* Input Field */}
          <div className="mb-4">
            <input
              ref={inputRef}
              type={config.inputType}
              value={dialog.value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={dialog.placeholder}
              pattern={config.pattern}
              className={`
                w-full px-4 py-3 bg-zinc-800 border rounded-lg text-white placeholder-zinc-500
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900
                transition-colors
                ${dialog.error
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-zinc-700 focus:border-zinc-600 focus:ring-blue-500'
                }
              `}
              aria-invalid={!!dialog.error}
              aria-describedby={dialog.error ? "input-error" : undefined}
            />
            {dialog.error && (
              <p
                id="input-error"
                className="mt-2 text-sm text-red-400 flex items-center gap-2"
                role="alert"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{dialog.error}</span>
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 justify-end">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:ring-offset-2 focus:ring-offset-zinc-900"
            >
              {dialog.cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
            >
              {dialog.confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputDialog;
