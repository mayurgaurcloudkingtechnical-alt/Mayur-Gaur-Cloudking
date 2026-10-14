import fs from "fs";
import path from "path";
import { db } from "@/server/db/client";
import { LmsCourseMasterService, MasterCourseRecord } from "./lms-course-master.service";
import { WhatsAppBusinessConfigService } from "./whatsapp-business-config.service";

export interface CatalogueSyncItemResult {
  courseId: string;
  courseName: string;
  courseCode: string;
  metaProductId: string;
  status: "SYNCED" | "SIMULATED" | "ERROR" | "FEED_READY";
  error?: string;
}

export interface CatalogueSyncSummary {
  success: boolean;
  mode: "META_GRAPH_API" | "CODE_READY_MOCK" | "NEW_CATALOGUE_FEED";
  message: string;
  totalCourses: number;
  syncedCount: number;
  errorCount: number;
  missingCredentials: string[];
  items: CatalogueSyncItemResult[];
  syncedAt: Date;
  catalogueName?: string;
  csvPublicUrl?: string;
  jsonPublicUrl?: string;
}

const SITE_ORIGIN = "https://www.softlabglobal.com";
const BRAND = "SoftLab Global";
const NEW_CATALOGUE_NAME = "SoftLab Global Course Catalogue 2026";

function resolveCourseImage(slug: string, title: string, thumbnailUrl?: string | null): string {
  if (thumbnailUrl) {
    if (
      !thumbnailUrl.startsWith("http://localhost") &&
      !thumbnailUrl.startsWith("https://localhost")
    ) {
      if (thumbnailUrl.startsWith("http")) return thumbnailUrl;
      if (thumbnailUrl.startsWith("/")) return `${SITE_ORIGIN}${thumbnailUrl}`;
    }
  }

  const lower = `${slug} ${title}`.toLowerCase();
  let relative = "/courses/softlab-global-poster.jpg";

  if (lower.includes("networking") || slug === "certificate-in-advance-networking") {
    relative = "/courses/networking-brochure.jpg";
  } else if (lower.includes("linux")) {
    relative = "/courses/linux-admin-brochure.jpg";
  } else if (lower.includes("server") && !lower.includes("sql")) {
    relative = "/courses/server-admin-brochure.jpg";
  } else if (lower.includes("office 365") || lower.includes("365")) {
    relative = "/courses/office-365-brochure.jpg";
  } else if (lower.includes("cloud computing & cyber") || lower.includes("cloud-computing-and-cyber")) {
    relative = "/courses/cloud-cyber-ai-brochure.jpg";
  } else if (lower.includes("devops")) {
    relative = "/courses/devops-brochure.jpg";
  } else if (lower.includes("cloud-administration") || lower.includes("cloud administration")) {
    relative = "/courses/cloud-admin-brochure.jpg";
  } else if (lower.includes("c++") || lower.includes("cpp")) {
    relative = "/courses/cpp-programming-brochure.jpg";
  } else if (lower.includes("c language") || slug === "certificate-in-c-language") {
    relative = "/courses/c-programming-brochure.jpg";
  } else if (lower.includes("java")) {
    relative = "/courses/java-full-stack-brochure.jpg";
  } else if (lower.includes("python")) {
    relative = "/courses/python-full-stack-brochure.jpg";
  } else if (lower.includes("mern")) {
    relative = "/courses/mern-full-stack-brochure.jpg";
  } else if (lower.includes("mysql")) {
    relative = "/courses/mysql-brochure.jpg";
  } else if (lower.includes("oracle")) {
    relative = "/courses/oracle-dba-brochure.jpg";
  } else if (lower.includes("graphics")) {
    relative = "/courses/graphics-designing-brochure.jpg";
  } else if (lower.includes("web development") || lower.includes("website")) {
    relative = "/courses/web-development-brochure.jpg";
  } else if (lower.includes("marketing") || lower.includes("seo")) {
    relative = "/courses/digital-marketing-brochure.jpg";
  } else if (lower.includes("technical support")) {
    relative = "/courses/technical-support-brochure.jpg";
  } else if (lower.includes("cyber") || lower.includes("security")) {
    relative = "/courses/cyber-security-brochure.jpg";
  } else if (lower.includes("data science")) {
    relative = "/courses/data-science-brochure.jpg";
  } else if (
    lower.includes("artificial intelligence") ||
    lower.includes("machine learning") ||
    /\bai\b/.test(lower)
  ) {
    relative = "/courses/ai-ml-brochure.jpg";
  } else {
    relative = "/images/softlab-logo.png";
  }

  return `${SITE_ORIGIN}${relative}`;
}

