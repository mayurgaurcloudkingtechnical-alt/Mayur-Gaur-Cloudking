import { router, publicProcedure, protectedProcedure } from "../init";
import { z } from "zod";
import { ServicesService } from "@/server/services/services.service";
import { ServiceEnquiryStatus, UserRoleCode } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { AuthenticatedUser } from "@/server/auth/rbac";

function asAuthUser(user: any): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email || "",
    roleCode: user.roleCode,
    permissions: user.permissions || [],
    firstName: user.firstName || "",
    lastName: user.lastName || "",
  };
}

const servicesRoles: string[] = [
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.ADMIN,
  UserRoleCode.DIRECTOR,
  UserRoleCode.COUNSELOR,
];

const managerRoles: string[] = [
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.ADMIN,
  UserRoleCode.DIRECTOR,
];

export const servicesRouter = router({
  // ============================================================================
  // PUBLIC PROCEDURES
  // ============================================================================

  getCatalog: publicProcedure.query(async () => {
    return ServicesService.listCatalog();
  }),

  submitPublicEnquiry: publicProcedure
    .input(
      z.object({
        fullName: z.string().min(2, "Full name must be at least 2 characters"),
        companyName: z.string().optional(),
        phone: z.string().min(10, "Valid 10-digit mobile number is required"),
        email: z.string().email("Valid email address is required"),
        city: z.string().optional(),
        serviceCategoryCode: z.string().optional(),
        packageName: z.string().optional(),
        requirement: z.string().optional(),
        preferredContact: z.enum(["PHONE", "WHATSAPP", "EMAIL"]).default("PHONE"),
        message: z.string().optional(),
        estimatedBudget: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return ServicesService.submitPublicEnquiry(input);
    }),

  // ============================================================================
  // PROTECTED MANAGEMENT PROCEDURES (Super Admin, Admin, Director, Counselor)
  // ============================================================================

  getMetrics: protectedProcedure.query(async ({ ctx }) => {
    if (!servicesRoles.includes(ctx.user.roleCode)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permission to access Services management.",
      });
    }
    return ServicesService.getDashboardMetrics(asAuthUser(ctx.user));
  }),

  listEnquiries: protectedProcedure
    .input(
      z.object({
        status: z.nativeEnum(ServiceEnquiryStatus).optional(),
        categoryCode: z.string().optional(),
        counselorId: z.string().optional(),
        search: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!servicesRoles.includes(ctx.user.roleCode)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You lack permission to access Services management.",
        });
      }
      return ServicesService.listEnquiries(asAuthUser(ctx.user), input);
    }),

  getEnquiryDetails: protectedProcedure
    .input(z.object({ enquiryId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!servicesRoles.includes(ctx.user.roleCode)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You lack permission to inspect this Service enquiry.",
        });
      }
      return ServicesService.getEnquiryDetails(asAuthUser(ctx.user), input.enquiryId);
    }),

  updateEnquiryStatus: protectedProcedure
    .input(
      z.object({
        enquiryId: z.string(),
        status: z.nativeEnum(ServiceEnquiryStatus).optional(),
        notes: z.string().optional(),
        nextFollowUp: z.coerce.date().nullable().optional(),
        estimatedBudget: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!servicesRoles.includes(ctx.user.roleCode)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You lack permission to update Service enquiries.",
        });
      }
      return ServicesService.updateEnquiryStatus(asAuthUser(ctx.user), input);
    }),

  assignEnquiry: protectedProcedure
    .input(
      z.object({
        enquiryId: z.string(),
        counselorId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!managerRoles.includes(ctx.user.roleCode)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only management users can assign service enquiries.",
        });
      }
      return ServicesService.assignEnquiry(asAuthUser(ctx.user), input);
    }),

  listCounselors: protectedProcedure.query(async ({ ctx }) => {
    if (!servicesRoles.includes(ctx.user.roleCode)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permission to list counselors.",
      });
    }
    return ServicesService.listCounselors();
  }),
});
