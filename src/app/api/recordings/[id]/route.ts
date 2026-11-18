import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { db } from "@/server/db/client";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await context.params;
    const recordingId = resolvedParams.id;

    if (!recordingId) {
      return NextResponse.json({ success: false, error: "Recording ID required" }, { status: 400 });
    }

    // 1. Check if a physical audio file exists in public/uploads/recordings/
    const recordingsDir = join(process.cwd(), "public", "uploads", "recordings");
    if (existsSync(recordingsDir)) {
      const candidateFiles = [
        join(recordingsDir, `${recordingId}.webm`),
        join(recordingsDir, `${recordingId}.wav`),
        join(recordingsDir, `${recordingId}.mp3`),
        join(recordingsDir, `${recordingId}.mp4`),
        join(recordingsDir, `${recordingId}`),
      ];
      for (const candidate of candidateFiles) {
        if (existsSync(candidate)) {
          const fileBuffer = await readFile(candidate);
          const ext = candidate.split(".").pop()?.toLowerCase();
          const mime =
            ext === "wav"
              ? "audio/wav"
              : ext === "mp3"
              ? "audio/mpeg"
              : ext === "mp4"
              ? "audio/mp4"
              : "audio/webm";

          return new NextResponse(new Uint8Array(fileBuffer), {
            status: 200,
            headers: {
              "Content-Type": mime,
              "Content-Length": fileBuffer.length.toString(),
              "Content-Disposition": `inline; filename="${recordingId}.${ext}"`,
              "Accept-Ranges": "bytes",
              "Cache-Control": "public, max-age=86400",
            },
          });
        }
      }
    }

    // 2. Lookup call log or queue item for provider recordingUrl
    const callLog = await db.staffCallLog.findFirst({
      where: {
        OR: [
          { id: recordingId },
          { recordingUrl: { contains: recordingId } },
          { notes: { contains: recordingId } },
        ],
      },
      select: { id: true, recordingUrl: true, durationSeconds: true },
    });

    const targetUrl =
      callLog?.recordingUrl ||
      (
        await db.callingQueueItem.findFirst({
          where: {
            OR: [
              { id: recordingId },
              { recordingUrl: { contains: recordingId } },
              { providerCallId: recordingId },
            ],
          },
          select: { recordingUrl: true },
        })
      )?.recordingUrl;

    if (targetUrl) {
      // If Twilio authenticated recording URL
      if (targetUrl.includes("api.twilio.com")) {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;

        if (accountSid && authToken) {
          const streamUrl = targetUrl.endsWith(".mp3") || targetUrl.endsWith(".wav") ? targetUrl : `${targetUrl}.mp3`;
          const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
          const twilioRes = await fetch(streamUrl, {
            headers: { Authorization: `Basic ${basicAuth}` },
          });

          if (twilioRes.ok && twilioRes.body) {
            const contentType = twilioRes.headers.get("content-type") || "audio/mpeg";
            return new NextResponse(twilioRes.body, {
              status: 200,
              headers: {
                "Content-Type": contentType,
                "Cache-Control": "private, max-age=3600",
                "Accept-Ranges": "bytes",
              },
            });
          }
        }
      }

      // External or S3 presigned URL
      if (targetUrl.startsWith("http://") || targetUrl.startsWith("https://")) {
        return NextResponse.redirect(targetUrl);
      }
    }

    // 3. No recording file or provider asset found - return clean 404 without synthetic generation
    return NextResponse.json(
      {
        success: false,
        error: "Call recording is not available or still being processed by the carrier provider.",
        recordingId,
      },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("[Recordings API Error]:", error);
    return NextResponse.json({ success: false, error: "Failed to stream audio recording" }, { status: 500 });
  }
}
