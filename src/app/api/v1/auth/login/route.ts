import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyUserCredentials } from "@/server/auth/verify-credentials";
import { NativeTokenService } from "@/server/auth/native-token.service";

const loginSchema = z.object({
  identifier: z.string().optional(),
  email: z.string().optional(),
  password: z.string().min(1, "Password is required"),
  deviceId: z.string().optional(),
  deviceName: z.string().optional(),
  platform: z.enum(["ANDROID", "IOS", "WINDOWS", "MACOS", "DESKTOP", "OTHER"]).optional(),
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

    const parsed = loginSchema.safeParse(body);
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

    const rawIdentifier = (parsed.data.identifier || parsed.data.email || "").trim();
    if (!rawIdentifier) {
      return NextResponse.json(
        { error: "Identifier or email is required", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    const clientIp = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    let user;
    try {
      user = await verifyUserCredentials({
        identifier: rawIdentifier,
        password: parsed.data.password,
        clientIp,
        userAgent,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication error";
      if (message.includes("active")) {
        return NextResponse.json(
          { error: message, code: "ACCOUNT_INACTIVE" },
          { status: 403 }
        );
      }
      if (message.includes("Too many failed attempts")) {
        return NextResponse.json(
          { error: message, code: "RATE_LIMITED" },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: message, code: "AUTH_ERROR" },
        { status: 400 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid enrollment number, email, or password", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const bundle = await NativeTokenService.createSession({
      userId: user.id,
      deviceId: parsed.data.deviceId,
      deviceName: parsed.data.deviceName,
      platform: parsed.data.platform,
      ipAddress: clientIp,
      userAgent: userAgent,
    });

    return NextResponse.json(bundle, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message, code: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
