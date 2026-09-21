import * as React from "react";
import Image from "next/image";

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

  const config = {
    sm: {
      imageSize: 34,
      imageContainer: "h-8 w-8",
      title: "text-base font-black tracking-wider",
      sub: "text-[10px]",
    },
    md: {
      imageSize: 42,
      imageContainer: "h-10 w-10 sm:h-11 sm:w-11",
      title: "text-lg font-black tracking-wider",
      sub: "text-[11px]",
    },
    lg: {
      imageSize: 56,
      imageContainer: "h-14 w-14",
      title: "text-xl font-black tracking-wide",
      sub: "text-xs",
    },
    xl: {
      imageSize: 84,
      imageContainer: "h-20 w-20 sm:h-22 sm:w-22",
      title: "text-2xl font-black tracking-wide",
      sub: "text-xs sm:text-sm",
    },
  }[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Official 3D SoftLab Global Logo Image */}
      <div
        className={`relative shrink-0 overflow-hidden rounded-xl transition-transform duration-200 hover:scale-105 ${
          config.imageContainer
        } ${
          isDark
            ? "bg-white p-0.5 shadow-md ring-1 ring-white/20"
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
      <div className="flex flex-col text-left">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`${config.title} ${isDark ? "text-white" : "text-slate-900"}`}>
            SOFTLAB
          </span>
          <span className={`${config.title} text-emerald-600`}>
            GLOBAL
          </span>
        </div>

        {showTagline && (
          <div className="flex flex-col mt-1">
            <span
              className={`font-bold tracking-wider uppercase ${config.sub} ${
                isDark ? "text-emerald-400" : "text-emerald-700"
              }`}
            >
              Learn Today • Code Tomorrow
            </span>
            <span
              className={`text-[9px] tracking-tight ${
                isDark ? "text-slate-400" : "text-slate-500"
              } hidden sm:inline`}
            >
              Center for Excellence • Prayagraj
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
