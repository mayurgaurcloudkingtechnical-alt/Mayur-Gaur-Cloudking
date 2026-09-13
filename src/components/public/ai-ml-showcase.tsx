"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { openCareerCounselingModal } from "@/components/public/career-counseling-modal";
import { AiMl3DVisual } from "@/components/public/ai-ml-3d-visual";
import {
  Sparkles,
  Cpu,
  Brain,
  Layers,
  ArrowRight,
  CheckCircle2,
  Award,
  Zap,
  Bot,
} from "lucide-react";

export function AiMlShowcase() {

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

          {/* Right: Premium 3D AI/ML & Cloud Holographic Technology Visual */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <AiMl3DVisual />
          </div>
        </div>
      </div>
    </section>
  );
}
