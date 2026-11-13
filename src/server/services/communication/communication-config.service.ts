/**
 * Secure Tenant Communication Configuration Service (Phase 4.1)
 * SLG CALL INTELLIGENCE — Powered by SOFTLAB GLOBAL
 * Handles AES-256-GCM encryption for Meta Access Tokens and SMS API keys.
 * Strict boundary: File size <= 350 lines
 */

import * as crypto from "crypto";
import { db } from "@/server/db/client";
import { TRPCError } from "@trpc/server";
import {
  WhatsAppConfigInput,
  WhatsAppConfigRecord,
  SmsGatewayConfigInput,
  SmsGatewayConfigRecord,
} from "./types";

export class CommunicationConfigService {
  private static readonly ALGORITHM = "aes-256-gcm";
  private static readonly IV_LENGTH = 16;
  private static readonly TAG_LENGTH = 16;

  /**
   * Resolves encryption master key from environment, padded or hashed to 32 bytes
   */
  private static getMasterKey(): Buffer {
    const rawKey =
      process.env.SLG_COMMUNICATION_SECRET ||
      process.env.ENCRYPTION_KEY ||
      "softlab-global-communication-secret-key-32b!";
    return crypto.createHash("sha256").update(rawKey).digest();
  }

  /**
   * Encrypts plaintext string using AES-256-GCM
   * Returns format: iv:authTag:ciphertext (hex encoded)
   */
  public static encrypt(plaintext: string): string {
    if (!plaintext) return "";
    const key = this.getMasterKey();
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");
    const tag = cipher.getAuthTag();

    return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
  }

