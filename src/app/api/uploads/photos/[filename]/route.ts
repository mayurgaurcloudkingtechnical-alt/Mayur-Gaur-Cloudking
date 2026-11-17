import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join, basename } from "path";
import { existsSync } from "fs";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const safeName = basename(params.filename);
    const filePath = join(process.cwd(), "public", "uploads", "photos", safeName);
    if (!existsSync(filePath)) {
      return new NextResponse("Not found", { status: 404 });
    }
    const buf = await readFile(filePath);
    const ext = safeName.split(".").pop()?.toLowerCase();
    const contentType =
      ext === "png"
        ? "image/png"
        : ext === "webp"
        ? "image/webp"
        : ext === "gif"
        ? "image/gif"
        : "image/jpeg";

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Error reading file", { status: 500 });
  }
}
