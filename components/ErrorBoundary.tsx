/**
 * ErrorBoundary Component
 *
 * Catches React errors and displays a user-friendly error page
 * instead of crashing the entire app to a blank screen.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // TODO: Send error to error reporting service (Sentry, etc.)
    // reportError(error, errorInfo);
  }

  handleReload = () => {
    // Reset error state and reload the page
    window.location.reload();
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border-b border-zinc-800 px-8 py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-500/10 rounded-xl">
                  <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Something went wrong
                  </h1>
                  <p className="text-zinc-400 mt-1">
                    The application encountered an unexpected error
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-8 py-6 space-y-6">
              {/* Error Message */}
              <div>
                <p className="text-zinc-300 leading-relaxed">
                  We apologize for the inconvenience. The app has encountered an error and couldn't continue.
                  Your work may not have been saved.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleReload}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-xl transition-colors"
                >
                  <ArrowPathIcon className="w-5 h-5" />
                  Reload Application
                </button>
                <button
                  onClick={this.toggleDetails}
                  className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl transition-colors"
                >
                  {this.state.showDetails ? 'Hide Details' : 'Show Error Details'}
                </button>
              </div>

              {/* Error Details (Developer Info) */}
              {this.state.showDetails && (
                <div className="mt-6 space-y-4">
                  <div className="bg-zinc-950 rounded-lg p-4 border border-zinc-800">
                    <h3 className="text-sm font-semibold text-red-400 mb-2">
                      Error Message
                    </h3>
                    <pre className="text-xs text-zinc-400 whitespace-pre-wrap break-words font-mono">
                      {this.state.error?.toString()}
                    </pre>
                  </div>

                  {this.state.errorInfo && (
                    <div className="bg-zinc-950 rounded-lg p-4 border border-zinc-800">
                      <h3 className="text-sm font-semibold text-red-400 mb-2">
                        Component Stack
                      </h3>
                      <pre className="text-xs text-zinc-400 whitespace-pre-wrap break-words font-mono overflow-x-auto max-h-64">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Help Text */}
              <div className="pt-4 border-t border-zinc-800">
                <p className="text-sm text-zinc-500">
                  If this problem persists, please try:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-zinc-400 list-disc list-inside">
                  <li>Clearing your browser cache and cookies</li>
                  <li>Using a different browser</li>
                  <li>Checking your internet connection</li>
                  <li>Contacting support if the issue continues</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
