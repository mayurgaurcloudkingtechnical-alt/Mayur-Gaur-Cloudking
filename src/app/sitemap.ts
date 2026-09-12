import { MetadataRoute } from "next";
import { db } from "@/server/db/client";
import { ContentStatus } from "@prisma/client";
import { SITE_CONFIG } from "@/lib/constants/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_CONFIG.domain;

  // Static marketing routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/courses`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/career`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/trainers`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  // Dynamic published courses from PostgreSQL
  try {
    const courses = await db.course.findMany({
      where: {
        status: ContentStatus.PUBLISHED,
        deletedAt: null,
      },
      select: {
        slug: true,
        updatedAt: true,
      },
    });

    const courseRoutes: MetadataRoute.Sitemap = courses.map((course) => ({
      url: `${baseUrl}/courses/${course.slug}`,
      lastModified: course.updatedAt,
      changeFrequency: "weekly",
      priority: 0.85,
    }));

    return [...staticRoutes, ...courseRoutes];
  } catch (error) {
    console.error("Error fetching courses for sitemap:", error);
    return staticRoutes;
  }
}
