"use client";

import * as React from "react";
import { MessageCircle, Phone, X } from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants/site";

export function FloatingWhatsApp() {
  const [isOpen, setIsOpen] = React.useState(false);

  const whatsappNumber = "919194085890";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    "Hello Softlab Global, I want to inquire about IT courses and admissions."
  )}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Quick Popup Box */}
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 w-72 mb-2 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                SG
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Softlab Help Desk</p>
                <span className="text-[10px] text-emerald-600 font-medium">● Online / Active</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-600 mb-3 leading-relaxed">
            Need guidance regarding syllabus, batch timings, or placement packages? Chat with us directly on WhatsApp!
          </p>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat on WhatsApp</span>
          </a>

          <div className="mt-2 text-center">
            <a
              href={`tel:${SITE_CONFIG.contact.phoneTel}`}
              className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-emerald-700"
            >
              <Phone className="w-3 h-3 text-emerald-600" />
              <span>Or call: {SITE_CONFIG.contact.phone}</span>
            </a>
          </div>
        </div>
      )}

      {/* Main Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white shadow-xl hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-emerald-200"
        title="Chat on WhatsApp"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="w-7 h-7" />
      </button>
    </div>
  );
}
