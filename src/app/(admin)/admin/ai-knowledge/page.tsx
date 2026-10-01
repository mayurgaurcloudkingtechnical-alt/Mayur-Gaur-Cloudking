import { AiKnowledgeView } from "@/components/admin/ai-knowledge/ai-knowledge-view";

export const metadata = {
  title: "AI Knowledge Center & Grounding | SoftLab Global Admin",
  description: "Configure authoritative institutional facts, fees, syllabus, and policies for AI Voice Calling and WhatsApp Counselors.",
};

export default function AdminAiKnowledgePage() {
  return (
    <div className="p-6">
      <AiKnowledgeView />
    </div>
  );
}
