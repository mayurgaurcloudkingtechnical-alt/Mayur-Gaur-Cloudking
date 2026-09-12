"use client";

import * as React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "./button";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset?: () => void;
}

export function ErrorState({ error, reset }: ErrorBoundaryProps) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50/50 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mb-3">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-red-900">Something went wrong</h3>
      <p className="mt-1 text-sm text-red-600 max-w-md">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      {reset && (
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => reset()}
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
