"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ServicePackageItem } from "@/lib/constants/services-catalog";
import { SITE_CONFIG } from "@/lib/constants/site";
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  CreditCard,
  Phone,
  ArrowRight,
  Sparkles,
  FileCheck,
  Building2,
  Info,
  Layers,
  Calendar,
} from "lucide-react";

export function ServiceDetailModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [item, setItem] = useState<ServicePackageItem | null>(null);

  useEffect(() => {
    const handleOpen = (e: CustomEvent<{ package: ServicePackageItem }>) => {
      if (e.detail?.package) {
        setItem(e.detail.package);
        setIsOpen(true);
      }
    };

    window.addEventListener("open-service-modal" as any, handleOpen as any);
    return () => {
      window.removeEventListener("open-service-modal" as any, handleOpen as any);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setItem(null);
  };

  const handleSelectAndEnquire = () => {
    if (!item) return;

    // Dispatch event to prefill enquiry form
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("prefill-service-enquiry", {
          detail: {
            categoryCode: item.categoryCode,
            packageName: item.title,
          },
        })
      );
    }

    handleClose();

    // Smooth scroll to enquiry section
    setTimeout(() => {
      const el = document.getElementById("service-enquiry-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }, 150);
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-950 border border-emerald-500/50 text-slate-100 p-0 shadow-2xl rounded-3xl">
        {/* 1. Header Banner */}
        <div className="relative p-6 sm:p-7 pb-5 border-b border-slate-800 bg-gradient-to-br from-emerald-950/90 via-slate-900 to-slate-950">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-600/60 text-emerald-300 text-xs font-semibold">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>{item.categoryName}</span>
            </div>

            {item.badge && (
              <Badge className="bg-emerald-500 text-slate-950 font-bold text-[10px] uppercase tracking-wider">
                {item.badge}
              </Badge>
            )}
          </div>

          <DialogTitle className="text-xl sm:text-3xl font-black text-white leading-tight">
            {item.title}
          </DialogTitle>

          <DialogDescription className="text-xs sm:text-sm text-emerald-300/90 font-medium mt-1">
            {item.tagline}
          </DialogDescription>

          {/* Pricing & Timeline Pill Bar */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
                Standard Commercial Fee
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-white">
                  {item.pricingDisplay}
                </span>
              </div>
              {item.priceNote && (
                <span className="text-[11px] text-emerald-400 font-medium block">
                  {item.priceNote}
                </span>
              )}
            </div>

            {item.timeline && (
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
                  Estimated Delivery Timeline
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-white bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{item.timeline}</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 2. Body Details */}
        <div className="p-6 sm:p-7 space-y-6">
          {/* Target Audience Box */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs space-y-1">
            <span className="font-bold uppercase tracking-wider text-emerald-400 text-[10px] flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>Recommended Target Audience</span>
            </span>
            <p className="text-slate-200 leading-relaxed font-medium">
              {item.idealFor}
            </p>
          </div>

          {/* Deliverables List */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>Scope of Work & Complete Deliverables ({item.deliverables.length})</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {item.deliverables.map((del, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-200"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{del}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Structure Breakdown */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Payment Structure: {item.paymentStructure.title}
                </h4>
              </div>
              <span className="text-[10px] font-mono text-emerald-300 bg-emerald-900/60 border border-emerald-700/60 px-2 py-0.5 rounded">
                Verified Contract
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              {item.paymentStructure.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
              {item.paymentStructure.milestones.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/20 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-emerald-400 font-mono">
                      {m.percentage}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">
                      Stage 0{idx + 1}
                    </span>
                  </div>
                  <h5 className="text-[11px] font-bold text-white line-clamp-1">
                    {m.stage}
                  </h5>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {m.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Commercial Terms Notice */}
          <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
            <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span>Standard Commercial Terms</span>
            </span>
            <ul className="list-disc pl-4 space-y-1 text-slate-400">
              <li>All pricing exclusive of 18% GST. Tax invoices provided for full input credit.</li>
              <li>Ad budgets (Google/Meta) are paid directly to platforms or billed at actuals.</li>
              <li>Third-party API charges, payment gateway fees & SMS/WhatsApp credits are billed at actuals.</li>
              <li>Full source code & IP handover guaranteed upon final milestone settlement.</li>
            </ul>
          </div>

          {/* Actions Bar */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3 border-t border-slate-800">
            <Button
              type="button"
              onClick={handleSelectAndEnquire}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-11 rounded-xl shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 border border-emerald-400/40"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>Request Quotation for {item.title}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>

            <Button
              asChild
              type="button"
              variant="outline"
              className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white text-xs h-11 px-5 rounded-xl"
            >
              <a href={`tel:${SITE_CONFIG.contact.phoneTel}`} className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>Call Desk</span>
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Global helper to open any package modal
export function openServiceDetailModal(pkg: ServicePackageItem) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("open-service-modal", { detail: { package: pkg } })
    );
  }
}
