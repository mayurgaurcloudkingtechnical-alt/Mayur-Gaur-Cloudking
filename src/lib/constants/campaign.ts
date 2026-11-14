/**
 * Centralized Festive Campaign Configuration: SOFTLAB GLOBAL CHHATH PUJA SPECIAL OFFER 2026
 * Valid through 30 November 2026, 23:59:59 IST (Asia/Kolkata).
 * Discount: Flat 35% Discount on all IT & Software Courses.
 */

export const CHHATH_PUJA_CAMPAIGN_2026 = {
  id: "chhath-puja-offer-2026",
  headline: "छठ पूजा SPECIAL OFFER",
  subheadline: "FLAT 35% DISCOUNT ON ALL IT & SOFTWARE COURSES",
  discountBadge: "FLAT 35% OFF",
  discountSubtext: "ON ALL IT & SOFTWARE COURSES",
  flyerPath: "/images/chhath-puja-2026-flyer.jpg?v=20261114",
  supportingCopy: [
    "आप सभी को छठ पूजा की हार्दिक शुभकामनाएं!",
    "SoftLab Global announces festive concession: Flat 35% Discount on all professional courses.",
    "Cloud Computing, AI/ML, Cyber Security, Networking, Full Stack Development, Data Science & more.",
    "Limited-period offer valid until 30 November 2026. Enrol now & save 35%!",
  ],
  termsNote:
    "Flat 35% festive academic fee concession applicable on all technical masterclasses, AI/ML programs, and university technical certifications until 30 November 2026.",
  startDateIso: "2026-11-01T00:00:00+05:30",
  // 30 November 2026 inclusive, Asia/Kolkata timezone
  expiryDateIso: "2026-11-30T23:59:59+05:30",
  expiryDateFormatted: "30 November 2026",
  primaryCtaText: "ENROL NOW & SAVE 35%",
  secondaryCtaText: "ENQUIRE NOW (FREE DEMO)",
  leadSourceWebsite: "WEBSITE",
  leadSourceCrm: "CRM",
  campaignKey: "Chhath Puja Offer 2026",
  discountPercent: 35,
  phones: {
    main: "+91 91965 96975",
    mainRaw: "+919196596975",
    counselor: "+91 91965 96979",
    counselorRaw: "+919196596979",
  },
};

/**
 * Backward compatibility alias: DIWALI_CAMPAIGN_2026 points to the active festive campaign.
 */
export const DIWALI_CAMPAIGN_2026 = {
  ...CHHATH_PUJA_CAMPAIGN_2026,
  headline: "छठ पूजा SPECIAL OFFER",
  discountBadge: "FLAT 35% OFF",
  discountSubtext: "ON ALL IT COURSES",
};

/**
 * SLG SKILLVERSE — Centralized Chhath Puja Festive Campaign 2026
 * Valid through 30 November 2026, 23:59:59 IST (Asia/Kolkata).
 * Discount: 35% OFF on all Courses!
 */
export const SKILLVERSE_CHHATH_PUJA_CAMPAIGN_2026 = {
  id: "skillverse-chhath-puja-2026",
  headline: "Happy Chhath Puja",
  subheadline: "Chhath Puja Special Offer — 35% OFF on all Courses!",
  discountBadge: "35% OFF",
  discountSubtext: "ON ALL COURSES!",
  flyerPath: "/images/skillverse-chhath-puja-2026-flyer.jpg?v=20261114",
  supportingCopy: [
    "Faith... Devotion... Blessings... Happy Chhath Puja",
    "May the divine blessings of Chhathi Maiya bring happiness, prosperity and success in your life.",
    "Special festive offer: 35% OFF on all courses! Limited Seats!",
    "Limited Time Offer valid until 30 November 2026.",
  ],
  learningPathways: [
    { title: "School Foundation", subtitle: "Classes 8th – 12th (CBSE / ICSE / UP)" },
    { title: "IIT-JEE & NEET Preparation", subtitle: "Concept Mastery & Problem Solving" },
    { title: "Python Programming", subtitle: "Core & Advanced Python" },
    { title: "Web Development", subtitle: "HTML, CSS & JavaScript" },
    { title: "AI Literacy & Prompt Engineering", subtitle: "Generative AI & LLM Tools" },
    { title: "Data Analytics & Power BI", subtitle: "Dashboards & Business Intelligence" },
    { title: "Robotics & STEM", subtitle: "Hardware, Sensors & Innovation" },
    { title: "MS Office & Advanced Excel", subtitle: "Productivity & Advanced Formulas" },
    { title: "Spoken English & Personality", subtitle: "Communication, Confidence & Soft Skills" },
  ],
  termsNote:
    "Flat 35% Chhath Puja festive scholarship concession applicable across all foundation, competitive, and skill courses until 30 November 2026.",
  startDateIso: "2026-11-01T00:00:00+05:30",
  expiryDateIso: "2026-11-30T23:59:59+05:30",
  expiryDateFormatted: "30 November 2026",
  primaryCtaText: "ENROL NOW — 35% OFF",
  secondaryCtaText: "ENQUIRE NOW (FREE DEMO)",
  leadSourceWebsite: "SKILLVERSE_WEBSITE",
  leadSourceCrm: "SKILLVERSE_CRM",
  campaignKey: "Skillverse Chhath Puja Offer 2026",
  discountPercent: 35,
  phones: {
    main: "+91 91965 96975",
    mainRaw: "+919196596975",
    counselor: "+91 91965 96979",
    counselorRaw: "+919196596979",
  },
};

export const SKILLVERSE_DIWALI_CAMPAIGN_2026 = SKILLVERSE_CHHATH_PUJA_CAMPAIGN_2026;

/**
 * Checks whether the Chhath Puja / Festive Offer campaign is currently active.
 * Automatically deactivates after 23:59:59 IST on 30 November 2026.
 */
export function isFestiveCampaignActive(customDate?: Date): boolean {
  const now = customDate ? customDate.getTime() : Date.now();
  const expiry = new Date(CHHATH_PUJA_CAMPAIGN_2026.expiryDateIso).getTime();
  const start = new Date(CHHATH_PUJA_CAMPAIGN_2026.startDateIso).getTime();

  return now >= start && now <= expiry;
}

export function isDiwaliCampaignActive(customDate?: Date): boolean {
  return isFestiveCampaignActive(customDate);
}