function buildRetailerId(course: MasterCourseRecord): string {
  const raw = (course.courseCode || course.id)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
  return `SLG_${raw}`;
}

function buildProfessionalDescription(course: MasterCourseRecord): string {
  const slug = course.courseUrl.replace(/^https?:\/\/[^/]+\/courses\//, "") || course.id;
  const summary = (course.shortDescription || course.courseName).trim();
  const parts = [
    summary.endsWith(".") ? summary : `${summary}.`,
    `Duration: ${course.duration}.`,
    `Mode: ${course.mode}.`,
    `Campus: ${course.branch}, SoftLab Global.`,
    course.providerType === "UNIVERSITY"
      ? `University pathway via ${course.providerName}.`
      : "Industry-aligned SoftLab Global professional certification with live labs.",
    course.placementInfo,
    `Full course details: ${SITE_ORIGIN}/courses/${slug}`,
  ];
  return parts.join(" ").replace(/\s+/g, " ").trim().slice(0, 900);
}

function csvEscape(value: string): string {
  const needsQuotes = /[",\n\r]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

export class WhatsAppCatalogueSyncService {
  /**
   * Check which Meta credentials are ready or missing
   */
  public static async getCredentialsStatus() {
    const config = await WhatsAppBusinessConfigService.getConfig();
    const token = config.accessToken;
    const catalogId = config.catalogId;
    const wabaId = config.wabaId;

    const missing: string[] = [];
    if (!token) missing.push("WHATSAPP_ACCESS_TOKEN");
    if (!catalogId) missing.push("WHATSAPP_CATALOG_ID");
    if (!wabaId) missing.push("WHATSAPP_BUSINESS_ACCOUNT_ID");

    return {
      isFullyConfigured: missing.length === 0,
      missing,
      catalogId: catalogId || null,
      wabaId: wabaId || null,
      token: token || null,
    };
  }

  /**
   * Create a brand-new professional WhatsApp / Meta Commerce catalogue feed
   * from all active SoftLab Global LMS courses.
   *
   * Intentionally does NOT push products into any existing Meta catalogue ID.
   * Output files are uploaded manually (or later via scheduled feed URL) into a NEW catalogue.
   */
  public static async createBrandNewCatalogueFeed(): Promise<CatalogueSyncSummary> {
    const courses = await LmsCourseMasterService.getAllActiveCourses();
    const generatedAt = new Date();
    const items: CatalogueSyncItemResult[] = [];
    const productRows: string[] = [];

    const headers = [
      "id",
      "title",
      "description",
      "availability",
      "condition",
      "price",
      "sale_price",
      "link",
      "image_link",
      "brand",
      "google_product_category",
      "fb_product_category",
      "product_type",
      "custom_label_0",
      "custom_label_1",
      "custom_label_2",
      "custom_label_3",
      "custom_label_4",
      "quantity_to_sell_on_facebook",
      "status",
      "wa_compliance_category",
    ];

    const jsonProducts: Array<Record<string, unknown>> = [];

    for (const course of courses) {
      const slug =
        course.courseUrl.replace(/^https?:\/\/[^/]+\/courses\//, "") || course.id;
      const retailerId = buildRetailerId(course);
      const link = `${SITE_ORIGIN}/courses/${slug}`;
      const imageLink = resolveCourseImage(slug, course.courseName, course.courseImage);
      const description = buildProfessionalDescription(course);
      const price = `${course.fee.toFixed(2)} INR`;
      const salePrice =
        course.discountedFee && course.discountedFee > 0 && course.discountedFee < course.fee
          ? `${course.discountedFee.toFixed(2)} INR`
          : "";
      const providerLabel =
        course.providerType === "UNIVERSITY" ? "University Pathway" : "SoftLab Professional";
      const fbCategory =
        course.providerType === "UNIVERSITY"
          ? "Education > University Programs"
          : "Education > Adult Education > Professional Training";
      const productType =
        course.providerType === "UNIVERSITY"
          ? "Education > University Degrees & Diplomas > SoftLab Global"
          : "Education > Professional IT Training > SoftLab Global Certificates";

      const rowValues = [
        retailerId,
        course.courseName.slice(0, 150),
        description,
        "in stock",
        "new",
        price,
        salePrice,
        link,
        imageLink,
        BRAND,
        "Education & Teaching Materials",
        fbCategory,
        productType,
        providerLabel,
        course.category.slice(0, 100),
        course.duration.slice(0, 100),
        "Civil Lines, Prayagraj",
        course.courseCode.slice(0, 100),
        "999",
        "active",
        "COUNTRY_ORIGIN_EXEMPT",
      ];

      productRows.push(rowValues.map((v) => csvEscape(String(v))).join(","));

      jsonProducts.push({
        id: retailerId,
        title: course.courseName,
        description,
        availability: "in stock",
        condition: "new",
        price,
        sale_price: salePrice || undefined,
        link,
        image_link: imageLink,
        brand: BRAND,
        product_type: productType,
        custom_label_0: providerLabel,
        courseId: course.id,
        slug,
        feeInr: course.fee,
      });

      await db.course.update({
        where: { id: course.id },
        data: {
          metaCatalogId: null, // do not attach to any existing Meta catalogue
          metaProductId: retailerId,
          whatsappCatalogStatus: "PENDING",
          lastCatalogSyncAt: generatedAt,
          catalogSyncError: null,
        },
      });

      items.push({
        courseId: course.id,
        courseName: course.courseName,
        courseCode: course.courseCode,
        metaProductId: retailerId,
        status: "FEED_READY",
      });
    }

    const publicDir = path.join(process.cwd(), "public");
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const csv = [headers.join(","), ...productRows].join("\n") + "\n";
    fs.writeFileSync(path.join(publicDir, "whatsapp-catalog.csv"), csv, "utf-8");

    const softlabCount = jsonProducts.filter((p) => p.custom_label_0 === "SoftLab Professional").length;
    const universityCount = jsonProducts.filter((p) => p.custom_label_0 === "University Pathway").length;

    const jsonPayload = {
      catalogueName: NEW_CATALOGUE_NAME,
      brand: BRAND,
      website: SITE_ORIGIN,
      generatedAt: generatedAt.toISOString(),
      doNotSyncExistingCatalogue: true,
      totalProducts: jsonProducts.length,
      softlabProfessionalCourses: softlabCount,
      universityPathwayCourses: universityCount,
      products: jsonProducts,
    };
    fs.writeFileSync(
      path.join(publicDir, "whatsapp-catalog.json"),
      JSON.stringify(jsonPayload, null, 2),
      "utf-8"
    );

    const manifest = {
      catalogueName: NEW_CATALOGUE_NAME,
      purpose: "Brand-new WhatsApp Business / Meta Commerce catalogue for SoftLab Global",
      doNotSyncExistingCatalogue: true,
      website: SITE_ORIGIN,
      generatedAt: generatedAt.toISOString(),
      totalProducts: jsonProducts.length,
      softlabProfessionalCourses: softlabCount,
      universityPathwayCourses: universityCount,
      files: {
        csvFeed: "/whatsapp-catalog.csv",
        jsonFeed: "/whatsapp-catalog.json",
        publicCsvUrl: `${SITE_ORIGIN}/whatsapp-catalog.csv`,
        publicJsonUrl: `${SITE_ORIGIN}/whatsapp-catalog.json`,
      },
      metaCommerceManagerSteps: [
        "Open Meta Commerce Manager → Catalogues → Create catalogue",
        `Choose Ecommerce → name it: ${NEW_CATALOGUE_NAME}`,
        "Add items → Upload CSV / scheduled feed → use https://www.softlabglobal.com/whatsapp-catalog.csv",
        "Connect the NEW catalogue to your WhatsApp Business Account",
        "Paste the new Catalogue ID into SoftLab Admin → WhatsApp Configure Credentials",
      ],
    };
    fs.writeFileSync(
      path.join(publicDir, "whatsapp-catalog-manifest.json"),
      JSON.stringify(manifest, null, 2),
      "utf-8"
    );

    return {
      success: true,
      mode: "NEW_CATALOGUE_FEED",
      message: `Created brand-new professional WhatsApp catalogue feed with ${courses.length} SoftLab Global courses. Upload ${SITE_ORIGIN}/whatsapp-catalog.csv into a NEW Meta catalogue — do not sync an existing one.`,
      totalCourses: courses.length,
      syncedCount: courses.length,
      errorCount: 0,
      missingCredentials: [],
      items,
      syncedAt: generatedAt,
      catalogueName: NEW_CATALOGUE_NAME,
      csvPublicUrl: `${SITE_ORIGIN}/whatsapp-catalog.csv`,
      jsonPublicUrl: `${SITE_ORIGIN}/whatsapp-catalog.json`,
    };
  }

  /**
   * Preferred catalogue action: always create a brand-new feed from Course Master.
   * Does not synchronize products into any existing Meta catalogue.
   */
  public static async syncAllCourses(): Promise<CatalogueSyncSummary> {
    return this.createBrandNewCatalogueFeed();
  }

  /**
   * Summary for Admin Health Dashboard
   */
  public static async getCatalogueStatus() {
    const creds = await this.getCredentialsStatus();
    const courses = await db.course.findMany({
      where: { status: "PUBLISHED", deletedAt: null },
      select: {
        id: true,
        whatsappCatalogStatus: true,
        lastCatalogSyncAt: true,
        metaProductId: true,
      },
      orderBy: { lastCatalogSyncAt: "desc" },
    });

    const total = courses.length;
    const synced = courses.filter((c) => c.whatsappCatalogStatus === "SYNCED").length;
    const feedReady = courses.filter(
      (c) => c.whatsappCatalogStatus === "PENDING" && !!c.metaProductId
    ).length;
    const pending = courses.filter((c) => c.whatsappCatalogStatus === "PENDING" || !c.whatsappCatalogStatus).length;
    const errorCount = courses.filter((c) => c.whatsappCatalogStatus === "ERROR").length;
    const lastSync = courses[0]?.lastCatalogSyncAt || null;
    const preparedCount = synced + feedReady;

    let overallStatus: "CONNECTED" | "DEGRADED" | "ERROR" | "NOT_CONFIGURED" | "FEED_READY" =
      "NOT_CONFIGURED";
    if (creds.isFullyConfigured && errorCount === 0 && synced > 0) {
      overallStatus = "CONNECTED";
    } else if (feedReady > 0 && !creds.catalogId) {
      overallStatus = "FEED_READY";
    } else if (creds.isFullyConfigured && errorCount > 0) {
      overallStatus = "DEGRADED";
    } else if (!creds.isFullyConfigured && preparedCount > 0) {
      overallStatus = "FEED_READY";
    }

    return {
      status: overallStatus,
      isFullyConfigured: creds.isFullyConfigured,
      missingCredentials: creds.missing,
      totalCourses: total,
      syncedCourses: preparedCount,
      pendingCourses: pending,
      errorCount,
      lastSyncAt: lastSync,
      catalogueName: NEW_CATALOGUE_NAME,
      csvPublicUrl: `${SITE_ORIGIN}/whatsapp-catalog.csv`,
      mode: "NEW_CATALOGUE_FEED" as const,
    };
  }
}
