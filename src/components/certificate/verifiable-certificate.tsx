import React from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, ShieldAlert, Award, Calendar, ExternalLink } from "lucide-react";

interface VerifiableCertificateProps {
  certificate: {
    certificateNo: string;
    verificationToken: string;
    studentName: string;
    courseTitle: string;
    courseCode?: string;
    completionDate: string | Date;
    issuedDate: string | Date;
    signatoryName?: string;
    signatoryTitle?: string;
    status: string;
    revokedAt?: string | Date | null;
    revocationReason?: string | null;
  };
  qrCodeData?: string | null;
}

export function VerifiableCertificate({ certificate, qrCodeData }: VerifiableCertificateProps) {
  const isRevoked = certificate.status === "REVOKED";

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 bg-white border-8 border-slate-900 shadow-2xl rounded-2xl relative overflow-hidden font-serif">
      {/* Background Seal Watermark */}
      <div className="absolute inset-0 opacity-[0.03] flex items-center justify-center pointer-events-none">
        <Award className="w-[500px] h-[500px] text-slate-900" />
      </div>

      {/* Revocation Banner */}
      {isRevoked && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-3 font-sans text-rose-800">
          <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-base">This Certificate Has Been Revoked</h4>
            <p className="text-sm mt-1">
              Reason: {certificate.revocationReason || "Administrative decision"}
            </p>
            {certificate.revokedAt && (
              <p className="text-xs text-rose-600 mt-1">
                Revoked on: {new Date(certificate.revokedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center border-b-2 border-slate-200 pb-6 mb-6">
        <div className="flex items-center justify-center gap-2 mb-2 font-sans">
          <Award className="w-8 h-8 text-amber-600" />
          <span className="text-2xl font-black tracking-widest text-slate-900 uppercase">
            SOFTLAB GLOBAL
          </span>
        </div>
        <p className="text-xs font-sans tracking-widest text-slate-500 uppercase">
          Center for Advanced Technology & Professional Excellence
        </p>
        <h1 className="text-3xl md:text-4xl font-normal text-slate-900 mt-4 tracking-wide">
          Certificate of Completion
        </h1>
      </div>

      {/* Body */}
      <div className="text-center py-6 space-y-4">
        <p className="text-sm font-sans text-slate-500 italic">This is proudly presented to</p>
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 underline decoration-amber-500/50 underline-offset-8">
          {certificate.studentName}
        </h2>
        <p className="text-sm font-sans text-slate-600 max-w-xl mx-auto leading-relaxed pt-2">
          for successfully fulfilling all examination, practical coursework, and assessment requirements for the professional curriculum:
        </p>
        <h3 className="text-2xl font-semibold text-slate-900 tracking-tight">
          {certificate.courseTitle}
        </h3>
      </div>

      {/* Footer Details & QR Code */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t-2 border-slate-200 mt-6 items-end font-sans">
        {/* Signatory */}
        <div className="text-center md:text-left">
          <div className="h-10 border-b border-slate-400 w-48 mb-2 mx-auto md:mx-0 flex items-end">
            <span className="font-serif italic text-base text-slate-700">Softlab Academy</span>
          </div>
          <div className="font-semibold text-sm text-slate-800">
            {certificate.signatoryName || "Director of Academic Affairs"}
          </div>
          <div className="text-xs text-slate-500">
            {certificate.signatoryTitle || "Authorized Signatory, SOFTLAB GLOBAL"}
          </div>
        </div>

        {/* Dates & Cert ID */}
        <div className="text-center space-y-1 text-xs text-slate-600">
          <div>
            <span className="font-medium text-slate-700">Certificate No: </span>
            <span className="font-mono font-bold text-slate-900">{certificate.certificateNo}</span>
          </div>
          <div>
            <span className="font-medium text-slate-700">Completion Date: </span>
            <span>{new Date(certificate.completionDate).toLocaleDateString()}</span>
          </div>
          <div>
            <span className="font-medium text-slate-700">Issued Date: </span>
            <span>{new Date(certificate.issuedDate).toLocaleDateString()}</span>
          </div>
          {!isRevoked && (
            <div className="inline-flex items-center gap-1 text-emerald-700 font-semibold mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Cryptographically Verified</span>
            </div>
          )}
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center md:items-end">
          {qrCodeData ? (
            <div className="p-2 border border-slate-200 rounded-lg bg-white shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrCodeData}
                alt="Certificate QR Verification"
                className="w-24 h-24 object-contain"
              />
            </div>
          ) : (
            <div className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] text-slate-400 text-center">
              Scan to Verify
            </div>
          )}
          <span className="text-[10px] text-slate-500 mt-1">Scan to verify authenticity</span>
        </div>
      </div>
    </div>
  );
}
