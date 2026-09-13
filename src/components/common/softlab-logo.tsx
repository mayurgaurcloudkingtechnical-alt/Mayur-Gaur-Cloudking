import * as React from "react";

interface SoftlabLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  className?: string;
  variant?: "light" | "dark";
}

export function SoftlabLogo({
  size = "md",
  showTagline = true,
  className = "",
  variant = "light",
}: SoftlabLogoProps) {
  const isDark = variant === "dark";

  const dimension = {
    sm: { icon: 32, title: "text-base", sub: "text-[10px]" },
    md: { icon: 42, title: "text-lg", sub: "text-[11px]" },
    lg: { icon: 54, title: "text-xl", sub: "text-xs" },
    xl: { icon: 68, title: "text-2xl", sub: "text-sm" },
  }[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* 3D Glossy Hexagonal Emerald 'S' Emblem with Tech Circuit Dots */}
      <svg
        width={dimension.icon}
        height={dimension.icon}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200 hover:scale-105 filter drop-shadow-sm"
      >
        <defs>
          <linearGradient id="emeraldGrad" x1="15" y1="10" x2="85" y2="90" gradientUnits="userSpaceOnUse">
            <stop stopColor="#10B981" />
            <stop offset="0.5" stopColor="#059669" />
            <stop offset="1" stopColor="#047857" />
          </linearGradient>
          <linearGradient id="glossGrad" x1="20" y1="15" x2="80" y2="50" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="cyanAccent" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38BDF8" />
            <stop offset="1" stopColor="#0284C7" />
          </linearGradient>
        </defs>

        {/* Outer Hexagonal Shield Ring */}
        <polygon
          points="50,6 88,27 88,73 50,94 12,73 12,27"
          fill="url(#emeraldGrad)"
          stroke="#064E3B"
          strokeWidth="3.5"
        />

        {/* Gloss highlight on top half */}
        <polygon
          points="50,9 85,28 85,50 50,58 15,50 15,28"
          fill="url(#glossGrad)"
        />

        {/* Tech Circuit Traces in Top-Left */}
        <circle cx="24" cy="22" r="3" fill="#A7F3D0" />
        <line x1="24" y1="22" x2="33" y2="30" stroke="#A7F3D0" strokeWidth="2" />
        <circle cx="33" cy="30" r="2.5" fill="#38BDF8" />
        <circle cx="18" cy="33" r="2.5" fill="#A7F3D0" />
        <line x1="18" y1="33" x2="26" y2="38" stroke="#A7F3D0" strokeWidth="1.5" />

        {/* Stylized Futuristic Tech White 'S' */}
        <path
          d="M68 33C65 26 58 24 50 24C39 24 33 30 33 38C33 50 67 48 67 61C67 71 59 76 50 76C40 76 33 70 31 63"
          stroke="#FFFFFF"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="filter drop-shadow"
        />
        {/* Futuristic horizontal cuts across 'S' */}
        <line x1="41" y1="44" x2="59" y2="44" stroke="#059669" strokeWidth="3" strokeLinecap="round" />
        <line x1="41" y1="56" x2="59" y2="56" stroke="#047857" strokeWidth="3" strokeLinecap="round" />
      </svg>

      {/* Typography & Subtitle */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-black tracking-wider ${dimension.title} ${isDark ? "text-white" : "text-slate-900"}`}>
            SOFTLAB
          </span>
          <span className={`font-black tracking-widest ${dimension.title} text-emerald-600`}>
            GLOBAL
          </span>
        </div>

        {showTagline && (
          <div className="flex flex-col mt-0.5">
            <span className={`font-semibold tracking-wide uppercase ${dimension.sub} ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>
              Center for Excellence • Prayagraj
            </span>
            <span className={`text-[9px] tracking-tight ${isDark ? "text-slate-400" : "text-slate-500"} hidden sm:inline`}>
              IT Training • Software Development • Cloud • AI
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
