"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import {
  Brain,
  ShieldCheck,
  Cpu,
  Terminal,
  Activity,
  Zap,
  Lock,
  Network,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Database,
  Radio,
  Eye,
  AlertTriangle,
  Server,
  Layers,
  Code2,
  FileCode,
} from "lucide-react";
import { openCareerCounselingModal } from "@/components/public/career-counseling-modal";
import { Button } from "@/components/ui/button";

export function HeroTechShowcase() {
  const [activeTab, setActiveTab] = useState<"aiml" | "cyber">("aiml");
  const [isAutoPaused, setIsAutoPaused] = useState(false);
  const [aimlStep, setAimlStep] = useState(0);
  const [cyberStep, setCyberStep] = useState(0);
  const [threatCount, setThreatCount] = useState(2487);
  const [tensorCount, setTensorCount] = useState(14820);

  // Auto-cycle tabs every 9 seconds unless user paused/clicked
  useEffect(() => {
    if (isAutoPaused) return;
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev === "aiml" ? "cyber" : "aiml"));
    }, 9000);
    return () => clearInterval(interval);
  }, [isAutoPaused]);

  // Animated pipeline progress inside AI mode
  useEffect(() => {
    const timer = setInterval(() => {
      setAimlStep((prev) => (prev + 1) % 4);
      setTensorCount((prev) => prev + Math.floor(Math.random() * 7) + 3);
    }, 2400);
    return () => clearInterval(timer);
  }, []);

  // Animated threat counter & step inside Cyber mode
  useEffect(() => {
    const timer = setInterval(() => {
      setCyberStep((prev) => (prev + 1) % 4);
      setThreatCount((prev) => prev + Math.floor(Math.random() * 3) + 1);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const handleTabSwitch = (tab: "aiml" | "cyber") => {
    setActiveTab(tab);
    setIsAutoPaused(true);
  };

  const handleOpenModal = () => {
    if (activeTab === "aiml") {
      openCareerCounselingModal("Master in Artificial Intelligence and Machine Learning");
    } else {
      openCareerCounselingModal("Cyber Security Complete Course");
    }
  };

  return (
    <div className="relative rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6 shadow-2xl shadow-emerald-950/40 text-white overflow-hidden backdrop-blur-xl">
      {/* Dynamic Background Grid & Ambient Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
      <div
        className={`absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-1000 ${
          activeTab === "aiml" ? "bg-emerald-500/20" : "bg-cyan-500/20"
        }`}
      />
      <div
        className={`absolute -bottom-24 -left-24 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-1000 ${
          activeTab === "aiml" ? "bg-purple-500/15" : "bg-blue-600/15"
        }`}
      />

      {/* Header Bar: Status Indicator & Domain Toggle Tabs */}
      <div className="relative z-10 space-y-3 pb-3 border-b border-slate-800">
        <div className="flex items-center justify-between gap-2">
          {/* Live Lab Pulsing Badge */}
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/60 text-[11px] font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
              {activeTab === "aiml" ? "AI Neural Engine Online" : "SOC Cyber Defense Grid Active"}
            </span>
          </div>

          <div className="text-[10px] font-mono text-slate-400 hidden sm:block">
            {activeTab === "aiml" ? "PyTorch 2.5 • CUDA 12.4" : "Zero-Trust • ISO 27001"}
          </div>
        </div>

        {/* Interactive Domain Switcher Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => handleTabSwitch("aiml")}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl transition-all duration-300 ${
              activeTab === "aiml"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/60"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Brain className="h-4 w-4 text-emerald-300" />
            <span className="truncate">AI & Neural Labs</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabSwitch("cyber")}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl transition-all duration-300 ${
              activeTab === "cyber"
                ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-950/60"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <ShieldCheck className="h-4 w-4 text-cyan-300" />
            <span className="truncate">Cyber Security & SOC</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Animated Content Area */}
      <div className="relative z-10 py-4 min-h-[300px] flex flex-col justify-between">
        {activeTab === "aiml" ? (
          /* ================================================================ */
          /* AI & MACHINE LEARNING INTERACTIVE ENGINE                         */
          /* ================================================================ */
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Holographic Pipeline Flow Graphic */}
            <div className="relative rounded-2xl bg-slate-950/70 border border-emerald-500/20 p-3 sm:p-4 overflow-hidden">
              <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400 mb-2.5">
                <span className="flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
                  <span>Deep Neural Network Inference Matrix</span>
                </span>
                <span className="text-slate-400">{tensorCount.toLocaleString()} Tensors Processed</span>
              </div>

              {/* 4 Pipeline Node Stages */}
              <div className="grid grid-cols-4 gap-2 text-center relative">
                {[
                  { label: "Token Embeddings", code: "768-Dim Vector", icon: Database },
                  { label: "Multi-Head Attention", code: "32 Attention Heads", icon: Cpu },
                  { label: "Transformer Blocks", code: "128 Layers Deep", icon: Layers },
                  { label: "Latent Inference", code: "12ms Latency", icon: Sparkles },
                ].map((node, idx) => {
                  const Icon = node.icon;
                  const isCurrent = aimlStep === idx;
                  return (
                    <div
                      key={node.label}
                      className={`p-2 sm:p-2.5 rounded-xl border transition-all duration-300 flex flex-col items-center justify-between min-h-[78px] ${
                        isCurrent
                          ? "border-emerald-400 bg-emerald-950/50 shadow-md shadow-emerald-500/20 scale-[1.03]"
                          : "border-slate-800/80 bg-slate-900/60 text-slate-400"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1 transition-colors ${
                          isCurrent
                            ? "bg-emerald-500 text-slate-950"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-[10px] font-bold text-white line-clamp-1">
                        {node.label}
                      </span>
                      <span className="text-[9px] font-mono text-emerald-400/90 truncate">
                        {node.code}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Live Streaming Animated Code / Weights Log */}
              <div className="mt-3 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold">
                  <Terminal className="h-3 w-3" />
                  <span>PyTorch Model Execution Stream:</span>
                </div>
                <div className="text-[10px] text-slate-300 truncate">
                  <span className="text-emerald-400 font-semibold">&gt;</span> model =
                  SoftLabTransformer(weights=&quot;Llama-3-FineTuned&quot;, device=&quot;cuda:0&quot;)
                </div>
                <div className="text-[10px] text-slate-400 truncate flex items-center justify-between">
                  <span>
                    <span className="text-emerald-400 font-semibold">&gt;</span> loss: 0.0018 •
                    accuracy: <span className="text-emerald-300 font-bold">99.4%</span> • RAG: Active
                  </span>
                  <span className="text-[9px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
                    Production Verified
                  </span>
                </div>
              </div>
            </div>

            {/* AI Tech Stack Chips */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold">
              <span className="text-slate-400 text-[10px] uppercase font-bold mr-1">Trained On:</span>
              {[
                "Generative AI & LLMs",
                "PyTorch 2.5",
                "RAG Architecture",
                "LangChain & VectorDB",
                "Autonomous Agents",
                "Computer Vision",
              ].map((tech) => (
                <span
                  key={tech}
                  className="px-2 py-0.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        ) : (
          /* ================================================================ */
          /* CYBER SECURITY & SOC ETHICAL DEFENSE GRID                        */
          /* ================================================================ */
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Interactive Threat Defense Terminal Visual */}
            <div className="relative rounded-2xl bg-slate-950/70 border border-cyan-500/25 p-3 sm:p-4 overflow-hidden">
              <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400 mb-2.5">
                <span className="flex items-center gap-1.5">
                  <Radio className="h-3.5 w-3.5 animate-pulse text-cyan-400" />
                  <span>SOC Penetration Testing & Threat Shield</span>
                </span>
                <span className="text-slate-400">{threatCount.toLocaleString()} Exploits Blocked</span>
              </div>

              {/* 4 Defense Protocol Cards */}
              <div className="grid grid-cols-4 gap-2 text-center relative">
                {[
                  { label: "Firewall Sandbox", code: "Zero Packet Leakage", icon: Lock },
                  { label: "Penetration Lab", code: "Ethical Kali Suite", icon: Eye },
                  { label: "DPI Encryption", code: "AES-256 GCM", icon: Server },
                  { label: "Zero-Day Defense", code: "Mitigated Live", icon: ShieldCheck },
                ].map((node, idx) => {
                  const Icon = node.icon;
                  const isCurrent = cyberStep === idx;
                  return (
                    <div
                      key={node.label}
                      className={`p-2 sm:p-2.5 rounded-xl border transition-all duration-300 flex flex-col items-center justify-between min-h-[78px] ${
                        isCurrent
                          ? "border-cyan-400 bg-cyan-950/50 shadow-md shadow-cyan-500/20 scale-[1.03]"
                          : "border-slate-800/80 bg-slate-900/60 text-slate-400"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1 transition-colors ${
                          isCurrent
                            ? "bg-cyan-500 text-slate-950"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-[10px] font-bold text-white line-clamp-1">
                        {node.label}
                      </span>
                      <span className="text-[9px] font-mono text-cyan-400/90 truncate">
                        {node.code}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Live Streaming Cyber Terminal Audit Log */}
              <div className="mt-3 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-400 text-[10px] font-bold">
                  <Terminal className="h-3 w-3" />
                  <span>SOC Terminal Real-Time Packet Stream:</span>
                </div>
                <div className="text-[10px] text-slate-300 truncate">
                  <span className="text-cyan-400 font-semibold">&gt;</span> nmap -sV -p 1-65535
                  sandbox.softlab.local [SYN Stealth Scan Complete]
                </div>
                <div className="text-[10px] text-slate-400 truncate flex items-center justify-between">
                  <span>
                    <span className="text-cyan-400 font-semibold">&gt;</span> port 443/TLS secured •
                    0 vulnerabilities • <span className="text-cyan-300 font-bold">ISO-27001 Compliant</span>
                  </span>
                  <span className="text-[9px] text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/60">
                    Defended 100%
                  </span>
                </div>
              </div>
            </div>

            {/* Cyber Security Tech Stack Chips */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold">
              <span className="text-slate-400 text-[10px] uppercase font-bold mr-1">Tools Mastered:</span>
              {[
                "Kali Linux Complete",
                "Wireshark Packet Analysis",
                "Metasploit Framework",
                "Burp Suite Pro",
                "SOC Incident Response",
                "OWASP Top 10",
              ].map((tech) => (
                <span
                  key={tech}
                  className="px-2 py-0.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action CTAs: Trigger Career Counseling / Lab Booking Popup */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-300 text-center sm:text-left space-y-0.5">
            <span className="font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>100% Live Production Lab Guarantee</span>
            </span>
            <p className="text-[10px] text-slate-400">
              Work on enterprise clusters, real hardware, and zero simulation fluff.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              onClick={handleOpenModal}
              className={`w-full sm:w-auto font-bold text-xs h-10 px-4 rounded-xl shadow-lg transition-all ${
                activeTab === "aiml"
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40"
                  : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/40"
              }`}
            >
              <span>{activeTab === "aiml" ? "Book Free AI Counseling" : "Book Free Cyber Counseling"}</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
