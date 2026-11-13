/**
 * WhatsApp Template Automation Engine (Phase 4.2)
 * SLG CALL INTELLIGENCE — Powered by SOFTLAB GLOBAL
 * Manages approved WhatsApp templates, variable rendering, and DLT SMS compliance.
 * Strict boundary: File size <= 350 lines
 */

import { db } from "@/server/db/client";
import { TRPCError } from "@trpc/server";

export interface RenderedTemplate {
  bodyText: string;
  headerText?: string;
  footerText?: string;
  buttons?: any[];
}

export class TemplateAutomationService {
  /**
   * Default system templates pre-seeded for SoftLab Global
   */
  public static readonly DEFAULT_TEMPLATES = [
    {
      templateName: "admission_enquiry_followup",
      language: "en",
      category: "UTILITY",
      headerType: "TEXT",
      bodyText:
        "Hello {{1}}, thank you for contacting SoftLab Global regarding {{2}}. Our senior counselor will assist you shortly.",
      footerText: "SoftLab Global Tech Center",
      variableMappings: { "1": "customerName", "2": "courseName" },
    },
    {
      templateName: "call_missed_callback_notice",
      language: "en",
      category: "UTILITY",
      headerType: "TEXT",
      bodyText:
        "Hi {{1}}, we tried calling you from SoftLab Global regarding your enquiry. Please let us know a convenient time to call back.",
      footerText: "SoftLab Global Admissions",
      variableMappings: { "1": "customerName" },
    },
    {
      templateName: "fee_installment_reminder",
      language: "en",
      category: "UTILITY",
      headerType: "TEXT",
      bodyText:
        "Dear {{1}}, your fee installment of Rs. {{2}} for {{3}} is scheduled for {{4}}. Kindly proceed with payment.",
      footerText: "SoftLab Global Accounts",
      variableMappings: {
        "1": "customerName",
        "2": "amount",
        "3": "courseName",
        "4": "dueDate",
      },
    },
    {
      templateName: "class_schedule_update",
      language: "en",
      category: "UTILITY",
      headerType: "TEXT",
      bodyText:
        "Hello {{1}}, your upcoming class on {{2}} has been scheduled at {{3}} via {{4}}.",
      footerText: "SoftLab Global LMS",
      variableMappings: {
        "1": "studentName",
        "2": "subject",
        "3": "timing",
        "4": "venue",
      },
    },
  ];

  /**
   * Ensures default approved templates exist for a tenant
   */
  static async seedDefaultTemplates(tenantId: string) {
    if (!tenantId) return;

    for (const tpl of this.DEFAULT_TEMPLATES) {
      await (db as any).slgWhatsAppTemplate.upsert({
        where: {
          tenantId_templateName_language: {
            tenantId,
            templateName: tpl.templateName,
            language: tpl.language,
          },
        },
        create: {
          tenantId,
          templateName: tpl.templateName,
          language: tpl.language,
          category: tpl.category,
          status: "APPROVED",
          headerType: tpl.headerType,
          bodyText: tpl.bodyText,
          footerText: tpl.footerText,
          variableMappings: tpl.variableMappings,
        },
        update: {
          category: tpl.category,
          status: "APPROVED",
          bodyText: tpl.bodyText,
          footerText: tpl.footerText,
          variableMappings: tpl.variableMappings,
        },
      });
    }
  }

  /**
   * Retrieves all approved templates for tenant
   */
  static async listTemplates(tenantId: string, category?: string) {
    if (!tenantId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "tenantId is required" });
    }

    const where: any = { tenantId, status: "APPROVED" };
    if (category) where.category = category;

    return await (db as any).slgWhatsAppTemplate.findMany({
      where,
      orderBy: { templateName: "asc" },
    });
  }

  /**
   * Retrieves single template definition
   */
  static async getTemplate(
    tenantId: string,
    templateName: string,
    language = "en"
  ) {
    if (!tenantId || !templateName) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "tenantId and templateName are required",
      });
    }

    let tpl = await (db as any).slgWhatsAppTemplate.findFirst({
      where: { tenantId, templateName, language },
    });

    // Lazy seed if not found
    if (!tpl) {
      await this.seedDefaultTemplates(tenantId);
      tpl = await (db as any).slgWhatsAppTemplate.findFirst({
        where: { tenantId, templateName, language },
      });
    }

    return tpl;
  }

  /**
   * Renders template body with actual values
   * Replaces {{1}}, {{2}}, etc. or named variables
   */
  static renderTemplate(
    bodyText: string,
    params: Record<string, any> = {},
    footerText?: string | null
  ): RenderedTemplate {
    let renderedBody = bodyText;

    // Numerical index replacement {{1}}, {{2}}...
    Object.keys(params).forEach((key) => {
      const val = String(params[key] ?? "");
      const indexPattern = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      renderedBody = renderedBody.replace(indexPattern, val);
    });

    return {
      bodyText: renderedBody,
      footerText: footerText || undefined,
    };
  }

  /**
   * Validates parameter presence against template variable mappings
   */
  static validateParams(
    template: { bodyText: string; variableMappings?: any },
    params: Record<string, any>
  ): { isValid: boolean; missingParams: string[] } {
    const matches = template.bodyText.match(/\{\{(\w+)\}\}/g) || [];
    const requiredKeys = matches.map((m) => m.replace(/[\{\}]/g, ""));
    const missingParams: string[] = [];

    for (const key of requiredKeys) {
      if (params[key] === undefined || params[key] === null || params[key] === "") {
        missingParams.push(key);
      }
    }

    return {
      isValid: missingParams.length === 0,
      missingParams,
    };
  }
}
