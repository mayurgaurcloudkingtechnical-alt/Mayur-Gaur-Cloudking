import { SignJWT, jwtVerify } from "jose";
import * as crypto from "crypto";
import { db } from "@/server/db/client";
import { AuditService } from "@/server/services/audit.service";
import { UserRoleCode } from "@prisma/client";

function getJwtSecret(): Uint8Array {
  const secret =
    process.env.NATIVE_AUTH_JWT_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "FATAL: Missing NATIVE_AUTH_JWT_SECRET / AUTH_SECRET in production environment."
      );
    }
    // Development fallback
    return new TextEncoder().encode(
      "softlab_native_jwt_dev_secret_key_32_characters_minimum_required!"
    );
  }

  return new TextEncoder().encode(secret);
}

// Default durations
const DEFAULT_ACCESS_TOKEN_EXPIRY_SECONDS = 900; // 15 minutes
const DEFAULT_REFRESH_TOKEN_EXPIRY_SECONDS = 30 * 24 * 60 * 60; // 30 days

export function getAccessTokenExpirySeconds(): number {
  const raw = process.env.NATIVE_ACCESS_TOKEN_EXPIRES_IN;
  if (!raw) return DEFAULT_ACCESS_TOKEN_EXPIRY_SECONDS;
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) ? DEFAULT_ACCESS_TOKEN_EXPIRY_SECONDS : parsed;
}

export function getRefreshTokenExpirySeconds(): number {
  const raw = process.env.NATIVE_REFRESH_TOKEN_EXPIRES_IN;
  if (!raw) return DEFAULT_REFRESH_TOKEN_EXPIRY_SECONDS;
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) ? DEFAULT_REFRESH_TOKEN_EXPIRY_SECONDS : parsed;
}

