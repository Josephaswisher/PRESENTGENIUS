/**
 * QRCodeErrorBoundary Component
 * Error boundary wrapper for QRCodeDisplay with fallback UI
 *
 * Features:
 * - Catches QR code generation errors
 * - Provides fallback UI with manual code entry
 * - Retry mechanism
 * - Network error handling
 */

import React, { Component, ReactNode } from 'react';
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ClipboardDocumentIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

interface QRCodeErrorBoundaryProps {
  children: ReactNode;
  onRetry?: () => void;
  sessionCode?: string;
  followUrl?: string;
}

interface QRCodeErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
  copied: boolean;
}

export class QRCodeErrorBoundary extends Component<
  QRCodeErrorBoundaryProps,
  QRCodeErrorBoundaryState
> {
  constructor(props: QRCodeErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<QRCodeErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('QRCode Error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState(prev => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prev.retryCount + 1,
    }));
    this.props.onRetry?.();
  };

  handleCopyCode = async () => {
    if (!this.props.sessionCode) return;

    try {
      await navigator.clipboard.writeText(this.props.sessionCode);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  handleCopyUrl = async () => {
    if (!this.props.followUrl) return;

    try {
      await navigator.clipboard.writeText(this.props.followUrl);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  render() {
    if (this.state.hasError) {
      const { sessionCode, followUrl } = this.props;
      const { error, retryCount, copied } = this.state;

      return (
        <div className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 max-w-md w-full overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-4 bg-red-500/10 border-b border-red-500/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">QR Code Error</h3>
                  <p className="text-sm text-zinc-400">
                    {error?.message || 'Failed to generate QR code'}
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-zinc-300 mb-4">
                  Don't worry! You can still share the session with your audience:
                </p>

                {/* Manual Code Entry */}
                {sessionCode && (
                  <div className="mb-4">
                    <div className="text-zinc-400 text-sm mb-2">Session Code:</div>
                    <div className="flex items-center gap-2 justify-center">
                      <div className="px-4 py-3 bg-zinc-800 rounded-lg border border-zinc-700">
                        <span className="text-3xl font-mono font-bold text-white tracking-widest">
                          {sessionCode}
                        </span>
                      </div>
                      <button
                        onClick={this.handleCopyCode}
                        className="p-3 text-zinc-400 hover:text-cyan-400 transition-colors"
                        title="Copy code"
                      >
                        {copied ? (
                          <CheckIcon className="w-5 h-5 text-green-400" />
                        ) : (
                          <ClipboardDocumentIcon className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* URL */}
                {followUrl && (
                  <div className="mb-4">
                    <div className="text-zinc-400 text-sm mb-2">Or share this URL:</div>
                    <div className="flex items-center gap-2 p-2 bg-zinc-800 rounded-lg border border-zinc-700">
                      <input
                        type="text"
                        value={followUrl}
                        readOnly
                        className="flex-1 bg-transparent text-sm text-zinc-300 outline-none text-center"
                      />
                      <button
                        onClick={this.handleCopyUrl}
                        className="p-1.5 text-zinc-400 hover:text-cyan-400 transition-colors"
                        title="Copy URL"
                      >
                        {copied ? (
                          <CheckIcon className="w-4 h-4 text-green-400" />
                        ) : (
                          <ClipboardDocumentIcon className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Instructions */}
                <div className="p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-lg">
                  <p className="text-xs text-cyan-400">
                    Share the code or URL with your audience to let them follow along on their
                    devices
                  </p>
                </div>
              </div>

              {/* Retry Button */}
              <div className="flex gap-2">
                <button
                  onClick={this.handleRetry}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition-colors"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  Retry QR Code
                  {retryCount > 0 && (
                    <span className="text-xs opacity-75">({retryCount} attempts)</span>
                  )}
                </button>
              </div>

              {/* Debug Info (in development) */}
              {process.env.NODE_ENV === 'development' && error && (
                <details className="mt-4 p-3 bg-zinc-800/50 rounded-lg text-xs">
                  <summary className="cursor-pointer text-zinc-400 hover:text-zinc-300">
                    Error Details (Dev Only)
                  </summary>
                  <div className="mt-2 text-red-400 font-mono">
                    <div className="mb-1">
                      <strong>Error:</strong> {error.message}
                    </div>
                    {error.stack && (
                      <div className="text-zinc-500 whitespace-pre-wrap text-[10px] mt-2 max-h-32 overflow-auto">
                        {error.stack}
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-zinc-800/50 border-t border-zinc-800">
              <p className="text-xs text-zinc-500 text-center">
                This error might be caused by network issues or browser extensions blocking QR code
                generation
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default QRCodeErrorBoundary;
