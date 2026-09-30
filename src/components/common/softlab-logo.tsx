import * as React from "react";
import Image from "next/image";

interface SoftlabLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  className?: string;
  variant?: "light" | "dark";
  layout?: "stacked" | "inline";
}

export function SoftlabLogo({
  size = "md",
  showTagline = true,
  className = "",
  variant = "light",
  layout = "stacked",
}: SoftlabLogoProps) {
  const isDark = variant === "dark";

  const config = {
    sm: {
      imageSize: 34,
      imageContainer: "h-8 w-8",
      title: "text-base font-black tracking-tight",
      global: "text-[9px] font-black tracking-[0.24em]",
      lineWidth: "w-2.5",
      sub: "text-[9px]",
    },
    md: {
      imageSize: 42,
      imageContainer: "h-10 w-10 sm:h-11 sm:w-11",
      title: "text-lg sm:text-xl font-black tracking-tight",
      global: "text-[10px] sm:text-[11px] font-black tracking-[0.26em]",
      lineWidth: "w-3 sm:w-4",
      sub: "text-[10px]",
    },
    lg: {
      imageSize: 56,
      imageContainer: "h-14 w-14",
      title: "text-2xl font-black tracking-tight",
      global: "text-xs font-black tracking-[0.28em]",
      lineWidth: "w-5",
      sub: "text-xs",
    },
    xl: {
      imageSize: 84,
      imageContainer: "h-20 w-20 sm:h-22 sm:w-22",
      title: "text-3xl font-black tracking-tight",
      global: "text-sm font-black tracking-[0.3em]",
      lineWidth: "w-7",
      sub: "text-xs sm:text-sm",
    },
  }[size];

  // Exact SOFTLAB GLOBAL Logo Theme Colors:
  // "SOFT" is Vibrant Lime-to-Emerald Green
  const softColor = isDark
    ? "bg-gradient-to-b from-[#8ee544] via-[#72bf44] to-[#48ba22] bg-clip-text text-transparent drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]"
    : "bg-gradient-to-b from-[#60ba26] via-[#4ea618] to-[#3a8b10] bg-clip-text text-transparent drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]";

  // "LAB" is Ocean/Electric Sky-to-Royal Blue
  const labColor = isDark
    ? "bg-gradient-to-b from-[#38bdf8] via-[#00a3e0] to-[#0284c7] bg-clip-text text-transparent drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]"
    : "bg-gradient-to-b from-[#0096c7] via-[#0284c7] to-[#0066cc] bg-clip-text text-transparent drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]";

  // "GLOBAL" is Vibrant Cyan/Royal Blue with flanking accent lines
  const globalTextColor = isDark
    ? "text-[#38bdf8] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
    : "text-[#0284c7]";

  const lineLeft = isDark
    ? "bg-gradient-to-r from-transparent via-[#38bdf8]/60 to-[#38bdf8]"
    : "bg-gradient-to-r from-transparent via-[#0284c7]/60 to-[#0284c7]";

  const lineRight = isDark
    ? "bg-gradient-to-l from-transparent via-[#38bdf8]/60 to-[#38bdf8]"
    : "bg-gradient-to-l from-transparent via-[#0284c7]/60 to-[#0284c7]";

  const taglineColor = isDark ? "text-[#4ade80]" : "text-[#16a34a]";
  const subTaglineColor = isDark ? "text-slate-400" : "text-slate-500";

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Official 3D SoftLab Global Logo Image */}
      <div
        className={`relative shrink-0 overflow-hidden rounded-xl transition-transform duration-200 hover:scale-105 ${
          config.imageContainer
        } ${
          isDark
            ? "bg-white/95 p-0.5 shadow-md shadow-emerald-950/40 ring-1 ring-white/30"
            : "bg-white shadow-sm ring-1 ring-slate-200/80"
        }`}
      >
        <Image
          src="/images/softlab-logo.png"
          alt="SOFTLAB GLOBAL Logo"
          width={config.imageSize * 2}
          height={config.imageSize * 2}
          priority
          className="h-full w-full object-contain rounded-lg"
        />
      </div>

      {/* Official Typography & Tagline */}
      <div className="flex flex-col text-left justify-center">
        {layout === "inline" ? (
          <div className="flex items-center gap-1.5 leading-none select-none">
            <span className={`${config.title} inline-flex items-baseline`}>
              <span className={softColor}>SOFT</span>
              <span className={labColor}>LAB</span>
            </span>
            <span className={`${config.title} ${globalTextColor}`}>
              GLOBAL
            </span>
          </div>
        ) : (
          <>
            {/* Row 1: SOFT (Green) + LAB (Blue) */}
            <div className="flex items-baseline leading-none select-none">
              <span className={`${config.title} ${softColor}`}>
                SOFT
              </span>
              <span className={`${config.title} ${labColor}`}>
                LAB
              </span>
            </div>

            {/* Row 2: — GLOBAL — in Cyan/Blue */}
            <div className="flex items-center gap-1.5 mt-0.5 leading-none select-none">
              <span className={`h-[1.5px] ${config.lineWidth} ${lineLeft} rounded-full`} />
              <span className={`${config.global} uppercase ${globalTextColor}`}>
                GLOBAL
              </span>
              <span className={`h-[1.5px] ${config.lineWidth} ${lineRight} rounded-full`} />
            </div>
          </>
        )}

        {/* Tagline */}
        {showTagline && (
          <div className="flex flex-col mt-1">
            <span
              className={`font-bold tracking-wider uppercase ${config.sub} ${taglineColor}`}
            >
              Learn Today • Code Tomorrow
            </span>
            <span
              className={`text-[9px] tracking-tight ${subTaglineColor} hidden sm:inline`}
            >
              Center for Excellence • Prayagraj
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
