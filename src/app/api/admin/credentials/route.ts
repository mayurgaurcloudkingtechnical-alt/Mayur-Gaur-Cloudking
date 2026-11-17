import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/server/db/client";
import { UserRoleCode } from "@prisma/client";
import {
  AUTHORITY_RANK,
  CredentialSecurityService,
} from "@/server/services/credential-security.service";
import { StaffOnboardingService } from "@/server/services/staff-onboarding.service";
import { EmailService } from "@/server/services/email.service";

export const dynamic = "force-dynamic";

const ALLOWED_ADMIN_ROLES = ["SUPER_ADMIN", "DIRECTOR", "ADMIN", "MANAGER", "HR"];

async function getCredAuth(req: NextRequest) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  const token =
    (await getToken({ req, secret, secureCookie: true }).catch(() => null)) ||
    (await getToken({ req, secret, secureCookie: false }).catch(() => null));
  if (!token?.sub) return { error: "Unauthorized", status: 401 as const, token: null };
  if (!ALLOWED_ADMIN_ROLES.includes(String(token.roleCode || ""))) {
    return { error: "Forbidden: Hierarchical credential management requires Manager, HR, Admin, Director, or Super Admin.", status: 403 as const, token: null };
  }
  return { error: null, status: 200 as const, token };
}

