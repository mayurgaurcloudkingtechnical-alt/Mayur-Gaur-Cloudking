import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { randomBytes } from "crypto";

// Allowed mime types for student and staff photos
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file type. Only JPEG, PNG, WEBP, and GIF images are permitted.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: "File size exceeds the 5MB limit.",
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique safe filename
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const cleanExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
    const uniqueId = randomBytes(12).toString("hex");
    const fileName = `photo_${Date.now()}_${uniqueId}.${cleanExt}`;

    // Ensure upload directory exists
    const uploadDir = join(process.cwd(), "public", "uploads", "photos");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/photos/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName,
      size: file.size,
      mimeType: file.type,
    });
  } catch (error: any) {
    console.error("[Upload API Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to upload file." },
      { status: 500 }
    );
  }
}
