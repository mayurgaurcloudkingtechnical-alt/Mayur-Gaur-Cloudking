import React from "react";
import { SelfHostedVoiceDialer } from "@/components/ai-calling/self-hosted-voice-dialer";

export const dynamic = "force-dynamic";

export default function AiCallPage({
  searchParams,
}: {
  searchParams: {
    leadId?: string;
    callLogId?: string;
    name?: string;
    phone?: string;
    course?: string;
  };
}) {
  return (
    <main className="min-h-screen bg-slate-950 py-12 px-4 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            SoftLab Global — Live AI Voice Counseling
          </h1>
          <p className="text-sm text-slate-400">
            Speak directly with SIA, our self-hosted AI Academic Counselor (100% Free, Zero Third-Party Calling Charges).
          </p>
        </div>

        <SelfHostedVoiceDialer
          leadId={searchParams.leadId || ""}
          callLogId={searchParams.callLogId || ""}
          studentName={searchParams.name || "Student"}
          phone={searchParams.phone || ""}
          courseTitle={searchParams.course || "Full Stack, AI & Cloud Programs"}
        />
      </div>
    </main>
  );
}