/**
 * Computes SHA-256 fingerprint for refresh tokens before database storage.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export interface NativeAccessTokenPayload {
  userId: string;
  sessionId: string;
  roleCode: UserRoleCode;
  email: string;
}

export interface NativeTokenBundle {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // In seconds
  user: {
    id: string;
    email: string;
    name: string;
    firstName: string;
    lastName: string;
    roleCode: UserRoleCode;
    permissions: string[];
  };
}

export class NativeTokenService {
  /**
   * Generates a signed, short-lived JWT access token for native mobile/desktop apps.
   */
  static async generateAccessToken(payload: NativeAccessTokenPayload): Promise<string> {
    const secretKey = getJwtSecret();
    const expiresIn = getAccessTokenExpirySeconds();

    return new SignJWT({
      sub: payload.userId,
      sid: payload.sessionId,
      role: payload.roleCode,
      email: payload.email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setIssuer("softlab-global-native")
      .setAudience("softlab-global-apps")
      .setExpirationTime(`${expiresIn}s`)
      .sign(secretKey);
  }

  /**
   * Cryptographically verifies a Bearer JWT access token.
   * Returns decoded payload or null if invalid/expired.
   */
  static async verifyAccessToken(token: string): Promise<NativeAccessTokenPayload | null> {
    try {
      const secretKey = getJwtSecret();
      const { payload } = await jwtVerify(token, secretKey, {
        issuer: "softlab-global-native",
        audience: "softlab-global-apps",
      });

      if (!payload.sub || !payload.sid) {
        return null;
      }

      return {
        userId: payload.sub as string,
        sessionId: payload.sid as string,
        roleCode: (payload.role as UserRoleCode) || UserRoleCode.STUDENT,
        email: (payload.email as string) || "",
      };
    } catch {
      return null;
    }
  }

  /**
   * Creates a new native session, issues access + refresh tokens, and securely stores the hashed refresh token.
   */
  static async createSession(params: {
    userId: string;
    deviceId?: string;
    deviceName?: string;
    platform?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<NativeTokenBundle> {
    const user = await db.user.findUnique({
      where: { id: params.userId },
      include: {
        role: {
          select: {
            permissions: true,
          },
        },
      },
    });

    if (!user || user.status !== "ACTIVE") {
      throw new Error("User account is inactive or not found");
    }

    // 1. Generate high-entropy raw refresh token
    const rawRefreshToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawRefreshToken);

    const refreshExpirySeconds = getRefreshTokenExpirySeconds();
    const expiresAt = new Date(Date.now() + refreshExpirySeconds * 1000);

    // 2. Persist hashed session in database
    const session = await db.userDeviceSession.create({
      data: {
        userId: user.id,
        tokenHash,
        deviceId: params.deviceId,
        deviceName: params.deviceName,
        platform: params.platform,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        expiresAt,
        lastUsedAt: new Date(),
      },
    });

    // 3. Issue short-lived access token
    const accessToken = await this.generateAccessToken({
      userId: user.id,
      sessionId: session.id,
      roleCode: user.roleCode,
      email: user.email,
    });

    await AuditService.log({
      actorId: user.id,
      action: "NATIVE_SESSION_CREATED",
      resourceType: "UserDeviceSession",
      resourceId: session.id,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      newData: { platform: params.platform, deviceName: params.deviceName },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: getAccessTokenExpirySeconds(),
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        roleCode: user.roleCode,
        permissions: user.role.permissions,
      },
    };
  }

  /**
   * Refreshes a native session by validating and rotating the refresh token.
   * Enforces token rotation: old refresh token is marked revoked, and new tokens are issued.
   */
  static async refreshSession(params: {
    refreshToken: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<NativeTokenBundle> {
    const rawRefreshToken = (params.refreshToken || "").trim();
    if (!rawRefreshToken) {
      throw new Error("Missing refresh token");
    }

    const tokenHash = hashToken(rawRefreshToken);

    const existingSession = await db.userDeviceSession.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            role: {
              select: {
                permissions: true,
              },
            },
          },
        },
      },
    });

    if (!existingSession) {
      throw new Error("Invalid refresh token");
    }

    // Check if revoked (possible token theft / reuse attempt)
    if (existingSession.revokedAt) {
      await AuditService.log({
        actorId: existingSession.userId,
        action: "NATIVE_REVOKED_TOKEN_REUSE_ATTEMPT",
        resourceType: "UserDeviceSession",
        resourceId: existingSession.id,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      });
      throw new Error("Refresh token has been revoked");
    }

    // Check if expired
    if (existingSession.expiresAt < new Date()) {
      throw new Error("Refresh token has expired");
    }

    const { user } = existingSession;
    if (!user || user.status !== "ACTIVE") {
      throw new Error("User account is inactive or not found");
    }

    // Invalidate old session (rotation)
    await db.userDeviceSession.update({
      where: { id: existingSession.id },
      data: {
        revokedAt: new Date(),
        lastUsedAt: new Date(),
      },
    });

    // Create new rotated session
    const newRawRefreshToken = crypto.randomBytes(32).toString("hex");
    const newTokenHash = hashToken(newRawRefreshToken);
    const refreshExpirySeconds = getRefreshTokenExpirySeconds();
    const expiresAt = new Date(Date.now() + refreshExpirySeconds * 1000);

    const newSession = await db.userDeviceSession.create({
      data: {
        userId: user.id,
        tokenHash: newTokenHash,
        deviceId: existingSession.deviceId,
        deviceName: existingSession.deviceName,
        platform: existingSession.platform,
        ipAddress: params.ipAddress || existingSession.ipAddress,
        userAgent: params.userAgent || existingSession.userAgent,
        expiresAt,
        lastUsedAt: new Date(),
      },
    });

    const accessToken = await this.generateAccessToken({
      userId: user.id,
      sessionId: newSession.id,
      roleCode: user.roleCode,
      email: user.email,
    });

    await AuditService.log({
      actorId: user.id,
      action: "NATIVE_SESSION_ROTATED",
      resourceType: "UserDeviceSession",
      resourceId: newSession.id,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    return {
      accessToken,
      refreshToken: newRawRefreshToken,
      expiresIn: getAccessTokenExpirySeconds(),
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        roleCode: user.roleCode,
        permissions: user.role.permissions,
      },
    };
  }

  /**
   * Revokes a native session by refresh token or session ID.
   */
  static async revokeSession(params: {
    refreshToken?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<boolean> {
    let session = null;

    if (params.refreshToken) {
      const tokenHash = hashToken(params.refreshToken.trim());
      session = await db.userDeviceSession.findUnique({
        where: { tokenHash },
      });
    } else if (params.sessionId) {
      session = await db.userDeviceSession.findUnique({
        where: { id: params.sessionId },
      });
    }

    if (!session) {
      return false;
    }

    if (!session.revokedAt) {
      await db.userDeviceSession.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });

      await AuditService.log({
        actorId: session.userId,
        action: "NATIVE_SESSION_REVOKED",
        resourceType: "UserDeviceSession",
        resourceId: session.id,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      });
    }

    return true;
  }
}
