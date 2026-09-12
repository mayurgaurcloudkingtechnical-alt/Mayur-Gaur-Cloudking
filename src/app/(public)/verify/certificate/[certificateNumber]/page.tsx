import React from "react";
import Link from "next/link";
import { CertificateService } from "@/server/services/certificate.service";
import { VerifiableCertificate } from "@/components/certificate/verifiable-certificate";
import { Award, ArrowLeft, ShieldAlert } from "lucide-react";

interface PageProps {
  params: {
    certificateNumber: string;
  };
}

export default async function PublicCertificateVerificationPage({ params }: PageProps) {
  const identifier = decodeURIComponent(params.certificateNumber);
  const result = await CertificateService.verifyCertificate(identifier);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to SOFTLAB GLOBAL Home</span>
        </Link>
      </div>

      {!result.isValid && !result.isRevoked ? (
        <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm space-y-4">
          <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto" />
          <h1 className="text-2xl font-bold text-slate-900">Certificate Not Found</h1>
          <p className="text-sm text-slate-600">
            No active certificate was found matching the identifier <span className="font-mono font-bold text-slate-800">{identifier}</span>.
          </p>
          <p className="text-xs text-slate-500">
            Please verify the certificate number or scan the QR code directly from the official credential.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <VerifiableCertificate
            certificate={result.certificate as any}
            qrCodeData={result.qrCodeData}
          />

          <div className="max-w-4xl mx-auto text-center text-xs text-slate-500">
            Official Academic Verification Portal • SOFTLAB GLOBAL Educational Technologies
          </div>
        </div>
      )}
    </div>
  );
}