import crypto from "crypto";
import * as bcrypt from "bcryptjs";
import { db } from "@/server/db/client";
import { UserRoleCode } from "@prisma/client";
import { EmailService } from "./email.service";

export const AUTHORITY_RANK: Record<string, number> = {
  SUPER_ADMIN: 100,
  DIRECTOR: 80,
  ADMIN: 70,
  MANAGER: 60,
  HR: 55,
  ACCOUNTANT: 35,
  PLACEMENT_OFFICER: 35,
  COUNSELOR: 30,
  TRAINER: 30,
  TELECALLER: 20,
  STUDENT: 10,
};

function getDerivedKey(): Buffer {
  const secret =
    process.env.CREDENTIAL_ENCRYPTION_KEY ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "softlab-fallback-dev-only-key-change-in-prod";
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptSecret(plain: string): string {
  const key = getDerivedKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

export function decryptSecret(payload: string): string {
  const [ivHex, tagHex, dataHex] = payload.split(":");
  if (!ivHex || !tagHex || !dataHex) throw new Error("Malformed encrypted credential payload");
  const key = getDerivedKey();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const dec = Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()]);
  return dec.toString("utf8");
}

export function generateSecureTempPassword(prefix = "SLG"): string {
  const rand = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}@2026!${rand}`;
}

export class CredentialSecurityService {
  public static getRank(roleCode: string): number {
    return AUTHORITY_RANK[roleCode] ?? 0;
  }

  public static async assertCanManageTarget(params: {
    actorId: string;
    actorRole: string;
    targetUserId: string;
    actionName: string;
  }): Promise<{ allowed: true; target: any } | { allowed: false; reason: string }> {
    const { actorId, actorRole, targetUserId, actionName } = params;

    if (actorId === targetUserId) {
      await this.logDenied(actorId, targetUserId, actionName, "Self-credential administrative access prohibited");
      return { allowed: false, reason: "Cannot access or reveal your own credentials through admin controls." };
    }

    const [actorStaff, target] = await Promise.all([
      db.staffProfile.findUnique({ where: { userId: actorId }, select: { id: true, department: true, branch: true } }),
      db.user.findUnique({
        where: { id: targetUserId },
        include: {
          staffProfile: { select: { id: true, employeeId: true, department: true, branch: true, reportingManagerId: true } },
          studentProfile: { select: { id: true, studentId: true } },
        },
      }),
    ]);

    if (!target) {
      return { allowed: false, reason: "Target user not found." };
    }

    const actorRank = this.getRank(actorRole);
    const targetRank = this.getRank(String(target.roleCode));

    if (actorRank <= targetRank) {
      await this.logDenied(
        actorId,
        targetUserId,
        actionName,
        `Authority rank ${actorRank} (${actorRole}) cannot manage rank ${targetRank} (${target.roleCode})`
      );
      return {
        allowed: false,
        reason: `Forbidden: Cannot manage credentials for equal or higher authority (${target.roleCode}).`,
      };
    }

    // HR can manage staff (non-STUDENT) within lower rank; MANAGER can manage direct reports / same branch / students
    if (actorRole === UserRoleCode.HR && target.roleCode === UserRoleCode.STUDENT) {
      await this.logDenied(actorId, targetUserId, actionName, "HR scope restricted to staff accounts");
      return { allowed: false, reason: "Forbidden: HR role is scoped to staff credentials only." };
    }

    if (actorRole === UserRoleCode.MANAGER && target.staffProfile && actorStaff) {
      const isDirectReport = target.staffProfile.reportingManagerId === actorStaff.id;
      const sameDept = target.staffProfile.department === actorStaff.department;
      if (!isDirectReport && !sameDept && targetRank >= 35) {
        await this.logDenied(actorId, targetUserId, actionName, "Manager scope restricted to assigned/department team");
        return { allowed: false, reason: "Forbidden: Target employee is outside your department or reporting hierarchy." };
      }
    }

    return { allowed: true, target };
  }

  private static async logDenied(actorId: string, targetUserId: string, actionName: string, reason: string) {
    await db.auditLog.create({
      data: {
        actorId,
        action: "CREDENTIAL_ACCESS_DENIED",
        resourceType: "User",
        resourceId: targetUserId,
        newData: { requestedAction: actionName, reason },
      },
    });
  }

  public static async storeEncryptedTempCredential(params: {
    targetUserId: string;
    tempPassword: string;
    issuedById?: string;
    issuedReason: "ONBOARDING" | "ADMISSION" | "ADMIN_RESET";
    ttlHours?: number;
  }) {
    const encryptedValue = encryptSecret(params.tempPassword);
    const expiresAt = new Date(Date.now() + (params.ttlHours ?? 72) * 3600 * 1000);
    return db.encryptedTemporaryCredential.upsert({
      where: { targetUserId: params.targetUserId },
      update: {
        encryptedValue,
        issuedById: params.issuedById || null,
        issuedReason: params.issuedReason,
        expiresAt,
        consumedAt: null,
        revokedAt: null,
        revealCount: 0,
      },
      create: {
        targetUserId: params.targetUserId,
        encryptedValue,
        issuedById: params.issuedById || null,
        issuedReason: params.issuedReason,
        expiresAt,
      },
    });
  }

  public static async revealTemporaryCredential(params: {
    actorId: string;
    actorRole: string;
    targetUserId: string;
  }) {
    const check = await this.assertCanManageTarget({
      actorId: params.actorId,
      actorRole: params.actorRole,
      targetUserId: params.targetUserId,
      actionName: "REVEAL_TEMP_CREDENTIAL",
    });
    if (!check.allowed) {
      throw new Error(check.reason);
    }

    const record = await db.encryptedTemporaryCredential.findUnique({
      where: { targetUserId: params.targetUserId },
    });

    if (!record || record.revokedAt || record.consumedAt || record.expiresAt < new Date()) {
      throw new Error("No active, unconsumed temporary credential exists. Issue a password reset instead.");
    }

    const tempPassword = decryptSecret(record.encryptedValue);
    await db.encryptedTemporaryCredential.update({
      where: { id: record.id },
      data: {
        lastRevealedBy: params.actorId,
        lastRevealedAt: new Date(),
        revealCount: { increment: 1 },
      },
    });

    await db.auditLog.create({
      data: {
        actorId: params.actorId,
        action: "CREDENTIAL_TEMP_REVEALED",
        resourceType: "User",
        resourceId: params.targetUserId,
        newData: { expiresAt: record.expiresAt.toISOString(), revealCount: record.revealCount + 1 },
      },
    });

    return {
      tempPassword,
      expiresAt: record.expiresAt,
      issuedReason: record.issuedReason,
    };
  }

  public static async resetAndIssueTempCredential(params: {
    actorId: string;
    actorRole: string;
    targetUserId: string;
    sendEmail?: boolean;
  }) {
    const check = await this.assertCanManageTarget({
      actorId: params.actorId,
      actorRole: params.actorRole,
      targetUserId: params.targetUserId,
      actionName: "RESET_CREDENTIAL",
    });
    if (!check.allowed) {
      throw new Error(check.reason);
    }

    const tempPassword = generateSecureTempPassword("SLG");
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    await db.user.update({
      where: { id: params.targetUserId },
      data: {
        passwordHash,
        status: "ACTIVE",
      },
    });

    await this.storeEncryptedTempCredential({
      targetUserId: params.targetUserId,
      tempPassword,
      issuedById: params.actorId,
      issuedReason: "ADMIN_RESET",
      ttlHours: 72,
    });

    await db.auditLog.create({
      data: {
        actorId: params.actorId,
        action: "CREDENTIAL_RESET_ISSUED",
        resourceType: "User",
        resourceId: params.targetUserId,
        newData: { sendEmail: Boolean(params.sendEmail) },
      },
    });

    let emailSent = false;
    if (params.sendEmail && check.target.email) {
      const res = await EmailService.sendEmail({
        to: check.target.email,
        subject: "Your SOFTLAB GLOBAL Account Credentials Reset",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b;">
            <h2 style="color: #0284c7;">SOFTLAB GLOBAL — Temporary Login Credentials</h2>
            <p>Hello <strong>${check.target.firstName} ${check.target.lastName}</strong>,</p>
            <p>An authorized administrator has issued new temporary login credentials for your account.</p>
            <ul>
              <li><strong>Portal URL:</strong> https://lms.softlabglobal.com/login</li>
              <li><strong>Login Email:</strong> ${check.target.email}</li>
              <li><strong>Temporary Password:</strong> ${tempPassword}</li>
            </ul>
            <p>Please log in and change your password immediately. This temporary credential expires in 72 hours.</p>
          </div>
        `,
      });
      emailSent = res.sent;
      await db.auditLog.create({
        data: {
          actorId: params.actorId,
          action: "CREDENTIAL_EMAIL_SENT",
          resourceType: "User",
          resourceId: params.targetUserId,
          newData: { emailSent, recipient: check.target.email },
        },
      });
    }

    return {
      success: true,
      targetUserId: params.targetUserId,
      email: check.target.email,
      tempPassword,
      emailSent,
    };
  }

  public static async revokeCredential(params: {
    actorId: string;
    actorRole: string;
    targetUserId: string;
  }) {
    const check = await this.assertCanManageTarget({
      actorId: params.actorId,
      actorRole: params.actorRole,
      targetUserId: params.targetUserId,
      actionName: "REVOKE_CREDENTIAL",
    });
    if (!check.allowed) {
      throw new Error(check.reason);
    }

    const randomLockedHash = await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 10);
    await db.user.update({
      where: { id: params.targetUserId },
      data: { passwordHash: randomLockedHash, status: "SUSPENDED" },
    });
    await db.encryptedTemporaryCredential.updateMany({
      where: { targetUserId: params.targetUserId },
      data: { revokedAt: new Date() },
    });
    await db.auditLog.create({
      data: {
        actorId: params.actorId,
        action: "CREDENTIAL_REVOKED",
        resourceType: "User",
        resourceId: params.targetUserId,
      },
    });
    return { success: true };
  }
}
