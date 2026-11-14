import React from "react";
import type { Metadata } from "next";
import { Skillverse45DayExamView } from "@/components/skillverse/skillverse-45day-exam-view";

export const metadata: Metadata = {
  title: "45-Day Board Exam Power Preparation (Commerce & Science) — SLG SKILLVERSE",
  description:
    "Target 90%+ in Class 12 CBSE & NCERT Board Examinations with our 45-day power prep. Live classes, formula breakdowns, 10-year PYQs, and 5 fully evaluated board mock simulations.",
};

export default function Public45DayExamPage() {
  return <Skillverse45DayExamView />;
}
