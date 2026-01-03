/**
 * Toast Container Component
 * Displays toast notifications in the top-right corner
 */
import React from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useToastStore, Toast, ToastType } from '../stores/toast.store';

const ToastIcon: React.FC<{ type: ToastType }> = ({ type }) => {
  const className = "w-5 h-5 flex-shrink-0";

  switch (type) {
    case 'success':
      return <CheckCircleIcon className={`${className} text-green-400`} />;
    case 'error':
      return <XCircleIcon className={`${className} text-red-400`} />;
    case 'info':
      return <InformationCircleIcon className={`${className} text-blue-400`} />;
  }
};

const ToastItem: React.FC<{ toast: Toast }> = ({ toast }) => {
  const removeToast = useToastStore((state) => state.removeToast);

  const colorClasses = {
    success: 'border-green-500/30 bg-green-500/10',
    error: 'border-red-500/30 bg-red-500/10',
    info: 'border-blue-500/30 bg-blue-500/10',
  };

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl
        ${colorClasses[toast.type]}
        shadow-lg shadow-black/20
        animate-in slide-in-from-right-full duration-300
        max-w-md w-full
      `}
      onClick={() => removeToast(toast.id)}
      role="alert"
      aria-live="polite"
    >
      <ToastIcon type={toast.type} />

      <div className="flex-1 text-sm text-zinc-100 leading-relaxed break-words">
        {toast.message}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          removeToast(toast.id);
        }}
        className="flex-shrink-0 p-0.5 hover:bg-white/10 rounded transition-colors"
        aria-label="Close notification"
      >
        <XMarkIcon className="w-4 h-4 text-zinc-400 hover:text-white" />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const toasts = useToastStore((state) => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-auto"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
};
