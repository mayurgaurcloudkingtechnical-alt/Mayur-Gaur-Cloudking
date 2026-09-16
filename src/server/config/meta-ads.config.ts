/**
 * Meta / Facebook Official Ads & Boost Campaigns Configuration
 *
 * Configured for SoftLab Global's active Facebook Page and Boost Ad Campaign.
 */

export const META_ADS_CONFIG = {
  PAGE_ID: process.env.META_PAGE_ID || "1322487780950878",
  PAGE_NAME: "SoftLab Global",
  PAGE_URL: "https://www.facebook.com/1322487780950878",

  // Primary Active Facebook Boost Ad
  ACTIVE_BOOST: {
    boostId: process.env.META_BOOST_ID || "1324192984113691",
    pageId: process.env.META_PAGE_ID || "1322487780950878",
    campaignName: "SoftLab Global - IT & Coding Courses Admissions Boost",
    adCreativeName: "FB Boost #1324192984113691",
    status: "ACTIVE" as const,
    adCenterManageUrl:
      "https://www.facebook.com/ad_center/manage/?boost_id=1324192984113691&entry_point=www_ad_center_overview_ad_cards&page_id=1322487780950878",
    targetAudience: "Students & Job Seekers in UP / All-India (Age 18-32)",
    objective: "MESSAGES_AND_LEADS",
    createdAt: "2026-09-12",
  },
};

/**
 * Instagram Official Profile & Graph API Configuration
 *
 * @softlabglobal9 — Official SoftLab Global Instagram Account
 *
 * SETUP GUIDE (Admin must complete):
 * 1. Convert @softlabglobal9 to a Professional/Business account (Instagram App → Settings & Privacy → Account type → Switch to professional)
 * 2. Link to a Facebook Page (required for Graph API access)
 * 3. Go to developers.facebook.com → Create App → Add Instagram Basic Display API
 * 4. Generate a long-lived Access Token (60-day expiry, renewable)
 * 5. Set INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_BUSINESS_ACCOUNT_ID in your .env file
 * 6. Once configured, the Admin Marketing Panel will show live followers, likes, views, reach, messages count
 *
 * Graph API Base: https://graph.facebook.com/v20.0/
 */
export const INSTAGRAM_CONFIG = {
  HANDLE: "@softlabglobal9",
  PROFILE_URL: "https://www.instagram.com/softlabglobal9/",
  BUSINESS_ACCOUNT_ID: process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || "",
  ACCESS_TOKEN: process.env.INSTAGRAM_ACCESS_TOKEN || "",

  // Profile Bio to display in admin panel setup guide
  RECOMMENDED_BIO: "🚀 Master Full Stack, AI/ML & Cyber Security\n💻 Industry-Ready Coding Labs & Placement Desk\n📍 Civil Lines, Prayagraj (Opp. Rai & Co.)\n👇 Admissions Open | Apply / Syllabus",
  RECOMMENDED_WEBSITE: "https://www.softlabglobal.com/courses",
  CATEGORY: "Education / Information Technology Company",

  // Best posting times (IST) for student/tech audience in Prayagraj/UP
  OPTIMAL_POSTING_TIMES: ["12:30 PM IST", "7:30 PM IST"],

  // Content pillars for daily publishing
  CONTENT_PILLARS: ["Full Stack Dev", "Data Science & AI", "Cyber Security", "Campus Life", "Career & Placements"],

  // Graph API endpoints (used when token is configured)
  GRAPH_API: {
    BASE: "https://graph.facebook.com/v20.0",
    PROFILE_FIELDS: "id,username,followers_count,follows_count,media_count,profile_picture_url,biography,website",
    MEDIA_FIELDS: "id,caption,media_type,timestamp,like_count,comments_count,views_count,reach,impressions,thumbnail_url,permalink",
    MESSAGING_FIELDS: "conversations",
  },
};