  /**
   * Decrypts AES-256-GCM payload format: iv:authTag:ciphertext
   */
  public static decrypt(cipherText: string): string {
    if (!cipherText || !cipherText.includes(":")) return "";
    try {
      const parts = cipherText.split(":");
      if (parts.length !== 3) return "";
      const [ivHex, tagHex, encryptedHex] = parts;

      const key = this.getMasterKey();
      const iv = Buffer.from(ivHex, "hex");
      const tag = Buffer.from(tagHex, "hex");

      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encryptedHex, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to decrypt communication credentials.",
      });
    }
  }

  /**
   * Retrieves tenant WhatsApp configuration
   */
  static async getWhatsAppConfig(
    tenantId: string,
    includeDecryptedToken = false
  ): Promise<{ config: WhatsAppConfigRecord | null; decryptedToken?: string }> {
    if (!tenantId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "tenantId is required" });
    }

    const record = await (db as any).slgWhatsAppConfig.findUnique({
      where: { tenantId },
    });

    if (!record) return { config: null };

    const config: WhatsAppConfigRecord = {
      id: record.id,
      tenantId: record.tenantId,
      phoneNumberId: record.phoneNumberId,
      wabaId: record.wabaId,
      displayPhoneNumber: record.displayPhoneNumber,
      webhookVerifyToken: record.webhookVerifyToken,
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };

    let decryptedToken: string | undefined;
    if (includeDecryptedToken && record.encryptedAccessToken) {
      decryptedToken = this.decrypt(record.encryptedAccessToken);
    }

    return { config, decryptedToken };
  }

  /**
   * Upserts tenant WhatsApp configuration with AES-256-GCM encryption
   */
  static async updateWhatsAppConfig(
    tenantId: string,
    actorUserId: string,
    input: WhatsAppConfigInput
  ): Promise<WhatsAppConfigRecord> {
    if (!tenantId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "tenantId is required" });
    }

    const encryptedAccessToken = this.encrypt(input.accessToken);
    const appSecretHash = crypto
      .createHash("sha256")
      .update(input.appSecret)
      .digest("hex");

    const record = await (db as any).slgWhatsAppConfig.upsert({
      where: { tenantId },
      create: {
        tenantId,
        phoneNumberId: input.phoneNumberId.trim(),
        wabaId: input.wabaId.trim(),
        displayPhoneNumber: input.displayPhoneNumber.trim(),
        encryptedAccessToken,
        webhookVerifyToken: input.webhookVerifyToken.trim(),
        appSecretHash,
        status: "ACTIVE",
      },
      update: {
        phoneNumberId: input.phoneNumberId.trim(),
        wabaId: input.wabaId.trim(),
        displayPhoneNumber: input.displayPhoneNumber.trim(),
        encryptedAccessToken,
        webhookVerifyToken: input.webhookVerifyToken.trim(),
        appSecretHash,
        status: "ACTIVE",
      },
    });

    await (db as any).slgAuditLog.create({
      data: {
        tenantId,
        actorUserId,
        action: "WHATSAPP_CONFIG_UPDATED",
        entityType: "SlgWhatsAppConfig",
        entityId: record.id,
        details: {
          phoneNumberId: input.phoneNumberId,
          displayPhoneNumber: input.displayPhoneNumber,
        },
      },
    });

    return {
      id: record.id,
      tenantId: record.tenantId,
      phoneNumberId: record.phoneNumberId,
      wabaId: record.wabaId,
      displayPhoneNumber: record.displayPhoneNumber,
      webhookVerifyToken: record.webhookVerifyToken,
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  /**
   * Retrieves tenant SMS gateway configuration
   */
  static async getSmsConfig(
    tenantId: string,
    includeDecryptedSecrets = false
  ): Promise<{
    config: SmsGatewayConfigRecord | null;
    decryptedApiKey?: string;
    decryptedApiSecret?: string;
  }> {
    if (!tenantId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "tenantId is required" });
    }

    const record = await (db as any).slgSmsGatewayConfig.findUnique({
      where: { tenantId },
    });

    if (!record) return { config: null };

    const config: SmsGatewayConfigRecord = {
      id: record.id,
      tenantId: record.tenantId,
      primaryProvider: record.primaryProvider,
      backupProvider: record.backupProvider,
      dltEntityId: record.dltEntityId,
      defaultSenderId: record.defaultSenderId,
      webhookSecret: record.webhookSecret,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };

    let decryptedApiKey: string | undefined;
    let decryptedApiSecret: string | undefined;

    if (includeDecryptedSecrets) {
      if (record.encryptedApiKey) {
        decryptedApiKey = this.decrypt(record.encryptedApiKey);
      }
      if (record.encryptedApiSecret) {
        decryptedApiSecret = this.decrypt(record.encryptedApiSecret);
      }
    }

    return { config, decryptedApiKey, decryptedApiSecret };
  }

  /**
   * Upserts tenant SMS gateway configuration with AES-256-GCM encryption
   */
  static async updateSmsConfig(
    tenantId: string,
    actorUserId: string,
    input: SmsGatewayConfigInput
  ): Promise<SmsGatewayConfigRecord> {
    if (!tenantId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "tenantId is required" });
    }

    const encryptedApiKey = input.apiKey ? this.encrypt(input.apiKey) : null;
    const encryptedApiSecret = input.apiSecret ? this.encrypt(input.apiSecret) : null;

    const record = await (db as any).slgSmsGatewayConfig.upsert({
      where: { tenantId },
      create: {
        tenantId,
        primaryProvider: input.primaryProvider,
        backupProvider: input.backupProvider || null,
        dltEntityId: input.dltEntityId || null,
        defaultSenderId: input.defaultSenderId.trim(),
        encryptedApiKey,
        encryptedApiSecret,
        webhookSecret: input.webhookSecret.trim(),
        isActive: input.isActive ?? true,
      },
      update: {
        primaryProvider: input.primaryProvider,
        backupProvider: input.backupProvider || null,
        dltEntityId: input.dltEntityId || null,
        defaultSenderId: input.defaultSenderId.trim(),
        encryptedApiKey,
        encryptedApiSecret,
        webhookSecret: input.webhookSecret.trim(),
        isActive: input.isActive ?? true,
      },
    });

    await (db as any).slgAuditLog.create({
      data: {
        tenantId,
        actorUserId,
        action: "SMS_CONFIG_UPDATED",
        entityType: "SlgSmsGatewayConfig",
        entityId: record.id,
        details: {
          primaryProvider: input.primaryProvider,
          defaultSenderId: input.defaultSenderId,
        },
      },
    });

    return {
      id: record.id,
      tenantId: record.tenantId,
      primaryProvider: record.primaryProvider,
      backupProvider: record.backupProvider,
      dltEntityId: record.dltEntityId,
      defaultSenderId: record.defaultSenderId,
      webhookSecret: record.webhookSecret,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
