import { NextRequest } from "next/server";
import { auth } from "@/server/auth";
import { ManagementOperationsService } from "@/server/services/management/management-operations.service";
import { UserRoleCode } from "@prisma/client";

export const dynamic = "force-dynamic";

const AUTHORIZED_ROLES = [
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.DIRECTOR,
  UserRoleCode.ADMIN,
  UserRoleCode.MANAGER,
  UserRoleCode.PLACEMENT_OFFICER,
  UserRoleCode.HR,
];

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user || !AUTHORIZED_ROLES.includes(session.user.roleCode as any)) {
    return new Response(JSON.stringify({ error: "Unauthorized access to live management feed." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // 1. Initial snapshot
      try {
        const initialOverview = await ManagementOperationsService.getLiveOperationsOverview();
        controller.enqueue(
          encoder.encode(`event: initial-snapshot\ndata: ${JSON.stringify(initialOverview)}\n\n`)
        );
      } catch (err: any) {
        controller.enqueue(
          encoder.encode(`event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`)
        );
      }

      // 2. Periodic live heartbeat / delta every 5 seconds
      const interval = setInterval(async () => {
        try {
          const overview = await ManagementOperationsService.getLiveOperationsOverview();
          controller.enqueue(
            encoder.encode(`event: live-update\ndata: ${JSON.stringify(overview)}\n\n`)
          );
        } catch (e) {
          // If stream closed, clear interval
          clearInterval(interval);
        }
      }, 5000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
