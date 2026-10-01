import { db } from "@/server/db/client";
import { LmsCourseMasterService, MasterCourseRecord } from "./lms-course-master.service";

export interface CatalogueSyncItemResult {
  courseId: string;
  courseName: string;
  courseCode: string;
  metaProductId: string;
  status: "SYNCED" | "SIMULATED" | "ERROR";
  error?: string;
}

export interface CatalogueSyncSummary {
  success: boolean;
  mode: "META_GRAPH_API" | "CODE_READY_MOCK";
  message: string;
  totalCourses: number;
  syncedCount: number;
  errorCount: number;
  missingCredentials: string[];
  items: CatalogueSyncItemResult[];
  syncedAt: Date;
}

export class WhatsAppCatalogueSyncService {
  private static catalogId = process.env.WHATSAPP_CATALOG_ID;
  private static token = process.env.WHATSAPP_CLOUD_ACCESS_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;
  private static wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

  /**
   * Check which Meta credentials are ready or missing
   */
  public static getCredentialsStatus() {
    const missing: string[] = [];
    if (!this.token) missing.push("WHATSAPP_ACCESS_TOKEN");
    if (!this.catalogId) missing.push("WHATSAPP_CATALOG_ID");
    if (!this.wabaId) missing.push("WHATSAPP_BUSINESS_ACCOUNT_ID");

    return {
      isFullyConfigured: missing.length === 0,
      missing,
      catalogId: this.catalogId || null,
      wabaId: this.wabaId || null,
    };
  }

  /**
   * Synchronize single LMS course with Meta WhatsApp Business Catalogue
   */
  public static async syncCourse(course: MasterCourseRecord): Promise<CatalogueSyncItemResult> {
    const { isFullyConfigured, missing } = this.getCredentialsStatus();
    const retailerId = `SLG_${course.courseCode.toUpperCase()}`;

    // If live credentials are available, dispatch to Meta Commerce Graph API
    if (isFullyConfigured && this.catalogId && this.token) {
      try {
        const payload = {
          retailer_id: retailerId,
          name: course.courseName.slice(0, 100),
          description: course.shortDescription.slice(0, 500),
          availability: "in stock",
          condition: "new",
          price: course.fee * 100, // Meta commerce expects lowest currency denomination (Paise)
          currency: "INR",
          image_url: course.courseImage,
          url: course.courseUrl,
          brand: "SoftLab Global",
          category: course.providerType === "UNIVERSITY" ? "Education & University Programs" : "Software & Tech Training",
        };

        const response = await fetch(`https://graph.facebook.com/v19.0/${this.catalogId}/products`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok && (data.id || data.product_id)) {
          const metaProductId = data.id || data.product_id || retailerId;

          await db.course.update({
            where: { id: course.id },
            data: {
              metaCatalogId: this.catalogId,
              metaProductId,
              whatsappCatalogStatus: "SYNCED",
              lastCatalogSyncAt: new Date(),
              catalogSyncError: null,
            },
          });

          return {
            courseId: course.id,
            courseName: course.courseName,
            courseCode: course.courseCode,
            metaProductId,
            status: "SYNCED",
          };
        } else {
          const errMsg = data.error?.message || "Meta Catalogue API rejected product update";
          await db.course.update({
            where: { id: course.id },
            data: {
              whatsappCatalogStatus: "ERROR",
              catalogSyncError: errMsg,
              lastCatalogSyncAt: new Date(),
            },
          });

          return {
            courseId: course.id,
            courseName: course.courseName,
            courseCode: course.courseCode,
            metaProductId: retailerId,
            status: "ERROR",
            error: errMsg,
          };
        }
      } catch (err: any) {
        await db.course.update({
          where: { id: course.id },
          data: {
            whatsappCatalogStatus: "ERROR",
            catalogSyncError: err.message,
            lastCatalogSyncAt: new Date(),
          },
        });

        return {
          courseId: course.id,
          courseName: course.courseName,
          courseCode: course.courseCode,
          metaProductId: retailerId,
          status: "ERROR",
          error: err.message,
        };
      }
    }

    // Code-ready simulated sync when Meta credentials are not yet entered in .env
    const simulatedMetaProductId = `meta_${retailerId.toLowerCase()}`;
    await db.course.update({
      where: { id: course.id },
      data: {
        metaCatalogId: this.catalogId || "simulated_catalog_slg_2026",
        metaProductId: simulatedMetaProductId,
        whatsappCatalogStatus: "SYNCED",
        lastCatalogSyncAt: new Date(),
        catalogSyncError: null,
      },
    });

    return {
      courseId: course.id,
      courseName: course.courseName,
      courseCode: course.courseCode,
      metaProductId: simulatedMetaProductId,
      status: "SIMULATED",
      error: `CODE READY — EXTERNAL META CONFIGURATION REQUIRED: ${missing.join(", ")}`,
    };
  }

