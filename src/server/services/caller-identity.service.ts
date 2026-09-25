import { db } from "@/server/db/client";
import { UserRoleCode } from "@prisma/client";

export interface ResolvedCallerIdentity {
  success: boolean;
  code?: "OK" | "CALLER_NUMBER_NOT_CONFIGURED" | "CALLER_NUMBER_UNVERIFIED" | "USER_NOT_FOUND";
  message?: string;
  userId?: string;
  callerName?: string;
  roleCode?: UserRoleCode;
  officialNumber?: string;
  providerNumber?: string;
  verificationStatus?: "VERIFIED" | "PENDING_VERIFICATION" | "UNVERIFIED";
  voiceProfile?: string;
  language?: string;
}

export class CallerIdentityService {
  /**
   * Resolves caller identity dynamically from user role profile
   * Auto-configures AI calling identity if user has phone/callingNumber in LMS
   */
  public static async resolveCallerIdentity(
    userId: string,
    targetProvider = "SIMULATOR"
  ): Promise<ResolvedCallerIdentity> {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        callingIdentity: true,
      },
    });

    if (!user) {
      return {
        success: false,
        code: "USER_NOT_FOUND",
        message: `Assigned user ${userId} not found in LMS.`,
      };
    }

    const callerName = `${user.firstName} ${user.lastName}`.trim();
    let identity = user.callingIdentity;

    // Auto-configuration: If user has no AiCallingUserIdentity yet, check user.callingNumber or user.phone
    if (!identity) {
      const candidateNumber = (user.callingNumber || user.phone || "").trim();
      if (candidateNumber) {
        // Auto-create calling identity profile
        identity = await db.aiCallingUserIdentity.create({
          data: {
            userId: user.id,
            officialNumber: candidateNumber,
            providerNumber: candidateNumber,
            verificationStatus: targetProvider === "SIMULATOR" ? "VERIFIED" : "PENDING_VERIFICATION",
            voiceProfile: "alloy",
            language: "hi-IN",
            isActive: true,
            callingPermission: true,
          },
        });
      }
    }

    // Check if number is missing
    const officialNumber = identity?.officialNumber || (user.callingNumber || user.phone || "").trim();
    if (!officialNumber) {
      return {
        success: false,
        code: "CALLER_NUMBER_NOT_CONFIGURED",
        message: "Calling number is not configured for this counselor/telecaller.",
        userId: user.id,
        callerName,
        roleCode: user.roleCode,
      };
    }

    // Check provider verification status
    const status = (identity?.verificationStatus || (targetProvider === "SIMULATOR" ? "VERIFIED" : "PENDING_VERIFICATION")) as
      | "VERIFIED"
      | "PENDING_VERIFICATION"
      | "UNVERIFIED";

    if (targetProvider !== "SIMULATOR" && status !== "VERIFIED") {
      return {
        success: false,
        code: "CALLER_NUMBER_UNVERIFIED",
        message: "Calling number requires provider verification before it can be used for outbound calling.",
        userId: user.id,
        callerName,
        roleCode: user.roleCode,
        officialNumber,
        providerNumber: identity?.providerNumber || officialNumber,
        verificationStatus: status,
      };
    }

    return {
      success: true,
      code: "OK",
      userId: user.id,
      callerName,
      roleCode: user.roleCode,
      officialNumber,
      providerNumber: identity?.providerNumber || officialNumber,
      verificationStatus: status,
      voiceProfile: identity?.voiceProfile || "alloy",
      language: identity?.language || "hi-IN",
    };
  }

  /**
   * Syncs user official number into AiCallingUserIdentity during user update/create
   */
  public static async syncUserCallingIdentity(
    userId: string,
    officialNumber: string,
    verificationStatus: "VERIFIED" | "PENDING_VERIFICATION" | "UNVERIFIED" = "VERIFIED"
  ) {
    const cleanNumber = officialNumber.trim();
    if (!cleanNumber) return null;

    return db.aiCallingUserIdentity.upsert({
      where: { userId },
      update: {
        officialNumber: cleanNumber,
        providerNumber: cleanNumber,
        verificationStatus,
      },
      create: {
        userId,
        officialNumber: cleanNumber,
        providerNumber: cleanNumber,
        verificationStatus,
        voiceProfile: "alloy",
        language: "hi-IN",
      },
    });
  }
}