export async function GET(req: NextRequest) {
  const auth = await getCredAuth(req);
  if (auth.error || !auth.token) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const actorId = String(auth.token.sub);
  const actorRole = String(auth.token.roleCode);
  const actorRank = AUTHORITY_RANK[actorRole] ?? 0;

  const sp = req.nextUrl.searchParams;
  const type = (sp.get("type") || "ALL").toUpperCase();
  const search = (sp.get("search") || "").trim();

  const lowerRoles = Object.entries(AUTHORITY_RANK)
    .filter(([role, rank]) => {
      if (rank >= actorRank) return false;
      if (actorRole === "HR" && role === "STUDENT") return false;
      return true;
    })
    .map(([role]) => role as UserRoleCode);

  const where: any = {
    roleCode: { in: lowerRoles },
    deletedAt: null,
  };
  if (type === "STAFF") {
    where.roleCode = { in: lowerRoles.filter((r) => r !== UserRoleCode.STUDENT) };
  } else if (type === "STUDENT") {
    where.roleCode = lowerRoles.includes(UserRoleCode.STUDENT) ? UserRoleCode.STUDENT : { in: [] };
  }
  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { staffProfile: { employeeId: { contains: search, mode: "insensitive" } } },
      { studentProfile: { studentId: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [users, tempCreds, onboardingLogs, admissionEmailLogs, auditLogs] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        roleCode: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        staffProfile: {
          select: { id: true, employeeId: true, department: true, designation: true, branch: true, employmentStatus: true, isActive: true },
        },
        studentProfile: {
          select: { id: true, studentId: true, center: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.encryptedTemporaryCredential.findMany({
      where: { revokedAt: null, consumedAt: null, expiresAt: { gt: new Date() } },
      select: { targetUserId: true, expiresAt: true, issuedReason: true, revealCount: true, createdAt: true },
    }),
    db.staffOnboardingIdempotency.findMany({ orderBy: { createdAt: "desc" }, take: 25 }),
    db.studentAdmissionEmailLog.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
    db.auditLog.findMany({
      where: {
        action: {
          in: [
            "CREDENTIAL_RESET_ISSUED",
            "CREDENTIAL_TEMP_REVEALED",
            "CREDENTIAL_REVOKED",
            "CREDENTIAL_ACCESS_DENIED",
            "CREDENTIAL_EMAIL_SENT",
            "STAFF_ONBOARDED",
            "STAFF_ONBOARDING_REPAIRED",
          ],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
  ]);

  const tempMap = new Map(tempCreds.map((t) => [t.targetUserId, t]));

  return NextResponse.json({
    actor: { id: actorId, roleCode: actorRole, authorityRank: actorRank },
    accounts: users.map((u) => {
      const tc = tempMap.get(u.id);
      return {
        id: u.id,
        name: `${u.firstName} ${u.lastName}`.trim(),
        email: u.email,
        roleCode: u.roleCode,
        authorityRank: AUTHORITY_RANK[String(u.roleCode)] ?? 0,
        status: u.status,
        identifier: u.staffProfile?.employeeId || u.studentProfile?.studentId || "-",
        department: u.staffProfile?.department || (u.studentProfile ? "STUDENT" : "-"),
        designation: u.staffProfile?.designation || (u.studentProfile ? "Enrolled Student" : "-"),
        branch: u.staffProfile?.branch || u.studentProfile?.center || "-",
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
        hasActiveTempCredential: Boolean(tc),
        tempCredentialExpiresAt: tc?.expiresAt || null,
      };
    }),
    monitoring: {
      onboardingLogs,
      admissionEmailLogs,
      auditLogs,
    },
  });
}

export async function POST(req: NextRequest) {
  const auth = await getCredAuth(req);
  if (auth.error || !auth.token) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const actorId = String(auth.token.sub);
  const actorRole = String(auth.token.roleCode);
  const body = await req.json();
  const action = String(body.action || "").toUpperCase();

  try {
    if (action === "RESET_CREDENTIAL") {
      const res = await CredentialSecurityService.resetAndIssueTempCredential({
        actorId,
        actorRole,
        targetUserId: String(body.targetUserId || ""),
        sendEmail: Boolean(body.sendEmail),
      });
      return NextResponse.json(res);
    }

    if (action === "REVEAL_TEMP_CREDENTIAL") {
      const res = await CredentialSecurityService.revealTemporaryCredential({
        actorId,
        actorRole,
        targetUserId: String(body.targetUserId || ""),
      });
      return NextResponse.json({ success: true, ...res });
    }

    if (action === "REVOKE_CREDENTIAL") {
      const res = await CredentialSecurityService.revokeCredential({
        actorId,
        actorRole,
        targetUserId: String(body.targetUserId || ""),
      });
      return NextResponse.json(res);
    }

    if (action === "REPAIR_ONBOARDING") {
      const actor = {
        id: actorId,
        email: String(auth.token.email || ""),
        name: String(auth.token.name || "Admin"),
        roleCode: actorRole as UserRoleCode,
      };
      const res = await StaffOnboardingService.repairIncompleteOnboarding(actor as any, {
        email: String(body.email || ""),
        employeeId: body.employeeId ? String(body.employeeId) : undefined,
        firstName: body.firstName ? String(body.firstName) : undefined,
        lastName: body.lastName ? String(body.lastName) : undefined,
        phone: body.phone ? String(body.phone) : undefined,
        designation: body.designation ? String(body.designation) : undefined,
        roleCode: body.roleCode || UserRoleCode.TRAINER,
        department: body.department || "TRAINING",
      });
      return NextResponse.json(res);
    }

    if (action === "RETRY_ADMISSION_EMAIL") {
      const logId = String(body.logId || "");
      const log = await db.studentAdmissionEmailLog.findUnique({ where: { id: logId } });
      if (!log) return NextResponse.json({ error: "Email log not found" }, { status: 404 });
      if (log.status === "SENT") return NextResponse.json({ success: true, message: "Already delivered." });

      const res = await EmailService.sendEmail({
        to: log.recipientEmail,
        bcc: EmailService.DEFAULT_MANAGEMENT_EMAIL,
        subject: log.subject,
        html: `<div style="font-family:Arial,sans-serif;padding:24px;"><h2>${log.subject}</h2><p>Student ID: ${log.studentId} | Admission: ${log.admissionNumber || "-"}</p><p>Please sign in at https://lms.softlabglobal.com/login or contact +91 9196596979 for credential assistance.</p></div>`,
      });
      await db.studentAdmissionEmailLog.update({
        where: { id: log.id },
        data: {
          status: res.sent ? "SENT" : "FAILED",
          errorMessage: res.reason || null,
          retryCount: { increment: 1 },
          ...(res.sent ? { sentAt: new Date() } : {}),
        },
      });
      return NextResponse.json({ success: res.sent, status: res.sent ? "SENT" : "FAILED", error: res.reason });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (err: any) {
    const status = String(err.message || "").toLowerCase().includes("forbidden") ? 403 : 400;
    return NextResponse.json({ error: err.message }, { status });
  }
}
