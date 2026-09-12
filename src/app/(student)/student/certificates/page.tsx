"use client";

import React from "react";
import Link from "next/link";
import { api } from "@/lib/trpc/react";
import { Award, ExternalLink, Calendar, CheckCircle2 } from "lucide-react";

export default function StudentCertificatesPage() {
  const { data: certificates, isLoading } = api.certificate.getMyCertificates.useQuery();

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Certificates</h1>
        <p className="text-sm text-slate-600">
          Official, cryptographically verifiable credentials earned through completed courses.
        </p>
      </div>

      {!certificates || certificates.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Award className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-800">No Certificates Earned Yet</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            Complete all modules, quizzes, and final examinations for your enrolled courses to automatically unlock your official certificate.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert: any) => (
            <div
              key={cert.id}
              className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 transition"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    Verified Credential
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-600">
                    {cert.certificateNo}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-1">{cert.course?.title}</h3>
                <p className="text-xs text-slate-500 mb-4">SOFTLAB GLOBAL Academy of Excellence</p>

                <div className="flex items-center gap-4 text-xs text-slate-600 border-t pt-3 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Issued: {new Date(cert.issuedDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-700 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Valid</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t flex items-center justify-end">
                <Link
                  href={`/verify/certificate/${cert.certificateNo}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-semibold transition"
                >
                  <span>View & Verify</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}