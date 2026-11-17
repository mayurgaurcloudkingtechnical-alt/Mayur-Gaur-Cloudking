import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["SUPER_ADMIN", "DIRECTOR", "ADMIN", "MANAGER", "HR", "COUNSELOR", "TELECALLER"];
const MEDIA_ROOT = path.join(process.cwd(), "storage", "whatsapp-media");

export async function GET(req: NextRequest, context: { params: Promise<{ fileName: string }> }) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  const token =
    (await getToken({ req, secret, secureCookie: true }).catch(() => null)) ||
    (await getToken({ req, secret, secureCookie: false }).catch(() => null));

  if (!token?.sub || !ALLOWED_ROLES.includes(String(token.roleCode || ""))) {
    return NextResponse.json({ error: "Unauthorized media access" }, { status: 401 });
  }

  const { fileName } = await context.params;
  const safeName = path.basename(decodeURIComponent(fileName || ""));
  if (!safeName || safeName.includes("..")) {
    return NextResponse.json({ error: "Invalid file name" }, { status: 400 });
  }

  const fullPath = path.join(MEDIA_ROOT, safeName);
  try {
    const data = await fs.readFile(fullPath);
    const ext = path.extname(safeName).toLowerCase();
    const contentType =
      ext === ".jpg" || ext === ".jpeg"
        ? "image/jpeg"
        : ext === ".png"
          ? "image/png"
          : ext === ".pdf"
            ? "application/pdf"
            : ext === ".mp4"
              ? "video/mp4"
              : ext === ".ogg"
                ? "audio/ogg"
                : ext === ".mp3"
                  ? "audio/mpeg"
                  : "application/octet-stream";

    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${safeName}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Media file not found" }, { status: 404 });
  }
}
