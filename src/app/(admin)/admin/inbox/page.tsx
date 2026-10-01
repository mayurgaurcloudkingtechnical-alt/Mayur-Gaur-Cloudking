import { OmnichannelInboxView } from "@/components/admin/omnichannel/omnichannel-inbox-view";

export const metadata = {
  title: "Omnichannel Communications Inbox | SoftLab Global Admin",
  description: "Unified communications desk across WhatsApp Business API, Web Chat, and Voice Calling transcripts.",
};

export default function AdminInboxPage() {
  return (
    <div className="p-6">
      <OmnichannelInboxView />
    </div>
  );
}
