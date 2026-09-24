import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const course = await prisma.course.findUnique({
    where: { slug: "technical-support-engineer" },
    include: {
      modules: {
        orderBy: { sortOrder: "asc" },
        include: {
          lessons: {
            orderBy: { sortOrder: "asc" },
            select: { id: true, title: true, sortOrder: true },
          },
        },
      },
    },
  });

  console.log("Course:", course?.title, "Total modules:", course?.modules.length);
  for (const m of course?.modules || []) {
    console.log(`Module [id=${m.id}] [sortOrder=${m.sortOrder}]: "${m.title}" -> ${m.lessons.length} lessons`);
  }


}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
