import React from "react";
import { WhatsAppHiringView } from "@/components/admin/placements/whatsapp-hiring-view";

export const metadata = {
  title: "WhatsApp Hiring Automation | Placement CRM | SoftLab Global",
  description: "AI-powered WhatsApp hiring intelligence, message ingestion, and Placement CRM opening generator.",
};

export default function WhatsAppHiringPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <WhatsAppHiringView />
    </div>
  );
}
