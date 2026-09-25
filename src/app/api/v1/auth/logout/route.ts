import { NextResponse } from "next/server";
import { z } from "zod";
import { NativeTokenService } from "@/server/auth/native-token.service";

const logoutSchema = z.object({
  refreshToken: z.string().optional(),
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
    let body: { refreshToken?: string } = {};
    try {
      body = await req.json();
    } catch {
      // Body may be empty if Bearer token is provided
    }

    const parsed = logoutSchema.safeParse(body);
    const refreshToken = parsed.success ? parsed.data.refreshToken : undefined;

    let sessionId: string | undefined;

    // Check if Bearer token is present in header
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      const verified = await NativeTokenService.verifyAccessToken(token);
      if (verified) {
        sessionId = verified.sessionId;
      }
    }

    if (!refreshToken && !sessionId) {
      return NextResponse.json(
        { error: "Provide either refreshToken or Authorization Bearer header", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    const clientIp = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    await NativeTokenService.revokeSession({
      refreshToken,
      sessionId,
      ipAddress: clientIp,
      userAgent,
    });

    return NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message, code: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
