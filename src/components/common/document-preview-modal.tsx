"use client";

import React from "react";
import { X, Download, ExternalLink, FileText, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    title: string;
    documentType?: string;
    documentUrl: string;
    fileName?: string | null;
    fileSize?: number | null;
  } | null;
}

export function DocumentPreviewModal({ isOpen, onClose, document }: DocumentPreviewModalProps) {
  if (!isOpen || !document) return null;

  const isPdf =
    document.documentUrl.startsWith("data:application/pdf") ||
    document.documentUrl.toLowerCase().endsWith(".pdf") ||
    document.fileName?.toLowerCase().endsWith(".pdf");

  const isImage =
    document.documentUrl.startsWith("data:image/") ||
    /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(document.documentUrl) ||
    (document.fileName && /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(document.fileName));

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = () => {
    const link = window.document.createElement("a");
    link.href = document.documentUrl;
    link.download = document.fileName || `${document.title.toLowerCase().replace(/\s+/g, "_")}.pdf`;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white truncate">{document.title}</h3>
                {document.documentType && (
                  <Badge variant="outline" className="text-[10px] bg-slate-800 text-blue-300 border-slate-700 font-mono shrink-0">
                    {document.documentType}
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {document.fileName || "Uploaded Document"} {document.fileSize ? `• ${formatFileSize(document.fileSize)}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
              title="Download Document"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </button>
            <button
              type="button"
              onClick={() => window.open(document.documentUrl, "_blank")}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs transition"
              title="Open in new window"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-slate-800 hover:bg-red-950 text-slate-300 hover:text-red-400 rounded-lg text-xs transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 bg-slate-100 p-2 sm:p-4 overflow-auto flex items-center justify-center">
          {isImage ? (
            <img
              src={document.documentUrl}
              alt={document.title}
              className="max-h-full max-w-full object-contain rounded-lg shadow-sm border border-slate-300 bg-white"
            />
          ) : isPdf ? (
            <iframe
              src={document.documentUrl}
              title={document.title}
              className="w-full h-full rounded-lg border border-slate-300 shadow-sm bg-white"
            />
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md shadow-sm">
              <FileText className="w-16 h-16 text-indigo-500 mx-auto mb-3" />
              <h4 className="font-bold text-slate-800 text-sm mb-1">{document.title}</h4>
              <p className="text-xs text-slate-500 mb-4">
                This document is ready to view and download.
              </p>
              <button
                type="button"
                onClick={handleDownload}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" /> Download / Open File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
