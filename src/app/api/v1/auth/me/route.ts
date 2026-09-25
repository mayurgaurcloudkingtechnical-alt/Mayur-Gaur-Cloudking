import { NextResponse } from "next/server";
import { NativeTokenService } from "@/server/auth/native-token.service";
import { db } from "@/server/db/client";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or malformed Authorization header", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7).trim();
  const payload = await NativeTokenService.verifyAccessToken(token);

  if (!payload) {
    return NextResponse.json(
      { error: "Invalid or expired access token", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const user = await db.user.findUnique({
    where: { id: payload.userId },
    include: {
      role: {
        select: {
          permissions: true,
        },
      },
    },
  });

  if (!user || user.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "User account inactive or not found", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  return NextResponse.json(
    {
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        roleCode: user.roleCode,
        permissions: user.role.permissions,
      },
      session: {
        id: payload.sessionId,
      },
    },
    { status: 200 }
  );
}
