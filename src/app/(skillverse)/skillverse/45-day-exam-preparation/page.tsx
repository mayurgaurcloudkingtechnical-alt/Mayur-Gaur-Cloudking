import React from "react";
import type { Metadata } from "next";
import { Skillverse45DayExamView } from "@/components/skillverse/skillverse-45day-exam-view";

export const metadata: Metadata = {
  title: "45-Day Board Exam Power Preparation (Commerce & Science) — SLG SKILLVERSE",
  description:
    "Target 90%+ in Class 12 CBSE & NCERT Board Examinations with our 45-day power prep. Live classes, formula breakdowns, 10-year PYQs, and 5 fully evaluated board mock simulations.",
  openGraph: {
    title: "45-Day Board Exam Power Preparation — SLG SKILLVERSE",
    description:
      "Intensive 45-day score booster for Class 12 Commerce (₹4,500) and Science (₹5,100). Live classes, formula sheets, PYQs, and 5 evaluated mocks.",
    url: "https://skillverse.softlabglobal.com/45-day-exam-preparation",
  },
};

export default function Skillverse45DayExamPage() {
  return <Skillverse45DayExamView />;
}
