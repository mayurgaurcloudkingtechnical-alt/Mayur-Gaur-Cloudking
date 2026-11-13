const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Creating events table if not exists...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "events" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "slug" TEXT NOT NULL UNIQUE,
      "programType" TEXT NOT NULL DEFAULT 'EVENT',
      "category" TEXT NOT NULL DEFAULT 'General',
      "summary" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "bannerUrl" TEXT,
      "posterUrl" TEXT,
      "galleryUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
      "videoUrl" TEXT,
      "fee" INTEGER NOT NULL DEFAULT 0,
      "originalFee" INTEGER,
      "duration" TEXT NOT NULL DEFAULT '1 Day',
      "startDate" TIMESTAMP(3),
      "endDate" TIMESTAMP(3),
      "startTime" TEXT,
      "endTime" TEXT,
      "registrationStartDate" TIMESTAMP(3),
      "registrationEndDate" TIMESTAMP(3),
      "venue" TEXT NOT NULL DEFAULT 'SoftLab Global Tech Center, Civil Lines, Prayagraj / Online Hybrid',
      "mode" TEXT NOT NULL DEFAULT 'HYBRID',
      "seatCapacity" INTEGER NOT NULL DEFAULT 100,
      "registeredCount" INTEGER NOT NULL DEFAULT 0,
      "eligibility" TEXT DEFAULT 'Open to all students, IT aspirants and graduates',
      "learningOutcomes" TEXT[] DEFAULT ARRAY[]::TEXT[],
      "syllabus" JSONB,
      "benefits" TEXT[] DEFAULT ARRAY[]::TEXT[],
      "trainerName" TEXT,
      "trainerBio" TEXT,
      "trainerImage" TEXT,
      "certificateTitle" TEXT,
      "certificateType" TEXT DEFAULT 'PARTICIPATION',
      "faqs" JSONB,
      "status" TEXT NOT NULL DEFAULT 'UPCOMING',
      "isFeatured" BOOLEAN NOT NULL DEFAULT false,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "year" INTEGER NOT NULL DEFAULT 2026,
      "month" INTEGER NOT NULL DEFAULT 11,
      "metaTitle" TEXT,
      "metaDescription" TEXT,
      "courseId" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "deletedAt" TIMESTAMP(3)
    )
  `);

  console.log('Creating events indexes...');
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "events_slug_idx" ON "events"("slug")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "events_status_idx" ON "events"("status")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "events_programType_idx" ON "events"("programType")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "events_year_month_idx" ON "events"("year", "month")`);

  console.log('Creating event_registrations table if not exists...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "event_registrations" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "registrationNumber" TEXT NOT NULL UNIQUE,
      "eventId" TEXT NOT NULL,
      "leadId" TEXT,
      "fullName" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "phone" TEXT NOT NULL,
      "city" TEXT,
      "qualification" TEXT,
      "amount" INTEGER NOT NULL DEFAULT 0,
      "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
      "paymentMethod" TEXT,
      "paymentReference" TEXT,
      "razorpayOrderId" TEXT,
      "paidAt" TIMESTAMP(3),
      "attendanceStatus" TEXT NOT NULL DEFAULT 'REGISTERED',
      "certificateIssued" BOOLEAN NOT NULL DEFAULT false,
      "certificateNumber" TEXT,
      "certificateIssuedAt" TIMESTAMP(3),
      "assignedCounselorId" TEXT,
      "notes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('Creating event_registrations indexes...');
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "event_reg_eventId_idx" ON "event_registrations"("eventId")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "event_reg_phone_idx" ON "event_registrations"("phone")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "event_reg_paymentStatus_idx" ON "event_registrations"("paymentStatus")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "event_reg_leadId_idx" ON "event_registrations"("leadId")`);

  console.log('Tables and indexes created successfully in PostgreSQL DB!');
}

main().catch(console.error).finally(() => prisma.$disconnect());