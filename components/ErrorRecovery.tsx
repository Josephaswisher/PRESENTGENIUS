/**
 * Error Recovery Component
 * Displays error UI with action buttons for recovery
 * Options: Retry, Go Back, Report, Reload
 */
import React from 'react';
import {
  ArrowPathIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  BugAntIcon,
} from '@heroicons/react/24/outline';

interface ErrorRecoveryProps {
  error: Error;
  onRetry?: () => void;
  onGoBack?: () => void;
  onReport?: () => void;
  showReload?: boolean;
  componentName?: string;
}

export const ErrorRecovery: React.FC<ErrorRecoveryProps> = ({
  error,
  onRetry,
  onGoBack,
  onReport,
  showReload = true,
  componentName = 'Component',
}) => {
  const handleReload = () => {
    window.location.reload();
  };

  const handleReport = () => {
    if (onReport) {
      onReport();
    } else {
      // Default report behavior - copy error to clipboard
      const errorReport = `
Error Report - ${componentName}
Time: ${new Date().toISOString()}
Message: ${error.message}
Stack: ${error.stack || 'No stack trace available'}
User Agent: ${navigator.userAgent}
URL: ${window.location.href}
      `.trim();

      navigator.clipboard.writeText(errorReport).then(() => {
        alert('Error details copied to clipboard. Please share with support.');
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-zinc-900/50 rounded-xl border border-red-500/30">
      {/* Error Icon */}
      <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
        <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />
      </div>

      {/* Error Title */}
      <h3 className="text-xl font-semibold text-white mb-2">
        Something went wrong
      </h3>

      {/* Error Message */}
      <p className="text-sm text-zinc-400 text-center max-w-md mb-1">
        {componentName} encountered an error
      </p>

      {/* Error Details (collapsed by default) */}
      <details className="mt-2 mb-6 max-w-md w-full">
        <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-400 transition-colors select-none">
          Technical details
        </summary>
        <div className="mt-3 p-3 bg-zinc-950 rounded-lg border border-zinc-800">
          <p className="text-xs font-mono text-red-400 break-words">
            {error.message}
          </p>
          {error.stack && (
            <pre className="mt-2 text-[10px] font-mono text-zinc-600 overflow-x-auto whitespace-pre-wrap">
              {error.stack.split('\n').slice(0, 5).join('\n')}
            </pre>
          )}
        </div>
      </details>

      {/* Recovery Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span>Retry</span>
          </button>
        )}

        {onGoBack && (
          <button
            onClick={onGoBack}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        )}

        <button
          onClick={handleReport}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:ring-offset-2 focus:ring-offset-zinc-900"
        >
          <BugAntIcon className="w-4 h-4" />
          <span>Report</span>
        </button>

        {showReload && (
          <button
            onClick={handleReload}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:ring-offset-2 focus:ring-offset-zinc-900"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span>Reload Page</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorRecovery;
