import { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/lib/constants/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/about",
          "/courses",
          "/courses/*",
          "/career",
          "/trainers",
          "/contact",
        ],
        disallow: [
          "/admin/",
          "/student/",
          "/trainer/",
          "/counselor/",
          "/api/",
        ],
      },
    ],
    sitemap: `${SITE_CONFIG.domain}/sitemap.xml`,
  };
}
