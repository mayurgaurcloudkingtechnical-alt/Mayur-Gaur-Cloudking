import React from "react";
import type { Metadata } from "next";
import { SkillverseShell } from "@/components/skillverse/skillverse-shell";
import { SKILLVERSE_BRAND } from "@/lib/constants/skillverse-data";

export const metadata: Metadata = {
  title: {
    default: `${SKILLVERSE_BRAND.name} — Powered by ${SKILLVERSE_BRAND.parentBrand} | ${SKILLVERSE_BRAND.tagline}`,
    template: `%s | ${SKILLVERSE_BRAND.name}`,
  },
  description: `${SKILLVERSE_BRAND.tagline} ${SKILLVERSE_BRAND.supportingLine}. School Foundation (Classes 8–12), IIT-JEE Main & Advanced Extension, NEET-UG, Olympiad, CUET, NDA, AI Literacy, Python Coding & Robotics.`,
  openGraph: {
    title: `${SKILLVERSE_BRAND.name} — Powered by ${SKILLVERSE_BRAND.parentBrand}`,
    description: `${SKILLVERSE_BRAND.tagline} ${SKILLVERSE_BRAND.supportingLine}`,
    url: SKILLVERSE_BRAND.subdomainUrl,
    siteName: SKILLVERSE_BRAND.name,
    type: "website",
  },
};

export default function SkillverseRootLayout({ children }: { children: React.ReactNode }) {
  return <SkillverseShell>{children}</SkillverseShell>;
}
