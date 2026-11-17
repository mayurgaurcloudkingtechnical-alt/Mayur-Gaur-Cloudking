import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db/client";

export const dynamic = "force-dynamic";

const GEMINI_MODELS = ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-2.0-flash"];

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function twimlResponse(innerXml: string): NextResponse {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n${innerXml}\n</Response>`;
  return new NextResponse(xml, {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

async function generateAiCounselorReply(params: {
  studentSpeech: string;
  historyText: string;
  studentName: string;
  courseTitle: string;
  language: string;
}): Promise<{ reply: string; shouldEnd: boolean; intent: "INTERESTED" | "CALLBACK" | "NOT_INTERESTED" | "GENERAL" }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      reply:
        "Dhanyavaad aapke samay ke liye. Hamare senior academic counselor jald hi aapko call back karenge aur course ki poori jaankari denge.",
      shouldEnd: true,
      intent: "CALLBACK",
    };
  }

  const systemPrompt = [
    "You are SIA, the Senior AI Academic Counselor at SoftLab Global (Civil Lines, Prayagraj, UP).",
    `You are on a live phone call with ${params.studentName || "a prospective student"} regarding ${params.courseTitle || "IT, AI, Cloud, Full Stack & Vocational courses"}.`,
    `Preferred language: ${params.language || "Hinglish (natural Hindi + English mix)"}.`,
    "Key institutional facts:",
    "- Address: 4th Floor, 211/C/59, Tata Motors Building, M.G Road, Civil Lines, Prayagraj.",
    "- Programs: Full Stack Development, Data Science & AI, Cloud & DevOps, Cyber Security, Python/Java, Digital Marketing, Short-Term 30-45 Days Courses (Rs 4,999), Winter/Summer Internships (Rs 999 / Rs 2,499).",
    "- Complimentary Bonus: Every regular enrolled student gets our 6-Month Professional English Speaking & Personality Development course (worth Rs 14,999) 100% FREE.",
    "- Placement: 100% placement assistance with live labs, projects, and interview prep.",
    "Rules for phone speech:",
    "1. Reply in 2 to 3 short, warm, natural spoken sentences (no markdown, no bullet points, no asterisks, no emojis).",
    "2. End your reply with a clear helpful question or next step (e.g. demo class, counseling visit, or WhatsApp brochure).",
    "3. If the student clearly wants to hang up or says bye/not interested/busy, end politely and append [END_CALL] at the very end.",
    "4. If interested or wants demo/admission, append [INTERESTED]. If busy/call later, append [CALLBACK]. If clearly not interested, append [NOT_INTERESTED].",
  ].join("\n");

  const userContent = `Conversation so far:\n${params.historyText || "(Call just connected)"}\n\nStudent just said: "${params.studentSpeech}"\n\nRespond naturally as SIA on the phone:`;

  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: "user", parts: [{ text: userContent }] }],
            generationConfig: { temperature: 0.5, maxOutputTokens: 180 },
          }),
          signal: AbortSignal.timeout(7000),
        }
      );

      if (!res.ok) continue;
      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!rawText) continue;

      const shouldEnd = rawText.includes("[END_CALL]");
      let intent: "INTERESTED" | "CALLBACK" | "NOT_INTERESTED" | "GENERAL" = "GENERAL";
      if (rawText.includes("[INTERESTED]")) intent = "INTERESTED";
      else if (rawText.includes("[CALLBACK]")) intent = "CALLBACK";
      else if (rawText.includes("[NOT_INTERESTED]")) intent = "NOT_INTERESTED";

      const cleanReply = rawText
        .replace(/\[(END_CALL|INTERESTED|CALLBACK|NOT_INTERESTED)\]/g, "")
        .replace(/[*#_`]/g, "")
        .trim();

      return { reply: cleanReply, shouldEnd, intent };
    } catch {
      // Try next fallback model
    }
  }

  return {
    reply:
      "Ji bilkul, SoftLab Global Prayagraj mein aapka swagat hai. Kya main aapke liye kal ek free demo session aur WhatsApp par course fee details bhej doon?",
    shouldEnd: false,
    intent: "GENERAL",
  };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const speechResult = (formData.get("SpeechResult") as string | null)?.trim() || "";
    const callSid = (formData.get("CallSid") as string | null) || "";
    const fromNumber = (formData.get("From") as string | null) || "";

    const search = req.nextUrl.searchParams;
    const callLogId = search.get("callLogId") || "";
    const leadId = search.get("leadId") || "";
    const studentName = search.get("name") || "Student";
    const courseTitle = search.get("course") || "Full Stack, AI & Cloud Programs";
    const language = search.get("lang") || "Hinglish";
    const turn = parseInt(search.get("turn") || "0", 10);

    const baseUrl = process.env.NEXTAUTH_URL || "https://lms.softlabglobal.com";
    const nextActionUrl = `${baseUrl}/api/telephony/twilio/voice?callLogId=${encodeURIComponent(callLogId)}&leadId=${encodeURIComponent(leadId)}&name=${encodeURIComponent(studentName)}&course=${encodeURIComponent(courseTitle)}&lang=${encodeURIComponent(language)}&turn=${turn + 1}`;

    // Turn 0: Initial greeting + open speech gather
    if (!speechResult && turn === 0) {
      const greeting = `Namaste ${studentName !== "Student" ? studentName + " ji" : "ji"}. Main SoftLab Global, Civil Lines Prayagraj se AI Academic Counselor SIA bol rahi hoon. Aapne ${courseTitle} ke baare mein enquiry ki thi. Kya aap abhi 1 minute baat kar sakte hain?`;

      if (callLogId) {
        await db.staffCallLog
          .update({
            where: { id: callLogId },
            data: {
              callStatus: "IN_PROGRESS",
              notes: `[AI Call Connected | SID: ${callSid}]\nSIA: ${greeting}`,
            },
          })
          .catch(() => {});
      }

      return twimlResponse(`
        <Gather input="speech" speechTimeout="auto" timeout="6" language="hi-IN" hints="haan,yes,no,nahi,fee,fees,course,python,full stack,ai,demo,english,internship,call later" action="${escapeXml(nextActionUrl)}" method="POST">
          <Say voice="Polly.Aditi" language="hi-IN">${escapeXml(greeting)}</Say>
        </Gather>
        <Say voice="Polly.Aditi" language="hi-IN">Lagta hai aawaz nahi aa rahi hai. Hamare counselor aapko WhatsApp par details bhej denge. Dhanyavaad.</Say>
        <Hangup/>
      `);
    }

    // No speech detected on subsequent turn
    if (!speechResult) {
      if (turn >= 2) {
        return twimlResponse(`
          <Say voice="Polly.Aditi" language="hi-IN">Koi baat nahi ji, hum aapko WhatsApp par poori course aur fee details share kar rahe hain. SoftLab Global mein call karne ke liye dhanyavaad.</Say>
          <Hangup/>
        `);
      }
      return twimlResponse(`
        <Gather input="speech" speechTimeout="auto" timeout="5" language="hi-IN" action="${escapeXml(nextActionUrl)}" method="POST">
          <Say voice="Polly.Aditi" language="hi-IN">Maaf kijiye, aapki aawaz clear nahi aayi. Kya aap dobara bol sakte hain?</Say>
        </Gather>
        <Hangup/>
      `);
    }

    // Load previous transcript from StaffCallLog if available
    let existingNotes = "";
    if (callLogId) {
      const existingLog = await db.staffCallLog.findUnique({
        where: { id: callLogId },
        select: { notes: true },
      }).catch(() => null);
      existingNotes = existingLog?.notes || "";
    }

    const ai = await generateAiCounselorReply({
      studentSpeech: speechResult,
      historyText: existingNotes,
      studentName,
      courseTitle,
      language,
    });

    const updatedNotes = `${existingNotes}\nStudent: ${speechResult}\nSIA: ${ai.reply}`.trim();

    if (callLogId) {
      await db.staffCallLog
        .update({
          where: { id: callLogId },
          data: {
            notes: updatedNotes,
            disposition:
              ai.intent === "INTERESTED"
                ? "INTERESTED"
                : ai.intent === "NOT_INTERESTED"
                ? "NOT_INTERESTED"
                : ai.intent === "CALLBACK"
                ? "CALLBACK_REQUESTED"
                : "CONNECTED",
          },
        })
        .catch(() => {});
    }

    if (leadId && ai.intent !== "GENERAL") {
      await db.customerTimelineEvent
        .create({
          data: {
            leadId,
            eventType: "AI_CALL_TURN",
            source: "AI_CALLING",
            title: `AI Voice Call Update (${ai.intent})`,
            summary: `Student: "${speechResult}" -> SIA: "${ai.reply}"`,
            metadata: { callSid, fromNumber, intent: ai.intent, turn },
          },
        })
        .catch(() => {});
    }

    if (ai.shouldEnd || turn >= 8) {
      return twimlResponse(`
        <Say voice="Polly.Aditi" language="hi-IN">${escapeXml(ai.reply)}</Say>
        <Hangup/>
      `);
    }

    return twimlResponse(`
      <Gather input="speech" speechTimeout="auto" timeout="6" language="hi-IN" hints="haan,yes,no,nahi,fee,fees,course,python,full stack,ai,demo,english,internship,timing,address" action="${escapeXml(nextActionUrl)}" method="POST">
        <Say voice="Polly.Aditi" language="hi-IN">${escapeXml(ai.reply)}</Say>
      </Gather>
      <Say voice="Polly.Aditi" language="hi-IN">Dhanyavaad ji, hamare counselor aapke saath WhatsApp par connect rahenge. Namaste.</Say>
      <Hangup/>
    `);
  } catch (err: any) {
    console.error("[Twilio AI Voice Error]:", err?.message || err);
    return twimlResponse(`
      <Say voice="Polly.Aditi" language="hi-IN">Namaste, SoftLab Global mein aapka swagat hai. Hamare senior counselor jald hi aapse sampark karenge.</Say>
      <Hangup/>
    `);
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
