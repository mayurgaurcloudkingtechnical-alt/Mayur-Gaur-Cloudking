import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { randomBytes } from "crypto";

const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25 MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("audio") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No audio file provided in request." },
        { status: 400 }
      );
    }

    if (file.size > MAX_AUDIO_SIZE) {
      return NextResponse.json(
        { success: false, error: "Audio recording exceeds 25MB limit." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine clean file extension
    let ext = "webm";
    if (file.type.includes("wav")) ext = "wav";
    else if (file.type.includes("ogg")) ext = "ogg";
    else if (file.type.includes("mp4") || file.type.includes("m4a")) ext = "mp4";
    else if (file.type.includes("webm")) ext = "webm";

    const uniqueId = randomBytes(8).toString("hex");
    const fileName = `call_rec_${Date.now()}_${uniqueId}.${ext}`;

    const uploadDir = join(process.cwd(), "public", "uploads", "recordings");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    const recordingUrl = `/uploads/recordings/${fileName}`;

    return NextResponse.json({
      success: true,
      recordingUrl,
      fileName,
      sizeBytes: buffer.length,
    });
  } catch (error: any) {
    console.error("[Recordings Upload Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to upload audio recording." },
      { status: 500 }
    );
  }
}
