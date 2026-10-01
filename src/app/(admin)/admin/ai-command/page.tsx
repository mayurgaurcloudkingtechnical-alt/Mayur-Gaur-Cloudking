import { AiCommandView } from "@/components/admin/ai-command/ai-command-view";

export const metadata = {
  title: "AI Command Center | SoftLab Global Admin",
  description: "Real-time AI telemetry, qualification metrics, and admissions automation command center.",
};

export default function AdminAiCommandPage() {
  return (
    <div className="p-6">
      <AiCommandView />
    </div>
  );
}