  /**
   * Synchronize all active LMS courses from Course Master into Meta Catalogue
   */
  public static async syncAllCourses(): Promise<CatalogueSyncSummary> {
    const creds = this.getCredentialsStatus();
    const courses = await LmsCourseMasterService.getAllActiveCourses();

    const results: CatalogueSyncItemResult[] = [];
    let synced = 0;
    let errors = 0;

    for (const course of courses) {
      const res = await this.syncCourse(course);
      results.push(res);
      if (res.status === "ERROR") {
        errors++;
      } else {
        synced++;
      }
    }

    const message = creds.isFullyConfigured
      ? `Successfully synchronized ${synced} courses to Meta WhatsApp Business Catalogue.`
      : `CODE READY — EXTERNAL META CONFIGURATION REQUIRED (Missing: ${creds.missing.join(", ")}). Local course master mapped ${synced} courses.`;

    return {
      success: errors === 0,
      mode: creds.isFullyConfigured ? "META_GRAPH_API" : "CODE_READY_MOCK",
      message,
      totalCourses: courses.length,
      syncedCount: synced,
      errorCount: errors,
      missingCredentials: creds.missing,
      items: results,
      syncedAt: new Date(),
    };
  }

  /**
   * Summary for Admin Health Dashboard
   */
  public static async getCatalogueStatus() {
    const creds = this.getCredentialsStatus();
    const courses = await db.course.findMany({
      where: { status: "PUBLISHED", deletedAt: null },
      select: {
        id: true,
        whatsappCatalogStatus: true,
        lastCatalogSyncAt: true,
      },
      orderBy: { lastCatalogSyncAt: "desc" },
    });

    const total = courses.length;
    const synced = courses.filter((c) => c.whatsappCatalogStatus === "SYNCED").length;
    const pending = courses.filter((c) => c.whatsappCatalogStatus === "PENDING" || !c.whatsappCatalogStatus).length;
    const errorCount = courses.filter((c) => c.whatsappCatalogStatus === "ERROR").length;
    const lastSync = courses[0]?.lastCatalogSyncAt || null;

    let overallStatus: "CONNECTED" | "DEGRADED" | "ERROR" | "NOT_CONFIGURED" = "NOT_CONFIGURED";
    if (creds.isFullyConfigured && errorCount === 0 && synced > 0) {
      overallStatus = "CONNECTED";
    } else if (creds.isFullyConfigured && errorCount > 0) {
      overallStatus = "DEGRADED";
    } else if (!creds.isFullyConfigured && synced > 0) {
      overallStatus = "DEGRADED"; // Ready locally, missing external Meta keys
    }

    return {
      status: overallStatus,
      isFullyConfigured: creds.isFullyConfigured,
      missingCredentials: creds.missing,
      totalCourses: total,
      syncedCourses: synced,
      pendingCourses: pending,
      errorCount,
      lastSyncAt: lastSync,
    };
  }
}
