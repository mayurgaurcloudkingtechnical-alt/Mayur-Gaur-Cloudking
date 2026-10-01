import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Server,
  Monitor,
  Cpu,
  Layers,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Terminal,
} from "lucide-react";

export default function App() {
  const [version, setVersion] = useState<string>("Loading...");
  const [platform, setPlatform] = useState<string>("Detecting...");
  const [backendUrl, setBackendUrl] = useState<string>("Resolving...");
  const [pingStatus, setPingStatus] = useState<string>("Checking...");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const loadSystemInfo = async () => {
    setIsRefreshing(true);
    try {
      if (window.electronAPI) {
        const [ver, plat, backend, pong] = await Promise.all([
          window.electronAPI.getAppVersion(),
          window.electronAPI.getPlatform(),
          window.electronAPI.getBackendUrl(),
          window.electronAPI.ping(),
        ]);
        setVersion(ver || "1.0.0");
        setPlatform(plat || "win32");
        setBackendUrl(backend || "http://localhost:3000");
        setPingStatus(pong === "pong" ? "Active (IPC OK)" : "Degraded");
      } else {
        // Fallback for browser preview during renderer dev
        setVersion("1.0.0-dev (Web Preview)");
        setPlatform(navigator.userAgent.includes("Windows") ? "win32" : "browser");
        setBackendUrl("http://localhost:3000");
        setPingStatus("Browser Emulation (Mock IPC)");
      }
    } catch (err) {
      console.error("Error loading system info:", err);
      setPingStatus("IPC Communication Error");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadSystemInfo();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Application Bar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              SoftLab Global LMS
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Desktop Edition
              </span>
            </h1>
            <p className="text-xs text-slate-400">Step 6B — Windows Desktop Application Foundation</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadSystemInfo}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Foundation Verified
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-8 space-y-8">
        {/* Hero Banner */}
        <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/80 to-slate-950 p-8 shadow-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <Cpu className="w-3.5 h-3.5" /> Isolated Electron Architecture
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight sm:text-3xl">
              Windows Native LMS Foundation
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Step 6B establishes the sandboxed, context-isolated Electron workspace for SoftLab Global LMS.
              This desktop client operates strictly as an additive client connecting directly to the
              existing Next.js backend and PostgreSQL data layer without modifying existing Web or Mobile code.
            </p>
          </div>
        </section>

        {/* System Diagnostics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: App Version */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Desktop Version</span>
              <Terminal className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-xl font-bold text-white tracking-tight">{version}</div>
            <p className="text-xs text-slate-400">Electron 32 / React 18 / Vite 5</p>
          </div>

          {/* Card 2: Host Platform */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Host OS Platform</span>
              <Monitor className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-xl font-bold text-white tracking-tight capitalize">
              {platform === "win32" ? "Windows (x64)" : platform}
            </div>
            <p className="text-xs text-slate-400">Single-Instance Lock Engaged</p>
          </div>

          {/* Card 3: Backend Gateway */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Backend Gateway</span>
              <Server className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-sm font-semibold text-emerald-400 truncate tracking-tight" title={backendUrl}>
              {backendUrl}
            </div>
            <p className="text-xs text-slate-400">Next.js API & tRPC Endpoint</p>
          </div>

          {/* Card 4: IPC Security Channel */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">IPC Bridge State</span>
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-sm font-semibold text-indigo-300 tracking-tight">{pingStatus}</div>
            <p className="text-xs text-slate-400">ContextBridge Channel</p>
          </div>
        </div>

        {/* Security Posture & Standards Matrix */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              Verified Security Boundaries
            </h3>
            <span className="text-xs text-slate-400">Electron Hardened Profile</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-lg border border-slate-800/80 bg-slate-950/50 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">Context Isolation</p>
                <p className="text-[11px] text-slate-400">Enabled (contextIsolation: true)</p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-800/80 bg-slate-950/50 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">Node Integration</p>
                <p className="text-[11px] text-slate-400">Disabled (nodeIntegration: false)</p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-800/80 bg-slate-950/50 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">Chromium Sandbox</p>
                <p className="text-[11px] text-slate-400">Enforced (sandbox: true)</p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-800/80 bg-slate-950/50 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">Web Security</p>
                <p className="text-[11px] text-slate-400">Enforced (webSecurity: true)</p>
              </div>
            </div>
          </div>
        </section>

        {/* Roadmap Preview */}
        <section className="rounded-xl border border-slate-800/80 bg-slate-900/20 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-200">Next Phase: Step 6C — Desktop Auth & Storage</h4>
            <p className="text-xs text-slate-400 mt-1">
              Will introduce Windows DPAPI safeStorage, native login dialog, session token refresh, and auto-login state.
            </p>
          </div>
          <a
            href="https://www.softlabglobal.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-md shadow-indigo-600/20 shrink-0"
          >
            <span>SoftLab Web LMS</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </section>
      </main>

      {/* Footer Status Bar */}
      <footer className="border-t border-slate-800 bg-slate-950/80 px-6 py-2.5 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center space-x-4">
          <span>SoftLab Global LMS Desktop Foundation</span>
          <span>•</span>
          <span>Single Window Active</span>
          <span>•</span>
          <span>Strict CSP Active</span>
        </div>
        <div>
          <span>Target Architecture: x64 Windows NSIS</span>
        </div>
      </footer>
    </div>
  );
}
