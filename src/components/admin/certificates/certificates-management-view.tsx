"use client";

import React, { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/trpc/react";
import { Award, ExternalLink, ShieldAlert, CheckCircle2, Search } from "lucide-react";

export function CertificatesManagementView() {
  const [search, setSearch] = useState("");
  const [revokingCertId, setRevokingCertId] = useState<string | null>(null);
  const [revocationReason, setRevocationReason] = useState("");

  const { data: certificates, refetch, isLoading } = api.certificate.listCertificates.useQuery();

  const revokeMutation = api.certificate.revokeCertificate.useMutation({
    onSuccess: () => {
      setRevokingCertId(null);
      setRevocationReason("");
      refetch();
    },
  });

  const handleRevoke = async () => {
    if (!revokingCertId || !revocationReason.trim()) return;
    try {
      await revokeMutation.mutateAsync({
        certificateId: revokingCertId,
        revocationReason: revocationReason.trim(),
      });
    } catch (err: any) {
      alert(err.message || "Failed to revoke certificate.");
    }
  };

  const filtered = certificates?.filter((c: any) => {
    const studentName = `${c.student?.user?.firstName} ${c.student?.user?.lastName}`.toLowerCase();
    const certNo = c.certificateNo.toLowerCase();
    const query = search.toLowerCase();
    return studentName.includes(query) || certNo.includes(query);
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Certificate Registry</h1>
          <p className="text-sm text-slate-600">
            View, verify, and manage all issued institutional credentials and revocation status.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student or certificate ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-sm bg-white w-64 md:w-80"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
            <tr>
              <th className="px-5 py-3.5">Certificate No</th>
              <th className="px-5 py-3.5">Student</th>
              <th className="px-5 py-3.5">Course</th>
              <th className="px-5 py-3.5">Issued Date</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered && filtered.length > 0 ? (
              filtered.map((cert: any) => {
                const studentName = `${cert.student?.user?.firstName} ${cert.student?.user?.lastName}`.trim();
                const isValid = cert.status === "VALID";

                return (
                  <tr key={cert.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4 font-mono font-bold text-xs text-slate-900">
                      {cert.certificateNo}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{studentName}</div>
                      <div className="text-xs text-slate-400">{cert.student?.user?.email}</div>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-700">{cert.course?.title}</td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {new Date(cert.issuedDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isValid
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {isValid ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <ShieldAlert className="w-3.5 h-3.5" />
                        )}
                        <span>{cert.status}</span>
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right space-x-2">
                      <Link
                        href={`/verify/certificate/${cert.certificateNo}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 px-2.5 py-1.5 rounded border border-slate-200 hover:bg-slate-100 transition"
                      >
                        <span>Verify</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>

                      {isValid && (
                        <button
                          onClick={() => setRevokingCertId(cert.id)}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-2.5 py-1.5 rounded border border-rose-200 hover:bg-rose-50 transition"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-500 text-sm">
                  {isLoading ? "Loading certificates..." : "No certificates found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Revoke Modal Prompt */}
      {revokingCertId && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Revoke Certificate</h3>
            <p className="text-xs text-slate-600">
              Revoking a certificate invalidates public verification and permanently marks the credential as revoked.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Revocation *
              </label>
              <textarea
                value={revocationReason}
                onChange={(e) => setRevocationReason(e.target.value)}
                placeholder="e.g. Academic integrity violation or administrative cancellation"
                rows={3}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRevokingCertId(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleRevoke}
                disabled={!revocationReason.trim() || revokeMutation.isPending}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50"
              >
                {revokeMutation.isPending ? "Revoking..." : "Confirm Revocation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}