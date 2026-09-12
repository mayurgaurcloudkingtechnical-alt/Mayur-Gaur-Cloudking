import {
  PrismaClient,
  UserRoleCode,
  UserStatus,
  ContentStatus,
  DeliveryMode,
  BatchStatus,
  LessonType,
  EnrollmentStatus,
  ClassSessionStatus,
  AttendanceStatus,
  LeadSource,
  LeadStatus,
  FollowUpType,
  ApplicationStage,
  FeePaymentStatus,
  FeeStructureStatus,
  InstallmentStatus,
  PaymentMethod,
  PaymentTransactionStatus,
} from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ROLES_DEFINITIONS: Array<{
  code: UserRoleCode;
  name: string;
  description: string;
  maxDiscountPercent: number;
  permissions: string[];
}> = [
  {
    code: UserRoleCode.SUPER_ADMIN,
    name: "Super Administrator",
    description: "Root system authority with unrestricted operational access",
    maxDiscountPercent: 100,
    permissions: [
      "courses:read", "courses:create", "courses:update", "courses:delete", "courses:publish", "content:manage",
      "leads:create", "leads:read_own", "leads:read_all", "leads:update", "leads:assign", "leads:delete",
      "admissions:create", "admissions:read", "discounts:apply_tier1", "discounts:apply_tier2", "discounts:apply_tier3", "discounts:apply_full", "admissions:approve_discount",
      "batches:manage", "attendance:mark", "attendance:view_batch", "attendance:view_all", "classes:schedule",
      "exams:create", "exams:publish", "exams:grade", "results:publish",
      "certificates:issue", "certificates:revoke", "certificates:verify",
      "payments:create_order", "payments:record_offline", "payments:view_ledger", "payments:refund",
      "placement:manage_companies", "placement:manage_jobs", "placement:view_students", "placement:update_status",
      "hr:employees:manage", "hr:leaves:review", "hr:sensitive:view",
      "system:manage", "audit:view"
    ],
  },
  {
    code: UserRoleCode.DIRECTOR,
    name: "Executive Director",
    description: "Executive oversight, financial visibility, 100% discount authority",
    maxDiscountPercent: 100,
    permissions: [
      "courses:read", "courses:create", "courses:update", "courses:publish", "content:manage",
      "leads:create", "leads:read_own", "leads:read_all", "leads:assign",
      "admissions:create", "admissions:read", "discounts:apply_tier1", "discounts:apply_tier2", "discounts:apply_tier3", "discounts:apply_full", "admissions:approve_discount",
      "batches:manage", "attendance:view_all",
      "exams:create", "exams:publish", "exams:grade", "results:publish",
      "certificates:issue", "certificates:revoke", "certificates:verify",
      "payments:record_offline", "payments:view_ledger", "payments:refund",
      "placement:manage_jobs", "placement:view_students",
      "hr:employees:manage", "hr:sensitive:view",
      "audit:view"
    ],
  },
  {
    code: UserRoleCode.ADMIN,
    name: "Operations Administrator",
    description: "Academic operations, catalog management, staff and batch scheduling",
    maxDiscountPercent: 50,
    permissions: [
      "courses:read", "courses:create", "courses:update", "courses:publish", "content:manage",
      "leads:create", "leads:read_own", "leads:read_all", "leads:assign",
      "admissions:create", "admissions:read", "discounts:apply_tier1", "discounts:apply_tier2", "discounts:apply_tier3",
      "batches:manage", "attendance:mark", "attendance:view_all", "classes:schedule",
      "exams:create", "exams:publish", "exams:grade", "results:publish",
      "certificates:issue", "certificates:verify",
      "payments:record_offline", "payments:view_ledger",
      "placement:manage_jobs", "placement:view_students",
      "hr:employees:manage"
    ],
  },
  {
    code: UserRoleCode.MANAGER,
    name: "Operations / Sales Manager",
    description: "Lead management, team assignments, mid-tier discount approval (≤30%)",
    maxDiscountPercent: 30,
    permissions: [
      "courses:read",
      "leads:create", "leads:read_own", "leads:read_all", "leads:assign", "leads:update",
      "admissions:create", "admissions:read", "discounts:apply_tier1", "discounts:apply_tier2", "admissions:approve_discount",
      "attendance:view_all",
      "certificates:verify"
    ],
  },
  {
    code: UserRoleCode.COUNSELOR,
    name: "Senior Academic Counselor",
    description: "Lead follow-up, student admissions, limited discount authority (≤10%)",
    maxDiscountPercent: 10,
    permissions: [
      "courses:read",
      "leads:create", "leads:read_own", "leads:update",
      "admissions:create", "admissions:read", "discounts:apply_tier1",
      "certificates:verify"
    ],
  },
  {
    code: UserRoleCode.TELECALLER,
    name: "Telecaller / Outreach Specialist",
    description: "Outbound prospect outreach, call logging, appointment booking",
    maxDiscountPercent: 0,
    permissions: [
      "courses:read",
      "leads:create", "leads:read_own", "leads:update",
      "certificates:verify"
    ],
  },
  {
    code: UserRoleCode.TRAINER,
    name: "Faculty / Instructor",
    description: "Course delivery, live classes, attendance marking, student assessment",
    maxDiscountPercent: 0,
    permissions: [
      "courses:read", "content:manage",
      "attendance:mark", "attendance:view_batch", "classes:schedule",
      "exams:create", "exams:grade",
      "certificates:verify"
    ],
  },
  {
    code: UserRoleCode.HR,
    name: "Human Resources Officer",
    description: "Employee records, leave administration, organizational directory",
    maxDiscountPercent: 0,
    permissions: [
      "hr:employees:manage", "hr:leaves:review", "hr:sensitive:view",
      "attendance:view_all"
    ],
  },
  {
    code: UserRoleCode.ACCOUNTANT,
    name: "Finance & Accounts Officer",
    description: "Fee ledger verification, offline payments, receipt reconciliation",
    maxDiscountPercent: 0,
    permissions: [
      "admissions:read",
      "payments:record_offline", "payments:view_ledger"
    ],
  },
  {
    code: UserRoleCode.PLACEMENT_OFFICER,
    name: "Placement & Corporate Officer",
    description: "Hiring partner onboarding, job posting, interview pipeline tracking",
    maxDiscountPercent: 0,
    permissions: [
      "placement:manage_companies", "placement:manage_jobs", "placement:view_students", "placement:update_status",
      "certificates:verify"
    ],
  },
  {
    code: UserRoleCode.STUDENT,
    name: "Enrolled Student",
    description: "Course consumption, assignment submission, exam taking, portfolio",
    maxDiscountPercent: 0,
    permissions: [
      "courses:read",
      "exams:take",
      "certificates:verify"
    ],
  },
];

