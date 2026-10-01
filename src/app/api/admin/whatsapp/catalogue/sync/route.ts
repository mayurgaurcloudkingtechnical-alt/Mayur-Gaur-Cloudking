import { NextResponse, type NextRequest } from "next/server";
import { WhatsAppCatalogueSyncService } from "@/server/services/whatsapp-catalogue-sync.service";
import { auth } from "@/server/auth";
import { UserRoleCode } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * Super Admin WhatsApp Catalogue Synchronization API
 * POST: Triggers catalog sync between LMS Course Master and Meta WhatsApp Business Catalogue
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    // Verify Super Admin, Director, or Admin access (or secret cron header if configured)
    const cronSecret = req.headers.get("x-cron-secret");
    const validCronSecret = process.env.CRON_SECRET || "slg_catalog_sync_cron_2026";
    const isCronAuthorized = cronSecret && cronSecret === validCronSecret;

    const userRole = (session?.user as any)?.roleCode;
    const isUserAuthorized =
      userRole === UserRoleCode.SUPER_ADMIN ||
      userRole === UserRoleCode.DIRECTOR ||
      userRole === UserRoleCode.ADMIN;

    if (!isCronAuthorized && !isUserAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized. Super Admin access required." },
        { status: 401 }
      );
    }

    const syncResult = await WhatsAppCatalogueSyncService.syncAllCourses();

    return NextResponse.json({
      status: syncResult.success ? "success" : "partial_error",
      ...syncResult,
    });
  } catch (error: any) {
    console.error("[WhatsAppCatalogueSync API Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to synchronize WhatsApp catalogue" },
      { status: 500 }
    );
  }
}

/**
 * GET: Check current catalogue sync status
 */
export async function GET() {
  try {
    const status = await WhatsAppCatalogueSyncService.getCatalogueStatus();
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
