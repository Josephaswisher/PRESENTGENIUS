/**
 * Component Error Boundary
 * Granular error boundary for wrapping individual components
 * Displays inline error with retry button instead of full-page error
 */
import React, { Component, ReactNode } from 'react';
import { ExclamationCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface ComponentErrorBoundaryProps {
  children: ReactNode;
  componentName?: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ComponentErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

export class ComponentErrorBoundary extends Component<
  ComponentErrorBoundaryProps,
  ComponentErrorBoundaryState
> {
  constructor(props: ComponentErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ComponentErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { componentName = 'Component', onError } = this.props;

    console.error(`[${componentName}] Error caught by boundary:`, error, errorInfo);

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Track error count for retry limiting
    this.setState((prevState) => ({
      errorCount: prevState.errorCount + 1,
    }));
  }

  handleRetry = () => {
    // Prevent infinite retry loops
    if (this.state.errorCount >= 3) {
      console.warn('Maximum retry attempts reached');
      return;
    }

    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    const { hasError, error, errorCount } = this.state;
    const { children, componentName = 'Component', fallback } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default inline error display
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <ExclamationCircleIcon className="w-6 h-6 text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-400">
                {componentName} Error
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                {error.message}
              </p>
            </div>
          </div>

          {errorCount < 3 && (
            <button
              onClick={this.handleRetry}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
            >
              <ArrowPathIcon className="w-3 h-3" />
              <span>Retry</span>
            </button>
          )}

          {errorCount >= 3 && (
            <p className="text-xs text-zinc-500 mt-2">
              Maximum retry attempts reached. Please refresh the page.
            </p>
          )}
        </div>
      );
    }

    return children;
  }
}

export default ComponentErrorBoundary;
