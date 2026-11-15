import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const WA_GATEWAY_URL = process.env.LOCAL_WHATSAPP_GATEWAY_URL || "http://127.0.0.1:3099";

export async function GET(req: NextRequest) {
  const staffId = req.nextUrl.searchParams.get("staffId") || "";
  if (!staffId) {
    return NextResponse.json({ error: "staffId required" }, { status: 400 });
  }
  try {
    const res = await fetch(
      `${WA_GATEWAY_URL}/phone/poll?staffId=${encodeURIComponent(staffId)}`,
      { cache: "no-store", signal: AbortSignal.timeout(3500) }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ paired: false, command: null, error: err?.message }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${WA_GATEWAY_URL}/phone/ack`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(3500),
    });
    return NextResponse.json(await res.json());
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
