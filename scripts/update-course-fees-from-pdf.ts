import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface FeeUpdate {
  slug: string;
  pdfTitle: string;
  durationMonths: number;
  durationWeeks: number;
  feeInr: number;
}

const PDF_FEES: FeeUpdate[] = [
  {
    slug: "technical-support-engineer",
    pdfTitle: "Technical Support Engineer",
    durationMonths: 3,
    durationWeeks: 12,
    feeInr: 35000,
  },
  {
    slug: "cpp-programming-complete-course",
    pdfTitle: "C++ Programming Complete Course (Basic To Advanced)",
    durationMonths: 3,
    durationWeeks: 12,
    feeInr: 35000,
  },
  {
    slug: "mysql-advanced-course",
    pdfTitle: "MySQL Advanced Course(Beginner To Expert)",
    durationMonths: 6,
    durationWeeks: 24,
    feeInr: 65000,
  },
  {
    slug: "digital-marketing-master-class",
    pdfTitle: "Digital Marketing Master class",
    durationMonths: 3,
    durationWeeks: 12,
    feeInr: 45000,
  },
  {
    slug: "java-full-stack-developer",
    pdfTitle: "Java Full Stack Developer",
    durationMonths: 6,
    durationWeeks: 24,
    feeInr: 85000,
  },
  {
    slug: "python-full-stack-developer",
    pdfTitle: "Python Full Stack Developer",
    durationMonths: 6,
    durationWeeks: 24,
    feeInr: 85000,
  },
  {
    slug: "full-web-development",
    pdfTitle: "Full Web Development",
    durationMonths: 3,
    durationWeeks: 12,
    feeInr: 35000,
  },
  {
    slug: "graphics-designing-master-level",
    pdfTitle: "Graphics Designing Master Level",
    durationMonths: 3,
    durationWeeks: 12,
    feeInr: 45000,
  },
  {
    slug: "cyber-security-complete-course",
    pdfTitle: "Cyber Security Complete Course",
    durationMonths: 6,
    durationWeeks: 24,
    feeInr: 115000,
  },
  {
    slug: "oracle-database-administration-dba",
    pdfTitle: "Oracle Database Administration (DBA) with Oracle Cloud Integration",
    durationMonths: 6,
    durationWeeks: 24,
    feeInr: 75000,
  },
  {
    slug: "data-science-master-level",
    pdfTitle: "Data Science Master Level",
    durationMonths: 6,
    durationWeeks: 24,
    feeInr: 75000,
  },
  {
    slug: "mern-full-stack-developer",
    pdfTitle: "Mern Full Stack Developer",
    durationMonths: 6,
    durationWeeks: 24,
    feeInr: 85000,
  },
  {
    slug: "master-in-artificial-intelligence-and-machine-learning",
    pdfTitle: "Master In Artificial Intellegence and machine learning",
    durationMonths: 12,
    durationWeeks: 48,
    feeInr: 125000,
  },
  {
    slug: "certificate-in-cloud-computing-and-cyber-security-with-ai",
    pdfTitle: "Certificate in Cloud Computing And Cyber Security With AI",
    durationMonths: 12,
    durationWeeks: 48,
    feeInr: 90000,
  },
  {
    slug: "certificate-in-cloud-computing-with-devops",
    pdfTitle: "Certificate IN Cloud Computing With DevOPS",
    durationMonths: 6,
    durationWeeks: 24,
    feeInr: 70000,
  },
  {
    slug: "certificate-in-advance-networking",
    pdfTitle: "Certificate in Advance Networking",
    durationMonths: 3,
    durationWeeks: 12,
    feeInr: 35000,
  },
  {
    slug: "master-in-cloud-administration",
    pdfTitle: "Master In Cloud Administration",
    durationMonths: 3,
    durationWeeks: 12,
    feeInr: 45000,
  },
  {
    slug: "master-in-linux-administration",
    pdfTitle: "Master in Linux Administration",
    durationMonths: 3,
    durationWeeks: 12,
    feeInr: 45000,
  },
  {
    slug: "master-in-server-administration",
    pdfTitle: "Master In Server Administration",
    durationMonths: 3,
    durationWeeks: 12,
    feeInr: 45000,
  },
  {
    slug: "certificate-in-office-365-admin",
    pdfTitle: "Certificate in Office 365 Admin",
    durationMonths: 1,
    durationWeeks: 4,
    feeInr: 25000,
  },
  {
    slug: "certificate-in-c-language",
    pdfTitle: "Certificate in C Language",
    durationMonths: 3,
    durationWeeks: 12,
    feeInr: 25000,
  },
];

async function main() {
  console.log("=== UPDATING ALL 21 SOFTLAB COURSES WITH AUTHENTIC PDF FEES ===");

  // 1. Update curriculum-21-courses.json
  const jsonPath = path.join(__dirname, "curriculum-21-courses.json");
  const rawData = fs.readFileSync(jsonPath, "utf-8");
  const coursesJson: any[] = JSON.parse(rawData);

  const feeMap = new Map<string, FeeUpdate>();
  PDF_FEES.forEach((item) => feeMap.set(item.slug, item));

  let jsonUpdatedCount = 0;
  for (const c of coursesJson) {
    const feeInfo = feeMap.get(c.slug);
    if (feeInfo) {
      c.baseFee = feeInfo.feeInr * 100; // in paise
      c.durationWeeks = feeInfo.durationWeeks;
      jsonUpdatedCount++;
      console.log(`JSON Updated: ${c.title} -> Rs.${feeInfo.feeInr} (${feeInfo.durationWeeks} weeks)`);
    } else {
      console.warn(`WARNING: Slug not found in fee map: ${c.slug}`);
    }
  }

  fs.writeFileSync(jsonPath, JSON.stringify(coursesJson, null, 2), "utf-8");
  console.log(`Saved ${jsonUpdatedCount} updated courses to curriculum-21-courses.json\n`);

  // 2. Update PostgreSQL database Course records
  let dbUpdatedCount = 0;
  for (const item of PDF_FEES) {
    const updated = await prisma.course.updateMany({
      where: { slug: item.slug },
      data: {
        baseFee: item.feeInr * 100, // in paise
        durationWeeks: item.durationWeeks,
      },
    });

    if (updated.count > 0) {
      dbUpdatedCount += updated.count;
      console.log(`Database Updated: [${item.slug}] -> Rs.${item.feeInr} (${item.durationWeeks} weeks)`);
    } else {
      console.warn(`DATABASE WARNING: No course found with slug ${item.slug}`);
    }
  }

  console.log(`\nSuccessfully updated ${dbUpdatedCount} database course records!`);

  // 3. Verify total published SoftLab courses
  const totalCourses = await prisma.course.findMany({
    where: { providerType: { not: "UNIVERSITY" }, deletedAt: null },
    select: { title: true, slug: true, baseFee: true, durationWeeks: true },
    orderBy: { sortOrder: "asc" },
  });

  console.log(`\nCurrent Database SoftLab Courses (${totalCourses.length} total):`);
  totalCourses.forEach((c, idx) => {
    console.log(`${idx + 1}. ${c.title} | ${c.durationWeeks} Weeks | Rs.${c.baseFee / 100}`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
