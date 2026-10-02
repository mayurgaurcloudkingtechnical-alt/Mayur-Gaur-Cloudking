import { db } from "@/server/db/client";

export interface WhatsAppBusinessConfig {
  phoneNumberId: string;
  wabaId: string;
  businessId: string;
  appId: string;
  accessToken: string;
  catalogId: string;
  displayPhoneNumber: string;
  verifiedName: string;
  webhookUrl: string;
  verifyToken: string;
  connectionStatus: "NOT_CONNECTED" | "CONNECTING" | "CONNECTED" | "ERROR";
  lastVerifiedAt: Date | null;
  lastError: string | null;
  onboardingMethod: "META_EMBEDDED_SIGNUP" | "DIRECT_SYSTEM_USER";
}

const SETTING_KEY = "whatsapp_business_config";

export class WhatsAppBusinessConfigService {
  /**
   * Get active WhatsApp Business configuration from database, falling back to environment variables
   */
  public static async getConfig(): Promise<WhatsAppBusinessConfig> {
    try {
      const setting = await db.systemSetting.findUnique({
        where: { key: SETTING_KEY },
      });

      const stored = (setting?.value as Partial<WhatsAppBusinessConfig>) || {};

      const envConfig: WhatsAppBusinessConfig = {
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
        wabaId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "",
        businessId: process.env.META_BUSINESS_ID || "2161320211099371",
        appId: process.env.WHATSAPP_APP_ID || "1572356260711362",
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_CLOUD_ACCESS_TOKEN || "",
        catalogId: process.env.WHATSAPP_CATALOG_ID || "",
        displayPhoneNumber: process.env.WHATSAPP_DISPLAY_PHONE || "",
        verifiedName: "SOFTLAB GLOBAL",
        webhookUrl: "https://www.softlabglobal.com/api/webhooks/whatsapp",
        verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "softlab_whatsapp_2026",
        connectionStatus: "NOT_CONNECTED",
        lastVerifiedAt: null,
        lastError: null,
        onboardingMethod: "DIRECT_SYSTEM_USER",
      };

      const resolved: WhatsAppBusinessConfig = {
        phoneNumberId: stored.phoneNumberId || envConfig.phoneNumberId,
        wabaId: stored.wabaId || envConfig.wabaId,
        businessId: stored.businessId || envConfig.businessId,
        appId: stored.appId || envConfig.appId,
        accessToken: stored.accessToken || envConfig.accessToken,
        catalogId: stored.catalogId || envConfig.catalogId,
        displayPhoneNumber: stored.displayPhoneNumber || envConfig.displayPhoneNumber,
        verifiedName: stored.verifiedName || envConfig.verifiedName,
        webhookUrl: envConfig.webhookUrl,
        verifyToken: envConfig.verifyToken,
        connectionStatus: stored.connectionStatus || (envConfig.accessToken && envConfig.phoneNumberId ? "CONNECTED" : "NOT_CONNECTED"),
        lastVerifiedAt: stored.lastVerifiedAt ? new Date(stored.lastVerifiedAt) : null,
        lastError: stored.lastError || null,
        onboardingMethod: stored.onboardingMethod || "DIRECT_SYSTEM_USER",
      };

      return resolved;
    } catch (err: any) {
      console.error("[WhatsAppBusinessConfigService] Error reading config:", err.message);
      return {
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
        wabaId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "",
        businessId: process.env.META_BUSINESS_ID || "2161320211099371",
        appId: process.env.WHATSAPP_APP_ID || "1572356260711362",
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN || "",
        catalogId: process.env.WHATSAPP_CATALOG_ID || "",
        displayPhoneNumber: "",
        verifiedName: "SOFTLAB GLOBAL",
        webhookUrl: "https://www.softlabglobal.com/api/webhooks/whatsapp",
        verifyToken: "softlab_whatsapp_2026",
        connectionStatus: "NOT_CONNECTED",
        lastVerifiedAt: null,
        lastError: err.message,
        onboardingMethod: "DIRECT_SYSTEM_USER",
      };
    }
  }

  /**
   * Update or persist WhatsApp Business configuration in database
   */
  public static async saveConfig(
    partial: Partial<WhatsAppBusinessConfig>,
    updatedBy?: string
  ): Promise<WhatsAppBusinessConfig> {
    const current = await this.getConfig();
    const updated: WhatsAppBusinessConfig = {
      ...current,
      ...partial,
    };

    if (updated.accessToken && updated.phoneNumberId) {
      updated.connectionStatus = "CONNECTED";
    }

    await db.systemSetting.upsert({
      where: { key: SETTING_KEY },
      update: {
        value: updated as any,
        category: "COMMUNICATIONS",
        isSecret: true,
        updatedBy,
      },
      create: {
        key: SETTING_KEY,
        value: updated as any,
        category: "COMMUNICATIONS",
        isSecret: true,
        updatedBy,
      },
    });

    return updated;
  }

  /**
   * Verify live Meta Graph API connection for this WhatsApp configuration
   */
  public static async verifyMetaConnection(): Promise<{
    success: boolean;
    displayPhoneNumber?: string;
    verifiedName?: string;
    qualityRating?: string;
    error?: string;
  }> {
    const config = await this.getConfig();

    if (!config.accessToken || !config.phoneNumberId) {
      return {
        success: false,
        error: "Missing WhatsApp Phone Number ID or Access Token.",
      };
    }

    try {
      const res = await fetch(
        `https://graph.facebook.com/v20.0/${config.phoneNumberId}?fields=display_phone_number,verified_name,code_verification_status,quality_rating`,
        {
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.error?.message || "Meta API error";
        await this.saveConfig({
          connectionStatus: "ERROR",
          lastError: errorMsg,
        });
        return { success: false, error: errorMsg };
      }

      await this.saveConfig({
        connectionStatus: "CONNECTED",
        displayPhoneNumber: data.display_phone_number || config.displayPhoneNumber,
        verifiedName: data.verified_name || config.verifiedName,
        lastVerifiedAt: new Date(),
        lastError: null,
      });

      return {
        success: true,
        displayPhoneNumber: data.display_phone_number,
        verifiedName: data.verified_name,
        qualityRating: data.quality_rating,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
      };
    }
  }
}
