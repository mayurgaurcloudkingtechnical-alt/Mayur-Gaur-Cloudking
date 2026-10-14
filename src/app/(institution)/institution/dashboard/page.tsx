import { Metadata } from "next";
import { InstitutionDashboardView } from "@/components/institution/institution-dashboard-view";

export const metadata: Metadata = {
  title: "Institutional Partner Portal | SoftLab Global LMS",
  description:
    "Dedicated institutional partner portal for colleges and universities to manage students, bulk import records, track campus placement drives, and participate in mega job fairs.",
};

export default function InstitutionPortalPage() {
  return <InstitutionDashboardView />;
}
