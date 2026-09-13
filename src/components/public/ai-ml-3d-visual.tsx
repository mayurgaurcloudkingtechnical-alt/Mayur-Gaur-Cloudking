"use client";

import React, { useState, useEffect } from "react";
import {
  Brain,
  Cpu,
  Layers,
  Sparkles,
  Network,
  Activity,
  Zap,
  Terminal,
  Database,
  CheckCircle2,
} from "lucide-react";

export function AiMl3DVisual() {
  const [activeNode, setActiveNode] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveNode((prev) => (prev + 1) % 4);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const pipelineStages = [
    { label: "Deep Neural Networks", tag: "PyTorch 2.5", color: "from-blue-500 to-indigo-600" },
    { label: "Transformer Architectures", tag: "LLMs & GenAI", color: "from-purple-500 to-pink-600" },
    { label: "Vector Search & RAG", tag: "FAISS & Pinecone", color: "from-emerald-500 to-teal-600" },
    { label: "Production MLOps", tag: "Kubeflow & Docker", color: "from-amber-500 to-orange-600" },
  ];

  return (
    <div className="relative w-full h-[460px] rounded-3xl overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-emerald-500/30 shadow-2xl p-6 flex flex-col justify-between select-none">
      {/* Background Matrix Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#05966912_1px,transparent_1px),linear-gradient(to_bottom,#05966912_1px,transparent_1px)] bg-[size:28px_28px] opacity-40" />

      {/* Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Diagnostics HUD */}
      <div className="relative z-10 flex items-center justify-between border-b border-emerald-500/20 pb-3">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </div>
          <span className="text-[11px] font-mono font-semibold tracking-wider text-emerald-400 uppercase">
            SOFTLAB AI-ML NEURAL CORE • ONLINE
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/50">
          TensorRT-LLM v0.14
        </span>
      </div>

      {/* Isometric 3D Holographic Core */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center">
        {/* Orbital Ring 1 */}
        <div className="absolute w-64 h-64 rounded-full border border-emerald-500/20 animate-[spin_24s_linear_infinite]" />
        {/* Orbital Ring 2 */}
        <div className="absolute w-52 h-52 rounded-full border border-dashed border-cyan-500/30 animate-[spin_16s_linear_infinite_reverse]" />
        {/* Orbital Ring 3 */}
        <div className="absolute w-40 h-40 rounded-full border border-indigo-500/25 animate-[spin_10s_linear_infinite]" />

        {/* Floating Holographic Central Core */}
        <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-500/30 via-slate-900 to-indigo-600/30 border border-emerald-400/50 shadow-[0_0_50px_rgba(16,185,129,0.35)] backdrop-blur-md flex items-center justify-center animate-pulse">
          <Brain className="w-12 h-12 text-emerald-300 drop-shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
        </div>

        {/* Floating Chip Left: PyTorch / Neural */}
        <div className="absolute -left-2 top-8 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-emerald-500/40 shadow-lg backdrop-blur-sm flex items-center gap-2 animate-bounce [animation-duration:4s]">
          <Cpu className="w-4 h-4 text-emerald-400" />
          <div>
            <p className="text-[10px] font-bold text-white leading-tight">Neural Backprop</p>
            <p className="text-[9px] font-mono text-emerald-400">fp16 precision</p>
          </div>
        </div>

        {/* Floating Chip Right: Vector Embeddings */}
        <div className="absolute -right-2 top-10 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-cyan-500/40 shadow-lg backdrop-blur-sm flex items-center gap-2 animate-bounce [animation-duration:5s]">
          <Database className="w-4 h-4 text-cyan-400" />
          <div>
            <p className="text-[10px] font-bold text-white leading-tight">Vector Index</p>
            <p className="text-[9px] font-mono text-cyan-400">1536-dim RAG</p>
          </div>
        </div>

        {/* Floating Chip Bottom Left: MLOps */}
        <div className="absolute left-1 bottom-4 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-purple-500/40 shadow-lg backdrop-blur-sm flex items-center gap-2 animate-bounce [animation-duration:4.5s]">
          <Network className="w-4 h-4 text-purple-400" />
          <div>
            <p className="text-[10px] font-bold text-white leading-tight">Distributed Training</p>
            <p className="text-[9px] font-mono text-purple-400">Multi-GPU Cluster</p>
          </div>
        </div>

        {/* Floating Chip Bottom Right: Low Latency Inference */}
        <div className="absolute right-1 bottom-6 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-amber-500/40 shadow-lg backdrop-blur-sm flex items-center gap-2 animate-bounce [animation-duration:3.8s]">
          <Zap className="w-4 h-4 text-amber-400" />
          <div>
            <p className="text-[10px] font-bold text-white leading-tight">Inference Engine</p>
            <p className="text-[9px] font-mono text-amber-400">&lt; 12ms latency</p>
          </div>
        </div>
      </div>

      {/* Bottom Pipeline Progress HUD */}
      <div className="relative z-10 space-y-2 pt-2 border-t border-slate-800">
        <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
          <span>PIPELINE VERIFICATION STAGE</span>
          <span className="text-emerald-400 font-bold">{activeNode + 1} / 4</span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {pipelineStages.map((stage, idx) => (
            <div
              key={stage.label}
              className={`p-1.5 rounded-lg border transition-all text-center ${
                activeNode === idx
                  ? "bg-slate-800 border-emerald-400/80 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                  : "bg-slate-900/60 border-slate-800"
              }`}
            >
              <p
                className={`text-[9px] font-bold truncate ${
                  activeNode === idx ? "text-emerald-300" : "text-slate-400"
                }`}
              >
                {stage.tag}
              </p>
              <div
                className={`w-full h-1 rounded-full mt-1 ${
                  activeNode === idx ? "bg-emerald-400" : "bg-slate-800"
                }`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}