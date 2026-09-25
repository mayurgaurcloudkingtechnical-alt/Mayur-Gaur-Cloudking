import { NextResponse } from "next/server";
import { z } from "zod";
import { NativeTokenService } from "@/server/auth/native-token.service";

const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST(req: Request) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    const parsed = refreshSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const clientIp = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    try {
      const bundle = await NativeTokenService.refreshSession({
        refreshToken: parsed.data.refreshToken,
        ipAddress: clientIp,
        userAgent: userAgent,
      });

      return NextResponse.json(bundle, { status: 200 });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Token refresh failed";
      return NextResponse.json(
        { error: message, code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message, code: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
