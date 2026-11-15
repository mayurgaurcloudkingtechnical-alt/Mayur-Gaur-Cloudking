import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const dynamic = "force-dynamic";

const WA_GATEWAY_URL = process.env.LOCAL_WHATSAPP_GATEWAY_URL || "http://127.0.0.1:3099";

async function requireAdmin(req: NextRequest) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  const token =
    (await getToken({ req, secret, secureCookie: true }).catch(() => null)) ||
    (await getToken({ req, secret, secureCookie: false }).catch(() => null));
  const role = String(token?.roleCode || "");
  return ["SUPER_ADMIN", "DIRECTOR", "ADMIN", "MANAGER"].includes(role);
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const res = await fetch(`${WA_GATEWAY_URL}/status`, { cache: "no-store", signal: AbortSignal.timeout(4000) });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { connected: false, status: "OFFLINE", error: err?.message || "Gateway offline" },
      { status: 503 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const action = body.action || "send";
    if (action === "logout" || action === "reset") {
      const res = await fetch(`${WA_GATEWAY_URL}/logout`, { method: "POST", signal: AbortSignal.timeout(5000) });
      return NextResponse.json(await res.json());
    }
    const res = await fetch(`${WA_GATEWAY_URL}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: body.to, text: body.text }),
      signal: AbortSignal.timeout(10000),
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed" }, { status: 500 });
  }
}
