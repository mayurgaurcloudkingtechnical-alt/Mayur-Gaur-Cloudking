import { z } from "zod";
import { router, publicProcedure, protectedProcedure, requireRoleProcedure } from "../init";
import { UserRoleCode, LeadSource, LeadStatus } from "@prisma/client";
import { db } from "@/server/db/client";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";
import { CrmLeadService } from "@/server/services/crm-lead.service";
import { getRazorpayProvider } from "@/server/lib/payment";
import { CertificateService } from "@/server/services/certificate.service";

const adminProcedure = requireRoleProcedure([
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.ADMIN,
  UserRoleCode.DIRECTOR,
  UserRoleCode.MANAGER,
]);

const staffProcedure = requireRoleProcedure([
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.ADMIN,
  UserRoleCode.DIRECTOR,
  UserRoleCode.MANAGER,
  UserRoleCode.COUNSELOR,
  UserRoleCode.TELECALLER,
]);

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }
  return digits.slice(-10);
}

function generateRegistrationNumber(year = 2026): string {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const timestamp = Date.now().toString().slice(-4);
  return `EVT-${year}-${timestamp}${randomSuffix}`;
}

export const eventsRouter = router({
  // ==========================================
  // PUBLIC PROCEDURES
  // ==========================================

  listPublicEvents: publicProcedure
    .input(
      z.object({
        programType: z.string().optional(),
        category: z.string().optional(),
        year: z.number().int().optional(),
        month: z.number().int().optional(),
        search: z.string().optional(),
        timeFilter: z.enum(["ALL", "UPCOMING", "PAST"]).default("ALL"),
      }).optional()
    )
    .query(async ({ input }) => {
      const now = new Date();
      const where: any = {
        deletedAt: null,
      };

      // Filter out Drafts for public, only show approved / active
      where.status = {
        in: ["UPCOMING", "REGISTRATION_OPEN", "REGISTRATION_CLOSED", "ONGOING", "COMPLETED"],
      };

      if (input?.programType && input.programType !== "ALL") {
        where.programType = input.programType;
      }

      if (input?.category && input.category !== "ALL") {
        where.category = input.category;
      }

      if (input?.year) {
        where.year = input.year;
      }

      if (input?.month) {
        where.month = input.month;
      }

      if (input?.search && input.search.trim().length > 0) {
        where.OR = [
          { title: { contains: input.search.trim(), mode: "insensitive" } },
          { summary: { contains: input.search.trim(), mode: "insensitive" } },
          { category: { contains: input.search.trim(), mode: "insensitive" } },
        ];
      }

      if (input?.timeFilter === "UPCOMING") {
        where.status = { in: ["UPCOMING", "REGISTRATION_OPEN", "ONGOING"] };
      } else if (input?.timeFilter === "PAST") {
        where.status = "COMPLETED";
      }

      return db.event.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { startDate: "asc" }],
      });
    }),

  getPublicEventBySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ input }) => {
      const event = await db.event.findUnique({
        where: { slug: input.slug },
        include: {
          _count: {
            select: { registrations: true },
          },
        },
      });

      if (!event || event.deletedAt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event or Program not found",
        });
      }

      return event;
    }),

  listArchiveYears: publicProcedure.query(async () => {
    const years = await db.event.findMany({
      where: { deletedAt: null },
      select: { year: true },
      distinct: ["year"],
      orderBy: { year: "desc" },
    });

    return years.map((y) => y.year);
  }),

  // Submit Enquiry for an Event (Captures into CRM Lead Engine)
  submitEventEnquiry: publicProcedure
    .input(
      z.object({
        eventId: z.string().min(1),
        fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
        email: z.string().email("Please provide a valid email address"),
        phone: z.string().min(10, "Phone must be at least 10 digits").max(15),
        city: z.string().optional(),
        qualification: z.string().optional(),
        notes: z.string().max(1000).optional(),
        honeypot: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (input.honeypot && input.honeypot.trim().length > 0) {
        return { success: true, message: "Enquiry submitted successfully" };
      }

      const event = await db.event.findUnique({
        where: { id: input.eventId },
      });

      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

      const cleanPhone = normalizePhone(input.phone);
      const cleanEmail = input.email.trim().toLowerCase();

      // Submit into CRM Lead engine
      const leadResult = await CrmLeadService.submitPublicEnquiry(
        {
          fullName: input.fullName.trim(),
          email: cleanEmail,
          phone: cleanPhone,
          city: input.city,
          source: LeadSource.WEBSITE,
          campaignName: `Event: ${event.title}`,
          notes: `Event Enquiry for [${event.title}] (${event.programType}). Qualification: ${input.qualification || "N/A"}. Notes: ${input.notes || "None"}`,
        },
        ctx.headers?.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1",
        ctx.headers?.get("user-agent") || "unknown"
      );

      return {
        success: true,
        message: "Enquiry submitted successfully! Our Academic Counseling team will contact you shortly.",
        leadId: (leadResult as any)?.leadId || null,
      };
    }),

  // Register & Create Razorpay Order
  registerForEvent: publicProcedure
    .input(
      z.object({
        eventId: z.string().min(1),
        fullName: z.string().min(2).max(100),
        email: z.string().email(),
        phone: z.string().min(10).max(15),
        city: z.string().optional(),
        qualification: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const event = await db.event.findUnique({
        where: { id: input.eventId },
      });

      if (!event || event.deletedAt) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

      if (event.status === "REGISTRATION_CLOSED" || event.status === "COMPLETED" || event.status === "CANCELLED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Registration for this event is currently closed.",
        });
      }

      const cleanPhone = normalizePhone(input.phone);
      const cleanEmail = input.email.trim().toLowerCase();

      // Check seat capacity
      if (event.registeredCount >= event.seatCapacity) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Seats for this event are fully booked.",
        });
      }

      // Automatically capture/match CRM lead
      let leadId: string | null = null;
      try {
        const leadRes = await CrmLeadService.submitPublicEnquiry(
          {
            fullName: input.fullName.trim(),
            email: cleanEmail,
            phone: cleanPhone,
            city: input.city,
            source: LeadSource.WEBSITE,
            campaignName: `Event Registration: ${event.title}`,
            notes: `Online Registration initiated for [${event.title}]. Amount: ₹${(event.fee / 100).toLocaleString("en-IN")}. Qualification: ${input.qualification || "N/A"}`,
          },
          ctx.headers?.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1",
          ctx.headers?.get("user-agent") || "unknown"
        );
        leadId = (leadRes as any)?.leadId || null;
      } catch (err) {
        console.error("Failed to link lead to CRM:", err);
      }

      const regNumber = generateRegistrationNumber(event.year);

      // Create Event Registration Record
      const registration = await db.eventRegistration.create({
        data: {
          registrationNumber: regNumber,
          eventId: event.id,
          leadId: leadId,
          fullName: input.fullName.trim(),
          email: cleanEmail,
          phone: cleanPhone,
          city: input.city,
          qualification: input.qualification,
          amount: event.fee,
          paymentStatus: "PENDING",
          notes: input.notes,
        },
      });

      // If fee > 0, create Razorpay Order
      let razorpayOrder = null;
      if (event.fee > 0) {
        try {
          const gateway = getRazorpayProvider();
          const order = await gateway.createOrder({
            amount: event.fee,
            currency: "INR",
            receipt: regNumber,
            notes: {
              registrationId: registration.id,
              eventId: event.id,
              eventTitle: event.title,
              customerName: input.fullName.trim(),
              customerPhone: cleanPhone,
            },
          });

          razorpayOrder = order;

          await db.eventRegistration.update({
            where: { id: registration.id },
            data: { razorpayOrderId: order.orderId },
          });
        } catch (err) {
          console.error("Razorpay order creation error:", err);
        }
      }

      return {
        success: true,
        registrationId: registration.id,
        registrationNumber: regNumber,
        eventTitle: event.title,
        amount: event.fee,
        razorpayOrder,
      };
    }),

  // Verify Online Payment
  verifyPayment: publicProcedure
    .input(
      z.object({
        registrationId: z.string().min(1),
        razorpayOrderId: z.string().min(1),
        razorpayPaymentId: z.string().min(1),
        razorpaySignature: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const reg = await db.eventRegistration.findUnique({
        where: { id: input.registrationId },
        include: { event: true },
      });

      if (!reg) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Registration record not found" });
      }

      // Verify signature via OnlinePaymentService
      const gateway = getRazorpayProvider();
      const isValid = gateway.verifyPaymentSignature({
        orderId: input.razorpayOrderId,
        paymentId: input.razorpayPaymentId,
        signature: input.razorpaySignature,
      });

      if (!isValid) {
        await db.eventRegistration.update({
          where: { id: reg.id },
          data: { paymentStatus: "FAILED" },
        });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Payment signature verification failed.",
        });
      }

      // Mark Registration as Paid & Increment Event Registered Count
      const updatedReg = await db.eventRegistration.update({
        where: { id: reg.id },
        data: {
          paymentStatus: "PAID",
          paymentMethod: "RAZORPAY",
          paymentReference: input.razorpayPaymentId,
          paidAt: new Date(),
        },
      });

      await db.event.update({
        where: { id: reg.eventId },
        data: { registeredCount: { increment: 1 } },
      });

      // Update CRM lead if present
      if (reg.leadId) {
        await db.lead.update({
          where: { id: reg.leadId },
          data: {
            status: LeadStatus.INTERESTED,
            notes: `Event Registration Confirmed & Paid: ₹${(reg.amount / 100).toLocaleString("en-IN")}. Ref: ${input.razorpayPaymentId}`,
          },
        }).catch(() => null);
      }

      return {
        success: true,
        message: "Payment verified successfully!",
        registrationNumber: updatedReg.registrationNumber,
        amount: updatedReg.amount,
        paymentReference: input.razorpayPaymentId,
      };
    }),

  // ==========================================
  // ADMIN & STAFF PROCEDURES
  // ==========================================

  listAdminEvents: staffProcedure
    .input(
      z.object({
        search: z.string().optional(),
        programType: z.string().optional(),
        status: z.string().optional(),
        year: z.number().int().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const where: any = { deletedAt: null };

      if (input?.search && input.search.trim().length > 0) {
        where.OR = [
          { title: { contains: input.search.trim(), mode: "insensitive" } },
          { slug: { contains: input.search.trim(), mode: "insensitive" } },
          { category: { contains: input.search.trim(), mode: "insensitive" } },
        ];
      }

      if (input?.programType && input.programType !== "ALL") {
        where.programType = input.programType;
      }

      if (input?.status && input.status !== "ALL") {
        where.status = input.status;
      }

      if (input?.year) {
        where.year = input.year;
      }

      return db.event.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        include: {
          _count: {
            select: { registrations: true },
          },
        },
      });
    }),

  getAdminEventById: staffProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input }) => {
      const event = await db.event.findUnique({
        where: { id: input.id },
        include: {
          registrations: {
            orderBy: { createdAt: "desc" },
            take: 100,
          },
          _count: {
            select: { registrations: true },
          },
        },
      });

      if (!event || event.deletedAt) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

      return event;
    }),

  createEvent: adminProcedure
    .input(
      z.object({
        title: z.string().min(2),
        slug: z.string().min(2),
        programType: z.string().default("EVENT"),
        category: z.string().default("General"),
        summary: z.string().min(5),
        description: z.string().min(10),
        bannerUrl: z.string().optional().nullable(),
        posterUrl: z.string().optional().nullable(),
        galleryUrls: z.array(z.string()).default([]),
        videoUrl: z.string().optional().nullable(),
        fee: z.number().int().min(0).default(0), // Paise
        originalFee: z.number().int().min(0).optional().nullable(),
        duration: z.string().default("1 Day"),
        startDate: z.coerce.date().optional().nullable(),
        endDate: z.coerce.date().optional().nullable(),
        startTime: z.string().optional().nullable(),
        endTime: z.string().optional().nullable(),
        registrationStartDate: z.coerce.date().optional().nullable(),
        registrationEndDate: z.coerce.date().optional().nullable(),
        venue: z.string().default("SoftLab Global Tech Center, Civil Lines, Prayagraj / Online Hybrid"),
        mode: z.string().default("HYBRID"),
        seatCapacity: z.number().int().min(1).default(100),
        eligibility: z.string().optional().nullable(),
        learningOutcomes: z.array(z.string()).default([]),
        syllabus: z.any().optional(),
        benefits: z.array(z.string()).default([]),
        trainerName: z.string().optional().nullable(),
        trainerBio: z.string().optional().nullable(),
        certificateTitle: z.string().optional().nullable(),
        certificateType: z.string().default("PARTICIPATION"),
        faqs: z.any().optional(),
        status: z.string().default("UPCOMING"),
        isFeatured: z.boolean().default(false),
        sortOrder: z.number().int().default(0),
        year: z.number().int().default(2026),
        month: z.number().int().default(11),
        metaTitle: z.string().optional().nullable(),
        metaDescription: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await db.event.findUnique({
        where: { slug: input.slug },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An event with this slug already exists. Please choose a unique slug.",
        });
      }

      const event = await db.event.create({
        data: input,
      });

      // Audit log
      await db.auditLog.create({
        data: {
          userId: ctx.user.id,
          action: "CREATE_EVENT",
          entityType: "Event",
          entityId: event.id,
          details: `Created new event '${event.title}' (${event.programType})`,
        },
      }).catch(() => null);

      return event;
    }),

  updateEvent: adminProcedure
    .input(
      z.object({
        id: z.string().min(1),
        title: z.string().min(2).optional(),
        slug: z.string().min(2).optional(),
        programType: z.string().optional(),
        category: z.string().optional(),
        summary: z.string().optional(),
        description: z.string().optional(),
        bannerUrl: z.string().optional().nullable(),
        posterUrl: z.string().optional().nullable(),
        galleryUrls: z.array(z.string()).optional(),
        videoUrl: z.string().optional().nullable(),
        fee: z.number().int().min(0).optional(),
        originalFee: z.number().int().min(0).optional().nullable(),
        duration: z.string().optional(),
        startDate: z.coerce.date().optional().nullable(),
        endDate: z.coerce.date().optional().nullable(),
        startTime: z.string().optional().nullable(),
        endTime: z.string().optional().nullable(),
        registrationStartDate: z.coerce.date().optional().nullable(),
        registrationEndDate: z.coerce.date().optional().nullable(),
        venue: z.string().optional(),
        mode: z.string().optional(),
        seatCapacity: z.number().int().min(1).optional(),
        registeredCount: z.number().int().min(0).optional(),
        eligibility: z.string().optional().nullable(),
        learningOutcomes: z.array(z.string()).optional(),
        syllabus: z.any().optional(),
        benefits: z.array(z.string()).optional(),
        trainerName: z.string().optional().nullable(),
        trainerBio: z.string().optional().nullable(),
        certificateTitle: z.string().optional().nullable(),
        certificateType: z.string().optional(),
        faqs: z.any().optional(),
        status: z.string().optional(),
        isFeatured: z.boolean().optional(),
        sortOrder: z.number().int().optional(),
        year: z.number().int().optional(),
        month: z.number().int().optional(),
        metaTitle: z.string().optional().nullable(),
        metaDescription: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      const event = await db.event.update({
        where: { id },
        data,
      });

      await db.auditLog.create({
        data: {
          userId: ctx.user.id,
          action: "UPDATE_EVENT",
          entityType: "Event",
          entityId: event.id,
          details: `Updated event '${event.title}'`,
        },
      }).catch(() => null);

      return event;
    }),

  duplicateEvent: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const original = await db.event.findUnique({
        where: { id: input.id },
      });

      if (!original) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Original event not found" });
      }

      const copySlug = `${original.slug}-copy-${Date.now().toString().slice(-4)}`;
      const { id, createdAt, updatedAt, deletedAt, registrations, ...data } = original as any;

      const duplicated = await db.event.create({
        data: {
          ...data,
          title: `${original.title} (Draft Copy)`,
          slug: copySlug,
          status: "DRAFT",
          registeredCount: 0,
        },
      });

      await db.auditLog.create({
        data: {
          userId: ctx.user.id,
          action: "DUPLICATE_EVENT",
          entityType: "Event",
          entityId: duplicated.id,
          details: `Duplicated event from '${original.title}' as '${duplicated.title}'`,
        },
      }).catch(() => null);

      return duplicated;
    }),

  deleteEvent: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const event = await db.event.update({
        where: { id: input.id },
        data: { deletedAt: new Date(), status: "ARCHIVED" },
      });

      await db.auditLog.create({
        data: {
          userId: ctx.user.id,
          action: "ARCHIVE_EVENT",
          entityType: "Event",
          entityId: event.id,
          details: `Archived/deleted event '${event.title}'`,
        },
      }).catch(() => null);

      return { success: true };
    }),

  listRegistrations: staffProcedure
    .input(
      z.object({
        eventId: z.string().optional(),
        paymentStatus: z.string().optional(),
        attendanceStatus: z.string().optional(),
        search: z.string().optional(),
        page: z.number().int().default(1),
        limit: z.number().int().default(50),
      }).optional()
    )
    .query(async ({ input }) => {
      const where: any = {};

      if (input?.eventId && input.eventId !== "ALL") {
        where.eventId = input.eventId;
      }

      if (input?.paymentStatus && input.paymentStatus !== "ALL") {
        where.paymentStatus = input.paymentStatus;
      }

      if (input?.attendanceStatus && input.attendanceStatus !== "ALL") {
        where.attendanceStatus = input.attendanceStatus;
      }

      if (input?.search && input.search.trim().length > 0) {
        where.OR = [
          { fullName: { contains: input.search.trim(), mode: "insensitive" } },
          { email: { contains: input.search.trim(), mode: "insensitive" } },
          { phone: { contains: input.search.trim(), mode: "insensitive" } },
          { registrationNumber: { contains: input.search.trim(), mode: "insensitive" } },
        ];
      }

      const [items, total] = await Promise.all([
        db.eventRegistration.findMany({
          where,
          include: {
            event: {
              select: {
                id: true,
                title: true,
                programType: true,
                fee: true,
                startDate: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: ((input?.page || 1) - 1) * (input?.limit || 50),
          take: input?.limit || 50,
        }),
        db.eventRegistration.count({ where }),
      ]);

      return { items, total };
    }),

  updateRegistration: staffProcedure
    .input(
      z.object({
        id: z.string().min(1),
        paymentStatus: z.string().optional(),
        paymentMethod: z.string().optional(),
        paymentReference: z.string().optional(),
        attendanceStatus: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      const reg = await db.eventRegistration.update({
        where: { id },
        data: {
          ...data,
          ...(data.paymentStatus === "PAID" ? { paidAt: new Date() } : {}),
        },
      });

      return reg;
    }),

  // Event Analytics Dashboard Metrics
  getEventAnalytics: staffProcedure.query(async () => {
    const [
      totalEvents,
      upcomingEvents,
      completedEvents,
      registrations,
    ] = await Promise.all([
      db.event.count({ where: { deletedAt: null } }),
      db.event.count({ where: { deletedAt: null, status: { in: ["UPCOMING", "REGISTRATION_OPEN"] } } }),
      db.event.count({ where: { deletedAt: null, status: "COMPLETED" } }),
      db.eventRegistration.findMany({
        select: {
          amount: true,
          paymentStatus: true,
          attendanceStatus: true,
          createdAt: true,
        },
      }),
    ]);

    const totalRegistrations = registrations.length;
    const paidRegistrations = registrations.filter((r) => r.paymentStatus === "PAID");
    const pendingRegistrations = registrations.filter((r) => r.paymentStatus === "PENDING");
    const totalRevenuePaise = paidRegistrations.reduce((acc, r) => acc + (r.amount || 0), 0);
    const pendingRevenuePaise = pendingRegistrations.reduce((acc, r) => acc + (r.amount || 0), 0);

    return {
      totalEvents,
      upcomingEvents,
      completedEvents,
      totalRegistrations,
      paidCount: paidRegistrations.length,
      pendingCount: pendingRegistrations.length,
      totalRevenueInr: Math.round(totalRevenuePaise / 100),
      pendingRevenueInr: Math.round(pendingRevenuePaise / 100),
    };
  }),
});