import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  router,
  publicProcedure,
  protectedProcedure,
  requireRoleProcedure,
} from "../init";
import { CertificateService } from "@/server/services/certificate.service";
import { UserRoleCode } from "@prisma/client";

const adminProcedure = requireRoleProcedure([
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.ADMIN,
  UserRoleCode.DIRECTOR,
]);

export const certificateRouter = router({
  // Public verification endpoint
  verify: publicProcedure
    .input(z.object({ identifier: z.string().min(1) }))
    .query(async ({ input }) => {
      return CertificateService.verifyCertificate(input.identifier);
    }),

  // Student: list personal certificates
  getMyCertificates: protectedProcedure.query(async ({ ctx }) => {
    return CertificateService.getStudentCertificates(ctx.user.id);
  }),

  // Admin: list all certificates
  listCertificates: adminProcedure.query(async () => {
    return CertificateService.listCertificatesForAdmin();
  }),

  // Admin: manually issue certificate
  issueCertificate: adminProcedure
    .input(
      z.object({
        studentProfileId: z.string(),
        courseId: z.string(),
        enrollmentId: z.string().optional(),
        signatoryName: z.string().optional(),
        signatoryTitle: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return CertificateService.issueCertificate(input);
    }),

  // Admin: revoke certificate
  revokeCertificate: adminProcedure
    .input(
      z.object({
        certificateId: z.string(),
        revocationReason: z.string().min(5),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return CertificateService.revokeCertificate({
        ...input,
        revokedById: ctx.user.id,
      });
    }),
});
