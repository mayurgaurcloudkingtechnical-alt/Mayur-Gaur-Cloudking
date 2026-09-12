import crypto from "crypto";
import QRCode from "qrcode";
import { db } from "@/server/db/client";
import { CertificateStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";

export interface IssueCertificateInput {
  studentProfileId: string;
  courseId: string;
  enrollmentId?: string;
  completionDate?: Date;
  signatoryName?: string;
  signatoryTitle?: string;
  metadata?: Record<string, any>;
}

export interface RevokeCertificateInput {
  certificateId: string;
  revocationReason: string;
  revokedById: string;
}

let sequenceCounter = 0;

export class CertificateService {
  /**
   * Generates next certificate number format: SLG-CERT-YYYY-XXXXX
   * Thread-safe and concurrency-safe: uses synchronous counter reservation before awaiting db.count().
   */
  static async generateCertificateNumber(): Promise<string> {
    const year = new Date().getFullYear();
    sequenceCounter++;
    const currentTicket = sequenceCounter;

    const count = await db.certificate.count();
    const sequenceNum = count + currentTicket;
    const sequence = String(sequenceNum).padStart(5, "0");
    const candidate = `SLG-CERT-${year}-${sequence}`;

    const existing = await db.certificate.findUnique({
      where: { certificateNo: candidate },
    });

    if (!existing) {
      return candidate;
    }

    const entropy = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `SLG-CERT-${year}-${sequence}-${entropy}`;
  }

  /**
   * Generates a 32-character cryptographic verification token
   */
  static generateVerificationToken(): string {
    return crypto.randomBytes(16).toString("hex");
  }

  /**
   * Generates QR Code Data URL linking to the canonical public verification page
   */
  static async generateQrCodeDataUrl(certificateNo: string): Promise<string> {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://www.softlabglobal.com";
    const verificationUrl = `${baseUrl}/verify/certificate/${encodeURIComponent(certificateNo)}`;
    return QRCode.toDataURL(verificationUrl, {
      width: 240,
      margin: 2,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
    });
  }

  /**
   * Issues a verifiable digital certificate with safe retry logic for concurrent creation
   */
  static async issueCertificate(input: IssueCertificateInput) {
    const existing = await db.certificate.findFirst({
      where: {
        studentId: input.studentProfileId,
        courseId: input.courseId,
        status: CertificateStatus.VALID,
      },
      include: {
        student: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
        course: {
          select: { id: true, title: true, slug: true },
        },
      },
    });

    if (existing) {
      return existing;
    }

    let attempts = 0;
    while (attempts < 5) {
      try {
        const certNumber = await this.generateCertificateNumber();
        const verificationToken = this.generateVerificationToken();

        return await db.certificate.create({
          data: {
            certificateNo: certNumber,
            verificationToken,
            studentId: input.studentProfileId,
            courseId: input.courseId,
            enrollmentId: input.enrollmentId,
            completionDate: input.completionDate || new Date(),
            issuedDate: new Date(),
            signatoryName: input.signatoryName || "Director of Academic Affairs",
            signatoryTitle: input.signatoryTitle || "Authorized Signatory, SOFTLAB GLOBAL",
            status: CertificateStatus.VALID,
            metadata: input.metadata || {},
          },
          include: {
            student: {
              include: {
                user: { select: { id: true, firstName: true, lastName: true, email: true } },
              },
            },
            course: {
              select: { id: true, title: true, slug: true },
            },
          },
        });
      } catch (err: any) {
        if (err.code === "P2002") {
          attempts++;
          continue;
        }
        throw err;
      }
    }

    throw new Error("Unable to issue certificate after 5 collision attempts.");
  }

  /**
   * Revokes an existing certificate with reason and user audit
   */
  static async revokeCertificate(input: RevokeCertificateInput) {
    const cert = await db.certificate.findUnique({
      where: { id: input.certificateId },
    });

    if (!cert) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Certificate not found." });
    }

    if (cert.status === CertificateStatus.REVOKED) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Certificate is already revoked.",
      });
    }

    return db.certificate.update({
      where: { id: input.certificateId },
      data: {
        status: CertificateStatus.REVOKED,
        revocationReason: input.revocationReason,
        revokedAt: new Date(),
        revokedById: input.revokedById,
      },
    });
  }

  /**
   * Public verification lookup by Certificate Number or Verification Token
   */
  static async verifyCertificate(identifier: string) {
    const certificate = await db.certificate.findFirst({
      where: {
        OR: [
          { certificateNo: identifier },
          { verificationToken: identifier },
        ],
      },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        course: {
          select: { title: true, slug: true },
        },
      },
    });

    if (!certificate) {
      return {
        isValid: false,
        message: "No certificate found matching the provided identifier.",
        certificate: null,
        qrCodeData: null,
      };
    }

    const qrCodeData = await this.generateQrCodeDataUrl(certificate.certificateNo);

    if (certificate.status === CertificateStatus.REVOKED) {
      return {
        isValid: false,
        isRevoked: true,
        message: "This certificate has been revoked.",
        certificate: {
          certificateNo: certificate.certificateNo,
          studentName: `${certificate.student.user.firstName} ${certificate.student.user.lastName}`.trim(),
          courseTitle: certificate.course.title,
          completionDate: certificate.completionDate,
          issuedDate: certificate.issuedDate,
          revokedAt: certificate.revokedAt,
          revocationReason: certificate.revocationReason,
          status: certificate.status,
        },
        qrCodeData,
      };
    }

    return {
      isValid: true,
      isRevoked: false,
      message: "This is an authentic, verified certificate issued by SOFTLAB GLOBAL.",
      certificate: {
        certificateNo: certificate.certificateNo,
        verificationToken: certificate.verificationToken,
        studentName: `${certificate.student.user.firstName} ${certificate.student.user.lastName}`.trim(),
        courseTitle: certificate.course.title,
        courseCode: certificate.course.slug,
        completionDate: certificate.completionDate,
        issuedDate: certificate.issuedDate,
        signatoryName: certificate.signatoryName,
        signatoryTitle: certificate.signatoryTitle,
        metadata: certificate.metadata,
        status: certificate.status,
      },
      qrCodeData,
    };
  }

  /**
   * Retrieves all certificates for a student
   */
  static async getStudentCertificates(studentUserId: string) {
    const studentProfile = await db.studentProfile.findFirst({
      where: { userId: studentUserId },
    });

    if (!studentProfile) return [];

    const certs = await db.certificate.findMany({
      where: { studentId: studentProfile.id },
      include: {
        course: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { issuedDate: "desc" },
    });

    return Promise.all(
      certs.map(async (c: any) => ({
        ...c,
        qrCodeData: await this.generateQrCodeDataUrl(c.certificateNo),
      }))
    );
  }

  /**
   * Admin listing of all certificates
   */
  static async listCertificatesForAdmin() {
    return db.certificate.findMany({
      include: {
        student: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
        course: { select: { id: true, title: true, slug: true } },
        revokedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { issuedDate: "desc" },
    });
  }
}