async function main() {
  console.log("==> Starting SOFTLAB GLOBAL database seeding...");

  // 1. Seed all 11 Roles
  console.log("--> Seeding 11 documented institutional roles...");
  for (const roleDef of ROLES_DEFINITIONS) {
    await prisma.role.upsert({
      where: { code: roleDef.code },
      update: {
        name: roleDef.name,
        description: roleDef.description,
        permissions: roleDef.permissions,
        maxDiscountPercent: roleDef.maxDiscountPercent,
      },
      create: {
        code: roleDef.code,
        name: roleDef.name,
        description: roleDef.description,
        permissions: roleDef.permissions,
        maxDiscountPercent: roleDef.maxDiscountPercent,
      },
    });
  }
  console.log("✓ Roles seeded successfully.");

  const resetPasswordsFlag = process.env.RESET_SEED_PASSWORDS === "true";

  async function seedUserAccount(params: {
    email: string;
    firstName: string;
    lastName: string;
    roleCode: UserRoleCode;
    passwordEnvVar: string | undefined;
    roleLabel: string;
  }) {
    const { email, firstName, lastName, roleCode, passwordEnvVar, roleLabel } = params;
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      let newHash: string | undefined = undefined;
      if (resetPasswordsFlag) {
        if (passwordEnvVar && passwordEnvVar.trim().length >= 8) {
          newHash = await bcrypt.hash(passwordEnvVar.trim(), 12);
          console.log(`   [SECURITY] Explicit password reset applied for ${roleLabel} (${email}) via RESET_SEED_PASSWORDS=true.`);
        } else {
          console.warn(`   [SECURITY] RESET_SEED_PASSWORDS=true was set, but no valid password env var provided for ${roleLabel} (${email}). Password preserved.`);
        }
      }

      const updated = await prisma.user.update({
        where: { email },
        data: {
          firstName,
          lastName,
          roleCode,
          status: UserStatus.ACTIVE,
          ...(newHash ? { passwordHash: newHash } : {}),
        },
      });

      if (newHash) {
        await prisma.auditLog.create({
          data: {
            actorId: updated.id,
            action: "AUTH_SEED_PASSWORD_RESET",
            resourceType: "User",
            resourceId: updated.id,
            newData: { email, reason: "Explicit RESET_SEED_PASSWORDS invocation" },
          },
        });
      }

      return updated;
    }

    if (!passwordEnvVar || passwordEnvVar.trim().length < 8) {
      throw new Error(
        `Cannot seed new ${roleLabel} account (${email}): missing required password environment variable (min 8 chars). Please configure it in .env.`
      );
    }

    const passwordHash = await bcrypt.hash(passwordEnvVar.trim(), 12);
    const created = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        passwordHash,
        roleCode,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: created.id,
        action: "SYSTEM_INITIALIZE_USER",
        resourceType: "User",
        resourceId: created.id,
        newData: { email, roleCode },
      },
    });

    return created;
  }

  // 2. Seed Initial SUPER_ADMIN from environment variables
  const adminEmail = process.env.INITIAL_SUPER_ADMIN_EMAIL || "admin@softlabglobal.com";
  const adminName = process.env.INITIAL_SUPER_ADMIN_NAME || "Super Administrator";
  const [adminFirstName, ...adminRestName] = adminName.split(" ");
  const adminLastName = adminRestName.join(" ") || "Admin";
  const adminPasswordEnv = process.env.SEED_SUPER_ADMIN_PASSWORD || process.env.INITIAL_SUPER_ADMIN_PASSWORD;

  console.log(`--> Seeding initial Super Administrator (${adminEmail})...`);
  const superAdmin = await seedUserAccount({
    email: adminEmail,
    firstName: adminFirstName,
    lastName: adminLastName,
    roleCode: UserRoleCode.SUPER_ADMIN,
    passwordEnvVar: adminPasswordEnv,
    roleLabel: "Super Administrator",
  });
  console.log("✓ Super Administrator seeded successfully.");

  // 3. Seed Sample Trainer User and TrainerProfile
  const trainerEmail = process.env.SEED_TRAINER_EMAIL || "trainer@softlabglobal.com";
  const trainerPasswordEnv = process.env.SEED_TRAINER_PASSWORD;

  console.log(`--> Seeding sample Trainer account (${trainerEmail})...`);
  const trainerUser = await seedUserAccount({
    email: trainerEmail,
    firstName: "Dr. Rajesh",
    lastName: "Sharma",
    roleCode: UserRoleCode.TRAINER,
    passwordEnvVar: trainerPasswordEnv,
    roleLabel: "Trainer",
  });

  const trainerProfile = await prisma.trainerProfile.upsert({
    where: { userId: trainerUser.id },
    update: {
      specializations: ["Full Stack Web Development", "Cloud DevOps", "Node.js", "System Architecture"],
      bio: "Distinguished Principal Educator with 8+ years experience architecting enterprise distributed web applications.",
      experienceYears: 8,
    },
    create: {
      userId: trainerUser.id,
      specializations: ["Full Stack Web Development", "Cloud DevOps", "Node.js", "System Architecture"],
      bio: "Distinguished Principal Educator with 8+ years experience architecting enterprise distributed web applications.",
      experienceYears: 8,
    },
  });
  console.log("✓ Trainer account and profile seeded successfully.");

  // 4. Seed 3 High-Demand Courses with integer Paise pricing
  console.log("--> Seeding 3 institutional courses with integer Paise pricing...");
  
  const course1 = await prisma.course.upsert({
    where: { slug: "full-stack-web-development" },
    update: {
      title: "Full Stack Web Development & Cloud DevOps",
      summary: "Master modern full-stack web applications with React, Node.js, Next.js, TypeScript, PostgreSQL, and Cloud Deployment.",
      description: "Comprehensive industry-oriented curriculum designed for aspiring full-stack engineers. Covers Next.js App Router, Prisma ORM, REST/tRPC APIs, Docker, CI/CD, and Cloud Infrastructure.",
      baseFee: 5000000, // ₹50,000 in integer Paise
      durationWeeks: 16,
      level: "Beginner to Advanced",
      language: "English / Hindi",
      eligibility: "Graduates, Engineers, or Diploma Holders in any discipline",
      status: ContentStatus.PUBLISHED,
    },
    create: {
      title: "Full Stack Web Development & Cloud DevOps",
      slug: "full-stack-web-development",
      summary: "Master modern full-stack web applications with React, Node.js, Next.js, TypeScript, PostgreSQL, and Cloud Deployment.",
      description: "Comprehensive industry-oriented curriculum designed for aspiring full-stack engineers. Covers Next.js App Router, Prisma ORM, REST/tRPC APIs, Docker, CI/CD, and Cloud Infrastructure.",
      baseFee: 5000000, // ₹50,000 in integer Paise
      durationWeeks: 16,
      level: "Beginner to Advanced",
      language: "English / Hindi",
      eligibility: "Graduates, Engineers, or Diploma Holders in any discipline",
      status: ContentStatus.PUBLISHED,
    },
  });

  const course2 = await prisma.course.upsert({
    where: { slug: "data-science-machine-learning" },
    update: {
      title: "Data Science & Machine Learning Masterclass",
      summary: "End-to-end data analytics, statistical modeling, machine learning pipelines, deep learning, and generative AI using Python.",
      description: "Hands-on data science program featuring NumPy, Pandas, Scikit-Learn, PyTorch, Model Deployment, and real-world predictive AI systems.",
      baseFee: 6000000, // ₹60,000 in integer Paise
      durationWeeks: 16,
      level: "Intermediate to Advanced",
      language: "English / Hindi",
      eligibility: "Basic programming background or Mathematics / Statistics foundation",
      status: ContentStatus.PUBLISHED,
    },
    create: {
      title: "Data Science & Machine Learning Masterclass",
      slug: "data-science-machine-learning",
      summary: "End-to-end data analytics, statistical modeling, machine learning pipelines, deep learning, and generative AI using Python.",
      description: "Hands-on data science program featuring NumPy, Pandas, Scikit-Learn, PyTorch, Model Deployment, and real-world predictive AI systems.",
      baseFee: 6000000, // ₹60,000 in integer Paise
      durationWeeks: 16,
      level: "Intermediate to Advanced",
      language: "English / Hindi",
      eligibility: "Basic programming background or Mathematics / Statistics foundation",
      status: ContentStatus.PUBLISHED,
    },
  });

  const course3 = await prisma.course.upsert({
    where: { slug: "cybersecurity-ethical-hacking" },
    update: {
      title: "Cybersecurity & Ethical Hacking Professional",
      summary: "Learn defensive and offensive cybersecurity, network vulnerability assessment, penetration testing, and digital forensics.",
      description: "Industry standard training aligned with CEH standards. Master Kali Linux, Wireshark, Metasploit, web application penetration testing, and SIEM security analytics.",
      baseFee: 4500000, // ₹45,000 in integer Paise
      durationWeeks: 12,
      level: "Beginner to Intermediate",
      language: "English / Hindi",
      eligibility: "Basic networking concepts or strong passion for digital security",
      status: ContentStatus.DRAFT,
    },
    create: {
      title: "Cybersecurity & Ethical Hacking Professional",
      slug: "cybersecurity-ethical-hacking",
      summary: "Learn defensive and offensive cybersecurity, network vulnerability assessment, penetration testing, and digital forensics.",
      description: "Industry standard training aligned with CEH standards. Master Kali Linux, Wireshark, Metasploit, web application penetration testing, and SIEM security analytics.",
      baseFee: 4500000, // ₹45,000 in integer Paise
      durationWeeks: 12,
      level: "Beginner to Intermediate",
      language: "English / Hindi",
      eligibility: "Basic networking concepts or strong passion for digital security",
      status: ContentStatus.DRAFT,
    },
  });

  // Assign trainer to Full Stack course
  await prisma.courseTrainer.upsert({
    where: {
      courseId_trainerId: {
        courseId: course1.id,
        trainerId: trainerProfile.id,
      },
    },
    update: {},
    create: {
      courseId: course1.id,
      trainerId: trainerProfile.id,
    },
  });
  console.log("✓ 3 courses and trainer assignment seeded successfully.");

  // 5. Seed Sample Batches
  console.log("--> Seeding academic batches...");
  const batch1 = await prisma.batch.upsert({
    where: { code: "FSWD-2026-B1" },
    update: {
      courseId: course1.id,
      name: "Full Stack Cohort Alpha",
      startDate: new Date("2026-09-15T09:00:00.000Z"),
      endDate: new Date("2027-01-15T18:00:00.000Z"),
      status: BatchStatus.ONGOING,
      maxCapacity: 30,
      deliveryMode: DeliveryMode.HYBRID,
      location: "Prayagraj Campus Room 101 / Zoom Live Link",
    },
    create: {
      courseId: course1.id,
      code: "FSWD-2026-B1",
      name: "Full Stack Cohort Alpha",
      startDate: new Date("2026-09-15T09:00:00.000Z"),
      endDate: new Date("2027-01-15T18:00:00.000Z"),
      status: BatchStatus.ONGOING,
      maxCapacity: 30,
      deliveryMode: DeliveryMode.HYBRID,
      location: "Prayagraj Campus Room 101 / Zoom Live Link",
    },
  });

  // Assign Dr. Rajesh Sharma as primary trainer for batch1
  await prisma.batchTrainer.upsert({
    where: {
      batchId_trainerId: {
        batchId: batch1.id,
        trainerId: trainerProfile.id,
      },
    },
    update: { isPrimary: true },
    create: {
      batchId: batch1.id,
      trainerId: trainerProfile.id,
      isPrimary: true,
    },
  });

  const batch2 = await prisma.batch.upsert({
    where: { code: "DSML-2026-B1" },
    update: {
      courseId: course2.id,
      name: "Data Science Cohort 1",
      startDate: new Date("2026-10-01T09:00:00.000Z"),
      endDate: new Date("2027-02-01T18:00:00.000Z"),
      status: BatchStatus.OPEN_FOR_ENROLLMENT,
      maxCapacity: 25,
      deliveryMode: DeliveryMode.ONLINE,
      location: "Live Virtual Classroom (Google Meet)",
    },
    create: {
      courseId: course2.id,
      code: "DSML-2026-B1",
      name: "Data Science Cohort 1",
      startDate: new Date("2026-10-01T09:00:00.000Z"),
      endDate: new Date("2027-02-01T18:00:00.000Z"),
      status: BatchStatus.OPEN_FOR_ENROLLMENT,
      maxCapacity: 25,
      deliveryMode: DeliveryMode.ONLINE,
      location: "Live Virtual Classroom (Google Meet)",
    },
  });
  console.log("✓ Sample batches seeded successfully.");

  // 6. Seed Scheduled Classes for batch1
  console.log("--> Seeding scheduled class sessions for FSWD-2026-B1...");
  const existingClasses = await prisma.scheduledClass.findMany({
    where: { batchId: batch1.id },
  });

  if (existingClasses.length === 0) {
    await prisma.scheduledClass.createMany({
      data: [
        {
          batchId: batch1.id,
          trainerId: trainerProfile.id,
          title: "Introduction to Modern Full Stack Architecture & TypeScript Fundamentals",
          scheduledAt: new Date("2026-09-18T10:00:00.000Z"),
          durationMin: 90,
          mode: DeliveryMode.HYBRID,
          location: "Campus Lab 101 + https://meet.google.com/xyz-abcd-efg",
          agendaNotes: "Overview of Node.js event loop, TypeScript strict compilation, project workspace layout.",
        },
        {
          batchId: batch1.id,
          trainerId: trainerProfile.id,
          title: "Relational Modeling with PostgreSQL & Prisma 5.x",
          scheduledAt: new Date("2026-09-20T10:00:00.000Z"),
          durationMin: 90,
          mode: DeliveryMode.HYBRID,
          location: "Campus Lab 101 + https://meet.google.com/xyz-abcd-efg",
          agendaNotes: "Schema design, relations (1:1, 1:N, M:N), constraints, migrations, and integer Paise financial precision.",
        },
        {
          batchId: batch1.id,
          trainerId: trainerProfile.id,
          title: "Building End-to-End Type-Safe APIs with tRPC v11 & Next.js 14",
          scheduledAt: new Date("2026-09-22T10:00:00.000Z"),
          durationMin: 90,
          mode: DeliveryMode.HYBRID,
          location: "Campus Lab 101 + https://meet.google.com/xyz-abcd-efg",
          agendaNotes: "Routers, procedure middleware, role guards, Zod validation, superjson transformer.",
        },
      ],
    });
  }
  console.log("✓ Scheduled classes seeded successfully.");

  // 7. Seed Curriculum Modules & Lessons for FSWD Course
  console.log("--> Seeding realistic course curriculum for Full Stack Web Development...");
  const existingModules = await prisma.module.findMany({
    where: { courseId: course1.id },
  });

  if (existingModules.length === 0) {
    // Module 1
    const m1 = await prisma.module.create({
      data: {
        courseId: course1.id,
        title: "Module 1: Production TypeScript & Architecture",
        description: "Master clean code standards, type-level programming, and modular system design.",
        sortOrder: 0,
        status: ContentStatus.PUBLISHED,
        lessons: {
          create: [
            {
              title: "Strict TypeScript & Type-Level Design Patterns",
              summary: "Exploring strict compiler options, discriminated unions, and branded primitives.",
              type: LessonType.RICH_TEXT,
              durationMin: 45,
              sortOrder: 0,
              status: ContentStatus.PUBLISHED,
              isFreePreview: true,
              contentDetails: {
                create: {
                  bodyHtml: "<h1>Strict TypeScript & Type-Level Patterns</h1><p>Learn to avoid 'any' and use Zod schema validation.</p>",
                },
              },
            },
            {
              title: "Clean Architecture & Modular Monolith Topology",
              summary: "Separating presentation, API routing, business services, and database persistence.",
              type: LessonType.VIDEO,
              durationMin: 60,
              sortOrder: 1,
              status: ContentStatus.PUBLISHED,
              isFreePreview: false,
              contentDetails: {
                create: {
                  videoProvider: "BUNNY",
                  bunnyVideoId: "slg-mod1-arch-video-01",
                  videoUrl: "https://video.softlabglobal.com/slg-mod1-arch-video-01/playlist.m3u8",
                },
              },
            },
            {
              title: "Institutional Standards & Code Review Guide",
              summary: "Production standards, file length caps (<350 lines), and naming conventions.",
              type: LessonType.DOCUMENT,
              durationMin: 30,
              sortOrder: 2,
              status: ContentStatus.PUBLISHED,
              isFreePreview: false,
              contentDetails: {
                create: {
                  fileName: "SOFTLAB-GLOBAL-Engineering-Standards.pdf",
                  documentUrl: "https://docs.softlabglobal.com/standards.pdf",
                },
              },
            },
          ],
        },
      },
    });

    // Module 2
    const m2 = await prisma.module.create({
      data: {
        courseId: course1.id,
        title: "Module 2: Next.js 14 App Router & Full Stack APIs",
        description: "Server Components, Route Handlers, Edge Middleware, and tRPC v11 integration.",
        sortOrder: 1,
        status: ContentStatus.PUBLISHED,
        lessons: {
          create: [
            {
              title: "Server Components vs Client Components Deep Dive",
              summary: "Mental model of streaming SSR, hydration boundaries, and bundle optimization.",
              type: LessonType.VIDEO,
              durationMin: 50,
              sortOrder: 0,
              status: ContentStatus.PUBLISHED,
              isFreePreview: true,
              contentDetails: {
                create: {
                  videoProvider: "BUNNY",
                  bunnyVideoId: "slg-mod2-rsc-video-01",
                  videoUrl: "https://video.softlabglobal.com/slg-mod2-rsc-video-01/playlist.m3u8",
                },
              },
            },
            {
              title: "Edge Middleware & Session Cookie Security",
              summary: "Protecting sensitive portal boundaries with NextAuth v5 HttpOnly JWT tokens.",
              type: LessonType.RICH_TEXT,
              durationMin: 40,
              sortOrder: 1,
              status: ContentStatus.PUBLISHED,
              isFreePreview: false,
              contentDetails: {
                create: {
                  bodyHtml: "<h2>Edge Security Architecture</h2><p>Middleware role matching and redirection patterns.</p>",
                },
              },
            },
            {
              title: "External Integration Repositories & Lab Setup",
              summary: "Official starter template and continuous integration workflows.",
              type: LessonType.EXTERNAL_LINK,
              durationMin: 25,
              sortOrder: 2,
              status: ContentStatus.DRAFT,
              isFreePreview: false,
              contentDetails: {
                create: {
                  externalUrl: "https://github.com/softlabglobal/starter-template",
                },
              },
            },
          ],
        },
      },
    });

    // Module 3
    const m3 = await prisma.module.create({
      data: {
        courseId: course1.id,
        title: "Module 3: PostgreSQL Relational Design & Prisma ORM",
        description: "Schema modeling, relations, ACID financial transactions, and integer Paise precision.",
        sortOrder: 2,
        status: ContentStatus.DRAFT,
        lessons: {
          create: [
            {
              title: "Relational Modeling, Foreign Keys & ACID Transactions",
              summary: "Engineering robust schemas, indexes, and transactional boundaries.",
              type: LessonType.RICH_TEXT,
              durationMin: 60,
              sortOrder: 0,
              status: ContentStatus.DRAFT,
              isFreePreview: false,
              contentDetails: {
                create: {
                  bodyHtml: "<h3>Relational Database Modeling</h3><p>Prisma transactions and composite unique keys.</p>",
                },
              },
            },
            {
              title: "Integer Financial Precision & Deterministic Money Math",
              summary: "Why floating-point arithmetic is banned; strictly storing Indian currency in Paise.",
              type: LessonType.RICH_TEXT,
              durationMin: 45,
              sortOrder: 1,
              status: ContentStatus.DRAFT,
              isFreePreview: false,
              contentDetails: {
                create: {
                  bodyHtml: "<h3>Financial Engineering Rules</h3><p>Always compute in Paise (1 INR = 100 Paise).</p>",
                },
              },
            },
          ],
        },
      },
    });
  }
  console.log("✓ Course curriculum seeded successfully.");

  // 6. Seed Sample Student Account, Profile, and Enrollment
  const studentEmail = process.env.SEED_STUDENT_EMAIL || "student@softlabglobal.com";
  const studentPasswordEnv = process.env.SEED_STUDENT_PASSWORD;

  console.log(`--> Seeding sample Student account (${studentEmail})...`);
  const studentUser = await seedUserAccount({
    email: studentEmail,
    firstName: "Aarav",
    lastName: "Sharma",
    roleCode: UserRoleCode.STUDENT,
    passwordEnvVar: studentPasswordEnv,
    roleLabel: "Student",
  });

  const studentProfile = await prisma.studentProfile.upsert({
    where: { userId: studentUser.id },
    update: {
      studentId: "SLG-2026-0001",
      city: "Prayagraj",
      state: "Uttar Pradesh",
      highestDegree: "B.Tech Computer Science",
    },
    create: {
      userId: studentUser.id,
      studentId: "SLG-2026-0001",
      city: "Prayagraj",
      state: "Uttar Pradesh",
      highestDegree: "B.Tech Computer Science",
    },
  });

  // Enroll student into course1 and batch1
  if (course1 && batch1) {
    const enrollment = await prisma.enrollment.upsert({
      where: {
        studentId_courseId: {
          studentId: studentProfile.id,
          courseId: course1.id,
        },
      },
      update: {
        batchId: batch1.id,
        status: EnrollmentStatus.ACTIVE,
      },
      create: {
        studentId: studentProfile.id,
        courseId: course1.id,
        batchId: batch1.id,
        status: EnrollmentStatus.ACTIVE,
      },
    });

    // Find first published lesson and mark it completed for real seed progress
    const firstLesson = await prisma.lesson.findFirst({
      where: {
        module: { courseId: course1.id, status: ContentStatus.PUBLISHED },
        status: ContentStatus.PUBLISHED,
        deletedAt: null,
      },
      orderBy: { sortOrder: "asc" },
    });

    if (firstLesson) {
      await prisma.lessonProgress.upsert({
        where: {
          enrollmentId_lessonId: {
            enrollmentId: enrollment.id,
            lessonId: firstLesson.id,
          },
        },
        update: {
          isCompleted: true,
          completedAt: new Date(),
        },
        create: {
          enrollmentId: enrollment.id,
          lessonId: firstLesson.id,
          isCompleted: true,
          completedAt: new Date(),
        },
      });

      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          lastAccessedLessonId: firstLesson.id,
          lastAccessedAt: new Date(),
        },
      });
    }
  }
  console.log("✓ Sample Student account, profile, and enrollment seeded successfully.");

  // 9. Seed Sample Verified Class Attendance for FSWD-2026-B1
  console.log("--> Seeding verified session attendance for completed lecture...");
  const firstSession = await prisma.scheduledClass.findFirst({
    where: { batchId: batch1.id },
    orderBy: { scheduledAt: "asc" },
  });

  if (firstSession && studentProfile) {
    const studentEnrollment = await prisma.enrollment.findFirst({
      where: { studentId: studentProfile.id, batchId: batch1.id },
    });

    await prisma.scheduledClass.update({
      where: { id: firstSession.id },
      data: {
        status: ClassSessionStatus.COMPLETED,
        topicCovered: "Introduction to Full Stack Architecture, Strict TypeScript, and Git Workflows",
      },
    });

    const attendanceRecord = await prisma.attendanceRecord.upsert({
      where: { sessionId: firstSession.id },
      update: {
        topicCovered: "Introduction to Full Stack Architecture, Strict TypeScript, and Git Workflows",
      },
      create: {
        batchId: batch1.id,
        sessionId: firstSession.id,
        date: firstSession.scheduledAt,
        markedById: trainerUser.id,
        topicCovered: "Introduction to Full Stack Architecture, Strict TypeScript, and Git Workflows",
      },
    });

    await prisma.attendanceEntry.upsert({
      where: {
        recordId_studentId: {
          recordId: attendanceRecord.id,
          studentId: studentProfile.id,
        },
      },
      update: {
        status: AttendanceStatus.PRESENT,
        remark: "Punctual, completed lab setup",
      },
      create: {
        recordId: attendanceRecord.id,
        studentId: studentProfile.id,
        enrollmentId: studentEnrollment?.id || null,
        status: AttendanceStatus.PRESENT,
        remark: "Punctual, completed lab setup",
      },
    });
    console.log("✓ Sample verified attendance record and student entry seeded successfully.");
  }

  // 10. Seed Secondary Faculty Account for Cross-Trainer Verification
  console.log("--> Seeding secondary faculty trainer for isolation testing...");
  const trainer2Email = "faculty2@softlabglobal.com";
  const trainer2User = await seedUserAccount({
    email: trainer2Email,
    firstName: "Prof. Vikram",
    lastName: "Verma",
    roleCode: UserRoleCode.TRAINER,
    passwordEnvVar: process.env.SEED_TRAINER_PASSWORD || process.env.INITIAL_TRAINER_PASSWORD || process.env.INITIAL_SUPER_ADMIN_PASSWORD,
    roleLabel: "Secondary Trainer",
  });

  await prisma.trainerProfile.upsert({
    where: { userId: trainer2User.id },
    update: {
      specializations: ["Cybersecurity", "Network Defense"],
      experienceYears: 8,
    },
    create: {
      userId: trainer2User.id,
      specializations: ["Cybersecurity", "Network Defense"],
      experienceYears: 8,
    },
  });
  console.log("✓ Secondary faculty trainer account seeded successfully.");

  // 11. Seed Day 7 Admissions CRM Staff & Sample Pipeline Data
  console.log("--> Seeding Day 7 Admissions CRM staff, sample leads, and applications...");
  const counselorPassword =
    process.env.SEED_COUNSELOR_PASSWORD ||
    process.env.SEED_SUPER_ADMIN_PASSWORD ||
    process.env.INITIAL_SUPER_ADMIN_PASSWORD;

  const counselorUser = await seedUserAccount({
    email: "counselor@softlabglobal.com",
    firstName: "Amit",
    lastName: "Tripathi",
    roleCode: UserRoleCode.COUNSELOR,
    passwordEnvVar: counselorPassword,
    roleLabel: "Academic Counselor",
  });

  const telecallerUser = await seedUserAccount({
    email: "telecaller@softlabglobal.com",
    firstName: "Priya",
    lastName: "Mishra",
    roleCode: UserRoleCode.TELECALLER,
    passwordEnvVar: counselorPassword,
    roleLabel: "Telecaller",
  });

  // Seed sample leads idempotently
  const existingLead = await prisma.lead.findFirst({ where: { email: "amit.verma@example.com" } });
  if (!existingLead) {
    const lead1 = await prisma.lead.create({
      data: {
        fullName: "Amit Verma",
        email: "amit.verma@example.com",
        phone: "9876500001",
        city: "Prayagraj",
        source: LeadSource.WEBSITE,
        status: LeadStatus.NEW,
        interestedCourseId: course1.id,
        notes: "Interested in weekend batch options for Full Stack Web Development.",
      },
    });

    const lead2 = await prisma.lead.create({
      data: {
        fullName: "Neha Gupta",
        email: "neha.gupta@example.com",
        phone: "9876500002",
        city: "Varanasi",
        source: LeadSource.GOOGLE_SEARCH,
        status: LeadStatus.FOLLOW_UP,
        interestedCourseId: course2.id,
        assignedToId: counselorUser.id,
        nextFollowUp: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await prisma.followUpHistory.create({
      data: {
        leadId: lead2.id,
        type: FollowUpType.CALL,
        notes: "Discussed Python prerequisites and AI curriculum. Candidate requested syllabus brochure.",
        performedById: counselorUser.id,
      },
    });

    const lead3 = await prisma.lead.create({
      data: {
        fullName: "Siddharth Rao",
        email: "siddharth.rao@example.com",
        phone: "9876500003",
        city: "Lucknow",
        source: LeadSource.REFERRAL,
        status: LeadStatus.INTERESTED,
        interestedCourseId: course1.id,
        assignedToId: counselorUser.id,
      },
    });

    await prisma.admissionApplication.create({
      data: {
        applicationNumber: "APP-2026-0001",
        leadId: lead3.id,
        courseId: course1.id,
        counselorId: counselorUser.id,
        stage: ApplicationStage.SUBMITTED,
        applicantName: "Siddharth Rao",
        applicantEmail: "siddharth.rao@example.com",
        applicantPhone: "9876500003",
        highestQualification: "B.Tech Computer Science",
        city: "Lucknow",
      },
    });
    console.log("✓ Sample leads, follow-up history, and admission application seeded successfully.");
  } else {
    console.log("✓ Sample CRM leads already seeded, preserving records.");
  }

  // 12. Seed Day 8 Finance & Enrollment Billing Foundation
  console.log("--> Seeding Day 8 Finance staff, student fee structure, installments, and verified payment...");
  const accountantPassword =
    process.env.SEED_ACCOUNTANT_PASSWORD ||
    process.env.SEED_SUPER_ADMIN_PASSWORD ||
    process.env.INITIAL_SUPER_ADMIN_PASSWORD;

  const accountantUser = await seedUserAccount({
    email: "accountant@softlabglobal.com",
    firstName: "Ramesh",
    lastName: "Srivastava",
    roleCode: UserRoleCode.ACCOUNTANT,
    passwordEnvVar: accountantPassword,
    roleLabel: "Finance & Accounts Officer",
  });

  if (studentProfile && course1) {
    const studentEnrollment = await prisma.enrollment.findFirst({
      where: { studentId: studentProfile.id, courseId: course1.id },
    });

    if (studentEnrollment) {
      const existingFee = await prisma.feeStructure.findUnique({
        where: { enrollmentId: studentEnrollment.id },
      });

      if (!existingFee) {
        // ₹50,000 course fee, ₹5,000 scholarship discount -> ₹45,000 net payable
        const feeStructure = await prisma.feeStructure.create({
          data: {
            studentId: studentProfile.id,
            enrollmentId: studentEnrollment.id,
            courseId: course1.id,
            batchId: studentEnrollment.batchId,
            totalCourseFee: 5000000, // ₹50,000 in Paise
            registrationFee: 0,
            discountAmount: 0,
            scholarshipAmount: 500000, // ₹5,000 scholarship concession
            netPayableAmount: 4500000, // ₹45,000 in Paise
            paidAmount: 2000000, // ₹20,000 initial payment
            pendingAmount: 2500000, // ₹25,000 remaining
            paymentStatus: FeePaymentStatus.PARTIAL,
            status: FeeStructureStatus.ACTIVE,
            remarks: "Merit scholarship discount applied for initial cohort batch.",
            createdById: accountantUser.id,
          },
        });

        // Installment 1: ₹20,000 (PAID)
        const inst1 = await prisma.feeInstallment.create({
          data: {
            feeStructureId: feeStructure.id,
            installmentNumber: 1,
            amount: 2000000,
            paidAmount: 2000000,
            dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
            status: InstallmentStatus.PAID,
            paidAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            notes: "Initial admission milestone installment.",
          },
        });

        // Installment 2: ₹25,000 (PENDING)
        await prisma.feeInstallment.create({
          data: {
            feeStructureId: feeStructure.id,
            installmentNumber: 2,
            amount: 2500000,
            paidAmount: 0,
            dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days in future
            status: InstallmentStatus.PENDING,
            notes: "Mid-cohort milestone installment.",
          },
        });

        // Verified Payment: ₹20,000 via UPI
        await prisma.paymentTransaction.create({
          data: {
            transactionReference: "PAY-2026-0001",
            feeStructureId: feeStructure.id,
            installmentId: inst1.id,
            studentId: studentProfile.id,
            enrollmentId: studentEnrollment.id,
            amount: 2000000,
            paymentDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            paymentMethod: PaymentMethod.UPI,
            status: PaymentTransactionStatus.SUCCESS,
            providerReference: "UPI-ICICI-4938291048",
            remarks: "Online UPI collection verified at Accounts Desk.",
            receivedById: accountantUser.id,
          },
        });

        console.log("✓ Sample student fee structure, installments, and payment transaction seeded successfully.");
      } else {
        console.log("✓ Student fee structure already exists, preserving records.");
      }
    }
  }

  console.log("==> Day 8 Database Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
