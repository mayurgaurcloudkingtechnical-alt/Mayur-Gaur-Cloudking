"use client";

import * as React from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Maximize2, FileText, CheckCircle2, Sparkles, ExternalLink } from "lucide-react";

interface CourseBrochureModalProps {
  courseTitle: string;
  brochureUrl: string;
}

export function CourseBrochureModal({ courseTitle, brochureUrl }: CourseBrochureModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      {/* Brochure Preview Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 rounded-3xl border border-slate-700/80 shadow-xl text-white space-y-4 overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="h-3 w-3 text-emerald-400" />
            <span>Official Course Flyer</span>
          </div>

          <span className="text-[11px] text-slate-400 font-mono">SoftLab Certified</span>
        </div>

        <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 cursor-pointer shadow-lg group-hover:border-emerald-500 transition-all duration-300" onClick={() => setIsOpen(true)}>
          <Image
            src={brochureUrl}
            alt={`${courseTitle} Official Brochure`}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20 group-hover:opacity-40 transition-opacity" />

          {/* Hover overlay hint */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
            <span className="px-4 py-2 rounded-xl bg-white/95 text-slate-900 text-xs font-bold flex items-center gap-1.5 shadow-lg transform -translate-y-1 group-hover:translate-y-0 transition-transform">
              <Maximize2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Click to Expand Flyer</span>
            </span>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <h4 className="text-sm font-extrabold text-white">
            Official Curriculum & Career Flyer
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Detailed 2026 syllabus, hands-on lab schedule, industry projects, and corporate placement partners.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
          <Button
            type="button"
            onClick={() => setIsOpen(true)}
            size="sm"
            variant="outline"
            className="border-slate-600 text-slate-200 hover:text-white hover:bg-slate-800 text-xs font-bold h-9"
          >
            <Maximize2 className="h-3.5 w-3.5 mr-1 text-sky-400" />
            <span>View Full Size</span>
          </Button>

          <Button
            asChild
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold h-9 shadow-sm"
          >
            <a href={brochureUrl} download={`${courseTitle.replace(/[^a-zA-Z0-9]/g, "-")}-Flyer.jpg`} target="_blank" rel="noopener noreferrer">
              <Download className="h-3.5 w-3.5 mr-1" />
              <span>Download</span>
            </a>
          </Button>
        </div>
      </div>

      {/* Expanded Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <div className="max-w-4xl max-h-[90vh] overflow-y-auto space-y-4">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  {courseTitle} — Official Program Flyer
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Verified syllabus, practical modules, tools & career opportunities by SoftLab Global.
                </DialogDescription>
              </div>

              <a
                href={brochureUrl}
                download={`${courseTitle.replace(/[^a-zA-Z0-9]/g, "-")}-Flyer.jpg`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition mr-6"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Save High-Res Image</span>
              </a>
            </div>
          </DialogHeader>

          <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center p-2">
            <img
              src={brochureUrl}
              alt={`${courseTitle} Flyer`}
              className="w-full h-auto rounded-xl max-h-[75vh] object-contain shadow-md"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-600">
            <span>SOFTLAB GLOBAL • Center of Excellence, Civil Lines, Prayagraj</span>
            <span className="font-semibold text-emerald-700">Admissions Open 2026</span>
          </div>
        </div>
      </Dialog>
    </>
  );
}
