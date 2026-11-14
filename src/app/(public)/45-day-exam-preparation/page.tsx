import { redirect } from "next/navigation";

export default function Public45DayExamPage() {
  // 45-Day Board Exam Preparation is strictly a Skillverse venture program.
  // Redirecting from SoftLab Global public domain to Skillverse route.
  redirect("/skillverse/45-day-exam-preparation");
}
