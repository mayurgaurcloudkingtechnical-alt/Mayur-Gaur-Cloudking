import React, { Suspense } from "react";
import { AdminPlacementsView } from "@/components/admin/placements/admin-placements-view";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function AdminPlacementsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading Placement & Hiring Command..." />
        </div>
      }
    >
      <AdminPlacementsView />
    </Suspense>
  );
}

