import React, { Suspense } from "react";
import type { Metadata } from "next";
import { ImsQuoteRequestForm } from "@/components/public/ims-quote-request-form";

export const metadata: Metadata = {
  title: "Request an Itemized IT Infrastructure & Managed Services Quote | SoftLab Global",
  description:
    "Submit your CCTV, Server, Structured Networking, Computer Lab, Biometric Access Control, or Annual Maintenance (AMC) requirements and receive an instant itemized provisional Bill of Quantities (BOQ).",
  alternates: {
    canonical: "/services/request-quote",
  },
};

export default function ImsRequestQuotePage() {
  return (
    <main className="min-h-screen bg-slate-50/70">
      <Suspense
        fallback={
          <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-500 text-sm">
            Loading IT Infrastructure Requirement & BOQ Engine...
          </div>
        }
      >
        <ImsQuoteRequestForm />
      </Suspense>
    </main>
  );
}
