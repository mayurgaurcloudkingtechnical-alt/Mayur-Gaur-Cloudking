import { PrismaClient, ContentStatus } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function run() {
  const jsonPath = path.join(__dirname, "curriculum-21-courses.json");
  const rawData = fs.readFileSync(jsonPath, "utf-8");
  const data: any[] = JSON.parse(rawData);
  const validSlugs = new Set(data.map((c) => c.slug));

  const legacy = await prisma.course.findMany({
    where: {
      providerType: { not: "UNIVERSITY" },
      slug: { notIn: Array.from(validSlugs) },
      status: ContentStatus.PUBLISHED,
    },
    select: { id: true, title: true, slug: true },
  });

  console.log("Found legacy published non-21 courses:", legacy.length);
  for (const c of legacy) {
    console.log(`Archiving legacy course: ${c.title} (${c.slug})`);
    await prisma.course.update({
      where: { id: c.id },
      data: { status: ContentStatus.ARCHIVED },
    });
  }

  const publishedSoftLab = await prisma.course.count({
    where: {
      providerType: { not: "UNIVERSITY" },
      status: ContentStatus.PUBLISHED,
      deletedAt: null,
    },
  });

  console.log("Current Published SoftLab Courses count:", publishedSoftLab);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
