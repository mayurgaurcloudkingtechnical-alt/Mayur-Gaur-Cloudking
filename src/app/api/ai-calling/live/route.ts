import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db/client";

export const dynamic = "force-dynamic";

const GEMINI_MODELS = ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-2.0-flash"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action = "turn", // "start" | "turn" | "end"
      callLogId,
      leadId,
      studentName = "Student",
      phone = "",
      courseTitle = "Full Stack, AI & Cloud Programs",
      language = "Hinglish",
      speechText = "",
      history = [],
      durationSeconds = 0,
    } = body as {
      action?: "start" | "turn" | "end";
      callLogId?: string;
      leadId?: string;
      studentName?: string;
      phone?: string;
      courseTitle?: string;
      language?: string;
      speechText?: string;
      history?: Array<{ role: "SIA" | "STUDENT"; text: string }>;
      durationSeconds?: number;
    };

    // 1. Start session: create StaffCallLog if not passed
    if (action === "start") {
      const greeting = `Namaste ${studentName !== "Student" ? studentName + " ji" : "ji"}! Main SoftLab Global, Civil Lines Prayagraj se AI Academic Counselor SIA bol rahi hoon. Aap ${courseTitle} ke baare mein kya jaanna chahenge?`;

      let activeLogId = callLogId || "";
      if (!activeLogId) {
        // Resolve a system/admin userId for StaffCallLog foreign key
        const fallbackUser = await db.user.findFirst({
          where: { roleCode: { in: ["SUPER_ADMIN", "ADMIN", "COUNSELOR"] }, status: "ACTIVE" },
          select: { id: true },
        });
        if (fallbackUser) {
          const created = await db.staffCallLog.create({
            data: {
              userId: fallbackUser.id,
              leadId: leadId || null,
              contactName: studentName,
              contactPhone: phone || "WEB_AI_CALL",
              callType: "OUTGOING",
              callStatus: "IN_PROGRESS",
              disposition: "CONNECTED",
              durationSeconds: 0,
              notes: `[Self-Hosted AI Voice Call Started]\nSIA: ${greeting}`,
              roleCode: "AI_COUNSELOR",
            },
          });
          activeLogId = created.id;
        }
      } else {
        await db.staffCallLog
          .update({
            where: { id: activeLogId },
            data: {
              callStatus: "IN_PROGRESS",
              disposition: "CONNECTED",
              notes: `[Self-Hosted AI Voice Call Connected]\nSIA: ${greeting}`,
            },
          })
          .catch(() => {});
      }

      return NextResponse.json({
        success: true,
        callLogId: activeLogId,
        reply: greeting,
        shouldEnd: false,
        intent: "GENERAL",
      });
    }

    // 2. End session: finalize StaffCallLog + CustomerTimelineEvent
    if (action === "end") {
      const transcriptText = history
        .map((h) => `${h.role === "SIA" ? "SIA" : "Student"}: ${h.text}`)
        .join("\n");

      if (callLogId) {
        await db.staffCallLog
          .update({
            where: { id: callLogId },
            data: {
              callStatus: "COMPLETED",
              durationSeconds: Math.max(0, Math.round(durationSeconds)),
              endedAt: new Date(),
              notes: `[Self-Hosted AI Voice Call Completed | ${Math.round(durationSeconds)}s]\n${transcriptText}`,
            },
          })
          .catch(() => {});
      }

      if (leadId) {
        await db.customerTimelineEvent
          .create({
            data: {
              leadId,
              eventType: "AI_CALL_COMPLETED",
              source: "AI_CALLING",
              title: `Self-Hosted AI Voice Call Completed (${Math.round(durationSeconds)}s)`,
              summary: transcriptText.slice(0, 500) || "AI counseling voice session completed.",
              metadata: { callLogId, durationSeconds },
            },
          })
          .catch(() => {});
      }

      return NextResponse.json({ success: true });
    }

    // 3. Conversation turn: call Gemini AI
    const apiKey = process.env.GEMINI_API_KEY;
    const historyText = history
      .slice(-8)
      .map((h) => `${h.role === "SIA" ? "SIA" : "Student"}: ${h.text}`)
      .join("\n");

    let reply =
      "Ji bilkul! SoftLab Global Prayagraj mein aapko live practical labs, industry projects aur 6-Month Professional English & Personality Development course bilkul free milta hai. Kya main aapka free demo class schedule kar doon?";
    let shouldEnd = false;
    let intent: "INTERESTED" | "CALLBACK" | "NOT_INTERESTED" | "GENERAL" = "GENERAL";

    if (apiKey && speechText.trim()) {
      const systemPrompt = [
        "You are SIA, the Senior AI Academic Counselor at SoftLab Global (4th Floor, 211/C/59, Tata Motors Building, M.G Road, Civil Lines, Prayagraj, UP).",
        `You are on a live voice call with ${studentName} regarding ${courseTitle}.`,
        `Speak in ${language} (natural, warm, concise Hinglish/Hindi or English matching the student).`,
        "Key facts: Short-Term Courses (30-45 Days, Rs 4,999), AI & Cyber Security Workshop (Rs 799), Winter Internship (Rs 999), Summer Internship (Rs 2,499), Full Stack / Data Science / Cloud & DevOps / Python / Java / Digital Marketing, and complimentary 6-Month Professional English Speaking & Personality Development course (worth Rs 14,999) included free for enrolled students.",
        "Keep replies to 2-3 short spoken sentences with NO markdown, NO asterisks, NO bullet points.",
        "Append [INTERESTED] if student wants demo/admission/details, [CALLBACK] if busy/later, [NOT_INTERESTED] if not interested, and [END_CALL] if student says bye/hang up.",
      ].join("\n");

      for (const model of GEMINI_MODELS) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents: [
                  {
                    role: "user",
                    parts: [
                      {
                        text: `Previous conversation:\n${historyText}\n\nStudent said: "${speechText}"\n\nReply naturally as SIA:`,
                      },
                    ],
                  },
                ],
                generationConfig: { temperature: 0.5, maxOutputTokens: 180 },
              }),
              signal: AbortSignal.timeout(8000),
            }
          );
          if (!res.ok) continue;
          const data = await res.json();
          const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (!raw) continue;

          shouldEnd = raw.includes("[END_CALL]");
          if (raw.includes("[INTERESTED]")) intent = "INTERESTED";
          else if (raw.includes("[CALLBACK]")) intent = "CALLBACK";
          else if (raw.includes("[NOT_INTERESTED]")) intent = "NOT_INTERESTED";

          reply = raw
            .replace(/\[(END_CALL|INTERESTED|CALLBACK|NOT_INTERESTED)\]/g, "")
            .replace(/[*#_`]/g, "")
            .trim();
          break;
        } catch {
          // Try next fallback model
        }
      }
    }

    if (callLogId) {
      const updatedTranscript = `${historyText}\nStudent: ${speechText}\nSIA: ${reply}`.trim();
      await db.staffCallLog
        .update({
          where: { id: callLogId },
          data: {
            notes: `[Self-Hosted AI Voice Call]\n${updatedTranscript}`,
            disposition:
              intent === "INTERESTED"
                ? "INTERESTED"
                : intent === "NOT_INTERESTED"
                ? "NOT_INTERESTED"
                : intent === "CALLBACK"
                ? "CALLBACK_REQUESTED"
                : "CONNECTED",
          },
        })
        .catch(() => {});
    }

    return NextResponse.json({
      success: true,
      callLogId,
      reply,
      shouldEnd,
      intent,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "AI Voice turn failed" },
      { status: 500 }
    );
  }
}
