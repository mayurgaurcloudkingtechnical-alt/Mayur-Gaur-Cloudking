"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { openCareerCounselingModal } from "@/components/public/career-counseling-modal";
import {
  Sparkles,
  Cpu,
  Brain,
  Layers,
  ArrowRight,
  CheckCircle2,
  Download,
  ShieldCheck,
  Award,
  Zap,
  Bot,
  Flame,
  FileCode2,
  Calendar,
  MessageCircle,
} from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants/site";

export function AiMlShowcase() {
  const whatsappUrl = `https://wa.me/919196596975?text=${encodeURIComponent(
    "Hello SoftLab Global, I want to inquire about the AI & Machine Learning Master Course syllabus and ₹5,000 down payment admission."
  )}`;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white py-16 sm:py-24 border-y border-slate-800">
      {/* Dynamic Futuristic Glow Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:32px_32px] opacity-10 pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/50 bg-emerald-950/70 px-4 py-1.5 text-xs font-bold text-emerald-400 shadow-lg shadow-emerald-950/50 backdrop-blur">
            <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" />
            <span>SoftLab Flagship Innovation Cohort 2026</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Master Advanced{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              AI & Machine Learning
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            From Python fundamentals and Deep Learning to Generative AI, Large Language Models (LLMs), RAG systems, and autonomous agent architectures with 100% placement assurance.
          </p>
        </div>

        {/* Feature Grid Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Interactive Curriculum Pillars */}
          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 transition-all space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <Brain className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Generative AI & LLMs</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Fine-tune Llama 3, OpenAI APIs, LangChain, LlamaIndex, Vector Databases (Pinecone/Chroma), and enterprise RAG pipelines.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 transition-all space-y-2">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">PyTorch & Deep Learning</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Neural network architectures, Backpropagation, CNNs for Vision, Transformers, and GPU-accelerated computing.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 transition-all space-y-2">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Autonomous AI Agents</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  CrewAI, AutoGen, tool calling, multi-agent collaboration, memory architectures, and production orchestration.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 transition-all space-y-2">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">100% Placement Assistance</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Resume engineering, Kaggle portfolio building, mock technical interviews, and direct drives with 1,200+ partner tech companies.
                </p>
              </div>
            </div>

            {/* Tech Stack Chips */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Tools & Technologies Covered:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Python 3.12",
                  "PyTorch",
                  "TensorFlow",
                  "Hugging Face",
                  "OpenAI GPT-4o",
                  "LangChain",
                  "LlamaIndex",
                  "ChromaDB",
                  "FastAPI",
                  "Docker",
                  "CUDA",
                  "Git & GitHub",
                ].map((tech) => (
                  <span
                    key={tech}
                    className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-900 border border-slate-700/60 text-slate-300 hover:border-emerald-500 transition-colors"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Admission Card & Flexible Payment Model */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl bg-slate-900/95 border-2 border-emerald-500/40 p-6 sm:p-8 shadow-2xl shadow-emerald-950/80 relative overflow-hidden backdrop-blur-xl">
              {/* Highlight Ribbon */}
              <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-600 to-teal-600 text-white text-[10px] font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-bl-xl shadow">
                Enrolling Now: Batch AIML-2026-B1
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                    Cohort Details & Fee Plan
                  </span>
                  <h3 className="text-2xl font-black text-white">
                    AI & ML Master Certification
                  </h3>
                  <p className="text-xs text-slate-400">
                    Full-time & Weekend Batches • Lab & Live Online • 6 Months
                  </p>
                </div>

                {/* Pricing Box */}
                <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-4 space-y-3">
                  <div className="flex items-baseline justify-between border-b border-slate-800 pb-2.5">
                    <div>
                      <p className="text-xs text-slate-400">Full Program Tuition</p>
                      <p className="text-2xl font-black text-white">₹90,000</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-emerald-400 font-bold">Seat Booking Down Payment</p>
                      <p className="text-xl font-extrabold text-emerald-400">₹5,000</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Balance in flexible monthly installments (₹42,500 x 2)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Instant LMS Student Portal Credentials & Lab Access</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>1-on-1 Dedicated Faculty Mentorship</span>
                    </div>
                  </div>
                </div>

                {/* Call to Actions */}
                <div className="space-y-2.5 pt-2">
                  <Button
                    onClick={() => openCareerCounselingModal("AI & Machine Learning Complete Course")}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold h-11 text-xs shadow-lg shadow-emerald-900/40 rounded-xl"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Book Free AI/ML Career Counseling</span>
                    </div>
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      asChild
                      variant="outline"
                      className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold h-10 rounded-xl"
                    >
                      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 text-[#25D366]">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp Desk</span>
                      </a>
                    </Button>

                    <Button
                      asChild
                      variant="outline"
                      className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold h-10 rounded-xl"
                    >
                      <Link href="/courses" className="flex items-center justify-center gap-1.5">
                        <span>All Courses</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>

                <p className="text-[10px] text-center text-slate-500 pt-1">
                  Inquiries helpline: <span className="text-slate-300 font-semibold">+91 9196596975</span> • Email: <span className="text-slate-300 font-semibold">info@softlabglobal.com</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
