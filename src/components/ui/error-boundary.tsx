"use client";

import * as React from "react";
import { AlertCircle, RotateCcw, RefreshCw } from "lucide-react";
import { Button } from "./button";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode | ((error: Error, reset: () => void) => React.ReactNode);
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: (Error & { digest?: string }) | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary caught error]:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (typeof this.props.fallback === "function") {
        return this.props.fallback(this.state.error, this.reset);
      }
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return <ErrorState error={this.state.error} reset={this.reset} />;
    }
    return this.props.children;
  }
}

export interface ErrorStateProps {
  error: Error & { digest?: string };
  reset?: () => void;
}

export function ErrorState({ error, reset }: ErrorStateProps) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50/50 p-6 text-center my-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mb-3">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-red-900">Module encountered an issue</h3>
      <p className="mt-1 text-sm text-red-700 max-w-lg font-mono text-xs bg-red-100/60 p-2.5 rounded border border-red-200">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <div className="mt-4 flex gap-2">
        {reset && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => reset()}
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        )}
        <Button
          variant="default"
          size="sm"
          onClick={() => window.location.reload()}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Reload Page
        </Button>
      </div>
    </div>
  );
}
