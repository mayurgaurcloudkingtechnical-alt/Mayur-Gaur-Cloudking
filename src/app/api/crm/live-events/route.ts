import { NextRequest } from "next/server";
import { auth } from "@/server/auth";
import { crmEventBus, CrmLiveEvent } from "@/server/services/crm-event-bus.service";
import { UserRoleCode } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = session.user.id;
  const userRole = (session.user as any).roleCode as UserRoleCode;

  const isManagement =
    userRole === UserRoleCode.SUPER_ADMIN ||
    userRole === UserRoleCode.DIRECTOR ||
    userRole === UserRoleCode.ADMIN ||
    userRole === UserRoleCode.MANAGER;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 1. Send initial connection confirmation
      const initMessage = `data: ${JSON.stringify({
        type: "INITIAL_CONNECTED",
        userId,
        serverTime: new Date().toISOString(),
        timeZone: "Asia/Kolkata",
      })}\n\n`;
      controller.enqueue(encoder.encode(initMessage));

      // 2. Listener for live CRM events
      const unsubscribe = crmEventBus.onEvent((event: CrmLiveEvent) => {
        // Role-based visibility check
        if (!isManagement && event.recipientUserIds && event.recipientUserIds.length > 0) {
          if (!event.recipientUserIds.includes(userId)) {
            return; // Not permitted to receive this specific event
          }
        }

        try {
          const payload = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch (_) {
          // Client disconnected
        }
      });

      // 3. Heartbeat ping every 25 seconds to keep connection alive
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch (_) {
          clearInterval(pingInterval);
        }
      }, 25000);

      // Clean up on disconnect
      req.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
        unsubscribe();
        try {
          controller.close();
        } catch (_) {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable buffering in Nginx if applicable
    },
  });
}
