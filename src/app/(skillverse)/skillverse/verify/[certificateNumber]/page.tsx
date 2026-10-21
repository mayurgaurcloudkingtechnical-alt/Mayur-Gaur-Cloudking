"use client";

import React from "react";
import Link from "next/link";
import { api as trpc } from "@/lib/trpc/react";
import { SKILLVERSE_BRAND } from "@/lib/constants/skillverse-data";
import { CheckCircle2, AlertTriangle, Printer, Award } from "lucide-react";

export default function SkillverseVerifyCertificatePage({
  params,
}: {
  params: { certificateNumber: string };
}) {
  const { certificateNumber } = params;
  const { data: cert, isLoading } = trpc.skillverse.verifyCertificate.useQuery({
    certificateNumber,
  });

  if (isLoading) {
    return (
      <div className="p-16 text-center text-slate-500 text-sm">
        Verifying SLG SKILLVERSE Certificate Reference...
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">Certificate Reference Not Found</h1>
        <p className="text-xs text-slate-600">
          No certificate matching <code className="font-mono font-bold">{certificateNumber}</code>{" "}
          was found in the SLG SKILLVERSE registry.
        </p>
        <Link
          href="/skillverse"
          className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold"
        >
          Back to SLG SKILLVERSE
        </Link>
      </div>
    );
  }

  const isRevoked = cert.status === "REVOKED";

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <span
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold ${
            isRevoked
              ? "bg-red-100 text-red-800 border border-red-300"
              : "bg-emerald-100 text-emerald-800 border border-emerald-300"
          }`}
        >
          {isRevoked ? (
            <>
              <AlertTriangle className="w-4 h-4" /> REVOKED CERTIFICATE
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" /> VERIFIED AUTHENTIC CERTIFICATE
            </>
          )}
        </span>
        {!isRevoked && (
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
          >
            <Printer className="w-4 h-4" /> Print / Save Official PDF
          </button>
        )}
      </div>

      {/* Printable Certificate Frame */}
      <div className="bg-white rounded-3xl border-4 border-[#071630] p-8 sm:p-12 shadow-xl text-center space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <img
            src={SKILLVERSE_BRAND.logoPath}
            alt="SLG Skillverse"
            className="w-16 h-16 object-contain"
          />
          <div className="text-xl font-black tracking-tight text-[#071630]">
            <span className="text-[#15803D]">SLG</span>{" "}
            <span className="text-[#0052CC]">SKILLVERSE</span>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Powered by SoftLab Global • Certificate of Course Completion
          </p>
        </div>

        <div className="space-y-2 py-4 border-y border-slate-200">
          <p className="text-xs uppercase tracking-widest text-slate-500">This is to certify that</p>
          <h1 className="text-3xl font-black text-slate-900">{cert.studentName}</h1>
          <p className="text-xs text-slate-600">
            Enrollment ID: <strong className="font-mono">{cert.studentId}</strong> • Grade:{" "}
            <strong>{cert.classGrade}</strong>
          </p>
          <p className="text-xs text-slate-600 pt-2">
            has successfully completed the academic & skill requirements for:
          </p>
          <h2 className="text-xl font-extrabold text-blue-700">{cert.courseTitle}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600 pt-2">
          <div>
            <strong className="block text-slate-900">Certificate Reference:</strong>
            <span className="font-mono">{cert.certificateNumber}</span>
          </div>
          <div>
            <strong className="block text-slate-900">Date of Issue:</strong>
            <span>{cert.issueDate}</span>
          </div>
          <div>
            <strong className="block text-slate-900">Authorized Issuer:</strong>
            <span>{cert.authorizedIssuer}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 text-[10px] text-slate-500 leading-relaxed">
          <strong>Institutional Disclosure:</strong> This certificate is issued by SLG SKILLVERSE
          (Powered by SoftLab Global) upon completion of internal course and assessment milestones.
          It does not imply government accreditation, school board affiliation, or external
          examination qualification.
        </div>
      </div>
    </div>
  );
}
