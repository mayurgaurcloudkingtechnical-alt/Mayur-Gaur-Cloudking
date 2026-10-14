import { Metadata } from "next";
import { CampusPartnershipsView } from "@/components/admin/campus-partnerships/campus-partnerships-view";

export const metadata: Metadata = {
  title: "Campus & University Partnerships | SoftLab Global Placement CRM",
  description:
    "Centralized institutional onboarding, college & university partnerships, bulk student management, campus placement drives, and mega job fairs.",
};

export default function CampusPartnershipsPage() {
  return <CampusPartnershipsView />;
}
