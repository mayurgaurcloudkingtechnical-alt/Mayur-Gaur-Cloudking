import { z } from "zod";
import { router, protectedProcedure } from "../init";
import { TRPCError } from "@trpc/server";
import { db } from "@/server/db/client";

const KNOWLEDGE_CATEGORIES = [
  "COURSES",
  "FEES",
  "SYLLABUS",
  "FAQS",
  "ADMISSIONS",
  "PLACEMENT",
  "POLICIES",
  "BRANCHES",
  "TRAINERS",
  "COMPANY_INFO",
  "OFFERS",
  "CALLING_SCRIPTS",
  "WHATSAPP_TEMPLATES",
  "OBJECTION_HANDLING",
] as const;

export const aiKnowledgeRouter = router({
  /**
   * List all knowledge base documents
   */
  listDocs: protectedProcedure
    .input(
      z.object({
        category: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const where: any = {};
      if (input.category && input.category !== "ALL") {
        where.category = input.category;
      }
      if (input.search) {
        where.OR = [
          { title: { contains: input.search, mode: "insensitive" } },
          { content: { contains: input.search, mode: "insensitive" } },
        ];
      }

      return db.aiKnowledgeDoc.findMany({
        where,
        orderBy: [{ category: "asc" }, { priority: "desc" }],
      });
    }),

  /**
   * Get single document by ID or slug
   */
  getDoc: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const doc = await db.aiKnowledgeDoc.findUnique({
        where: { id: input.id },
      });
      if (!doc) throw new TRPCError({ code: "NOT_FOUND", message: "Knowledge document not found" });
      return doc;
    }),

  /**
   * Create or update knowledge document
   */
  upsertDoc: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
        category: z.enum(KNOWLEDGE_CATEGORIES),
        title: z.string().min(1),
        slug: z.string().min(1),
        content: z.string().min(1),
        tags: z.array(z.string()).default([]),
        keywords: z.array(z.string()).default([]),
        priority: z.number().default(0),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      if (id) {
        return db.aiKnowledgeDoc.update({
          where: { id },
          data: {
            ...data,
            lastVerifiedAt: new Date(),
            verifiedBy: ctx.user.name || "Super Admin",
          },
        });
      }

      return db.aiKnowledgeDoc.create({
        data: {
          ...data,
          createdById: ctx.user.id,
          lastVerifiedAt: new Date(),
          verifiedBy: ctx.user.name || "Super Admin",
        },
      });
    }),

  /**
   * Delete knowledge document
   */
  deleteDoc: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return db.aiKnowledgeDoc.delete({
        where: { id: input.id },
      });
    }),

  /**
   * Seed default institutional knowledge base if empty
   */
  seedDefaultKnowledge: protectedProcedure.mutation(async ({ ctx }) => {
    const existing = await db.aiKnowledgeDoc.count();
    if (existing > 0) {
      return { count: existing, message: "Knowledge documents already present" };
    }

    const defaultEntries = [
      {
        category: "COMPANY_INFO" as const,
        title: "SoftLab Global Overview & Campus",
        slug: "softlab-overview-campus",
        content: "SoftLab Global is a premier IT Training and Software Innovation Institute located at Civil Lines, Prayagraj, Uttar Pradesh. Official website: https://www.softlabglobal.com. We operate classroom centers and live online interactive batches with mentor support.",
        tags: ["about", "campus", "location", "prayagraj"],
        keywords: ["address", "office", "headquarters", "center"],
        priority: 10,
      },
      {
        category: "PLACEMENT" as const,
        title: "Placement Support & Corporate Partners",
        slug: "placement-support-partners",
        content: "SoftLab Global provides 100% Placement Support through a dedicated Placement Cell with 1,200+ active recruiting partners across IT and software domains. Students receive resume reviews, mock interviews, and direct campus drive opportunities.",
        tags: ["placement", "jobs", "hiring", "partners"],
        keywords: ["recruiting", "package", "salary", "companies"],
        priority: 10,
      },
      {
        category: "FEES" as const,
        title: "Institutional Fee Policy & Scholarships",
        slug: "fees-and-scholarships",
        content: "Flagship courses have an standard base fee starting from ₹45,000 net, with 0% interest EMI options available. Scholarships and merit concessions are evaluated exclusively by the Admissions Board based on merit and cannot be offered on the fly by AI.",
        tags: ["fee", "emi", "scholarship", "cost"],
        keywords: ["pricing", "installments", "discount", "concession"],
        priority: 10,
      },
      {
        category: "OBJECTION_HANDLING" as const,
        title: "Job Guarantee & Live Projects Handling",
        slug: "job-guarantee-objections",
        content: "When candidates ask about guarantees, explain that SoftLab provides dedicated 100% placement support with verified hiring partners, portfolio creation on GitHub, and production capstone projects. We prepare students thoroughly for technical interviews.",
        tags: ["objection", "guarantee", "projects"],
        keywords: ["guaranteed", "fake", "reality", "assurance"],
        priority: 9,
      },
      {
        category: "WHATSAPP_TEMPLATES" as const,
        title: "WhatsApp Welcome & Brochure Template",
        slug: "whatsapp-welcome-template",
        content: "Hello {{name}}! Welcome to SoftLab Global. Here is the syllabus for {{course}}. Program features: Live Capstone Projects, 1,200+ Hiring Partners, 100% Placement Support, Civil Lines Prayagraj Campus.",
        tags: ["whatsapp", "welcome", "template"],
        keywords: ["brochure", "intro", "outreach"],
        priority: 8,
      },
    ];

    let createdCount = 0;
    for (const entry of defaultEntries) {
      await db.aiKnowledgeDoc.create({
        data: {
          ...entry,
          createdById: ctx.user.id,
          verifiedBy: "Super Admin",
          lastVerifiedAt: new Date(),
        },
      });
      createdCount++;
    }

    return { count: createdCount, message: `Successfully seeded ${createdCount} knowledge documents.` };
  }),
});
