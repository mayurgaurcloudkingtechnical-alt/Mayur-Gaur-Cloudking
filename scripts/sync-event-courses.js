const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncCourses() {
  const programs = [
    {
      title: "Short-Term Skill Development & Vocational Courses",
      slug: "short-term-skill-development-courses-prog",
      summary: "Learn Industry-Ready Tech & Vocational Skills in Just 30–45 Days.",
      description: "Comprehensive 30–45 Days skill development in Programming, Vocational and Advanced IT domains.",
      baseFee: 499900,
      durationWeeks: 6,
      programCategory: "SHORT_TERM",
      status: "PUBLISHED",
      thumbnailUrl: "/images/events/short-term-courses-banner.jpg",
      eventSlug: "short-term-skill-development-courses"
    },
    {
      title: "One-Day AI & Cyber Security Workshop",
      slug: "one-day-ai-cyber-security-workshop-prog",
      summary: "Hands-on One-Day Workshop on AI and Cyber Security.",
      description: "Intensive 1-day immersive workshop covering AI prompting, automation, and cybersecurity defense.",
      baseFee: 79900,
      durationWeeks: 1,
      programCategory: "WORKSHOP",
      status: "DRAFT",
      thumbnailUrl: "/images/events/ai-cyber-security-workshop-banner.jpg",
      eventSlug: "one-day-ai-cyber-security-workshop"
    },
    {
      title: "Winter Internship Program 2026",
      slug: "winter-internship-program-2026-prog",
      summary: "1-Month Practical & Industry-Oriented Technical Winter Internship.",
      description: "Hands-on software development on live client repositories with verified certificate and LOR.",
      baseFee: 99900,
      durationWeeks: 4,
      programCategory: "INTERNSHIP",
      status: "PUBLISHED",
      thumbnailUrl: "/images/events/winter-internship-banner.jpg",
      eventSlug: "winter-internship-program-2026"
    },
    {
      title: "Summer Internship Program 2027",
      slug: "summer-internship-program-2027-prog",
      summary: "2-Month Practical & Industry-Oriented Technical Summer Internship.",
      description: "Production full-stack sprints, DevOps CI/CD, and corporate project evaluations.",
      baseFee: 249900,
      durationWeeks: 8,
      programCategory: "INTERNSHIP",
      status: "PUBLISHED",
      thumbnailUrl: "/images/events/summer-internship-banner.jpg",
      eventSlug: "summer-internship-program"
    }
  ];

  for (const p of programs) {
    let course = await prisma.course.findFirst({
      where: {
        OR: [
          { slug: p.slug },
          { title: p.title }
        ]
      }
    });

    if (!course) {
      course = await prisma.course.create({
        data: {
          title: p.title,
          slug: p.slug,
          summary: p.summary,
          description: p.description,
          baseFee: p.baseFee,
          durationWeeks: p.durationWeeks,
          programCategory: p.programCategory,
          status: p.status,
          thumbnailUrl: p.thumbnailUrl,
        }
      });
      console.log(`Created course: ${course.title} (ID: ${course.id})`);
    } else {
      console.log(`Course exists: ${course.title} (ID: ${course.id})`);
    }

    // Link event to course
    await prisma.event.updateMany({
      where: { slug: p.eventSlug },
      data: { courseId: course.id }
    });
    console.log(`Linked event '${p.eventSlug}' to course ID: ${course.id}`);
  }
}

syncCourses().catch(console.error).finally(() => prisma.$disconnect());