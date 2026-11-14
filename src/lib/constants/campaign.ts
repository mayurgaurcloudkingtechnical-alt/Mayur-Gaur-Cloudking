/**
 * Centralized Festive Campaign Configuration: SOFTLAB GLOBAL CHHATH PUJA SPECIAL OFFER 2026
 * Valid through 20 November 2026, 23:59:59 IST (Asia/Kolkata).
 * Discount: Flat 35% Discount on all IT & Software Courses.
 */

export const CHHATH_PUJA_CAMPAIGN_2026 = {
  id: "chhath-puja-offer-2026",
  headline: "छठ पूजा SPECIAL OFFER",
  subheadline: "FLAT 35% DISCOUNT ON ALL IT & SOFTWARE COURSES",
  discountBadge: "FLAT 35% OFF",
  discountSubtext: "ON ALL IT & SOFTWARE COURSES",
  flyerPath: "/images/chhath-puja-2026-flyer.jpg?v=20261112",
  supportingCopy: [
    "आप सभी को छठ पूजा की हार्दिक शुभकामनाएं!",
    "SoftLab Global announces festive concession: Flat 35% Discount on all professional courses.",
    "Cloud Computing, AI/ML, Cyber Security, Networking, Full Stack Development, Data Science & more.",
    "Limited-period offer valid until 20 November 2026. Enrol now & save 35%!",
  ],
  termsNote:
    "Flat 35% festive academic fee concession applicable on all technical masterclasses, AI/ML programs, and university technical certifications until 20 November 2026.",
  startDateIso: "2026-11-01T00:00:00+05:30",
  // 20 November 2026 inclusive, Asia/Kolkata timezone
  expiryDateIso: "2026-11-20T23:59:59+05:30",
  expiryDateFormatted: "20 November 2026",
  primaryCtaText: "ENROL NOW & SAVE 35%",
  secondaryCtaText: "ENQUIRE NOW (FREE DEMO)",
  leadSourceWebsite: "WEBSITE",
  leadSourceCrm: "CRM",
  campaignKey: "Chhath Puja Offer 2026",
  discountPercent: 35,
  phones: {
    main: "+91 91965 96975",
    mainRaw: "+919196596975",
    counselor: "+91 91965 96978",
    counselorRaw: "+919196596978",
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
 * SLG SKILLVERSE — Centralized Diwali Festive Campaign 2026
 * Valid through 20 November 2026, 23:59:59 IST (Asia/Kolkata).
 */
export const SKILLVERSE_DIWALI_CAMPAIGN_2026 = {
  id: "skillverse-diwali-offer-2026",
  headline: "LIGHT UP YOUR CAREER THIS DIWALI",
  subheadline: "DIWALI FESTIVE OFFER — UP TO 45% OFF ON COURSES",
  discountBadge: "UP TO 45% OFF",
  discountSubtext: "ON COURSES",
  flyerPath: "/images/skillverse-diwali-2026-flyer.jpg?v=20261114",
  supportingCopy: [
    "Learn In-Demand Skills with Live & Practical Masterclasses.",
    "Expert Faculty & Academic Mentorship for Classes 8–12, JEE & NEET.",
    "Future-Ready Tech Tracks: Python Coding, AI Literacy, Robotics & Cyber.",
    "Special festive scholarship concession valid until 20 November 2026.",
  ],
  learningPathways: [
    { title: "School Foundation", subtitle: "Classes 8th – 12th (CBSE / ICSE / UP)" },
    { title: "IIT-JEE Foundation", subtitle: "Concept Mastery & Problem Solving" },
    { title: "NEET Foundation", subtitle: "Medical Entrance Conceptual Excellence" },
    { title: "Coding & AI", subtitle: "Python, AI Literacy & Robotics" },
    { title: "Competitive Exams", subtitle: "Olympiads, CUET & NTSE Extension" },
    { title: "Personality & Career", subtitle: "Communication, Confidence & Soft Skills" },
  ],
  termsNote:
    "Up to 45% festive academic fee concession applicable on foundation packages and skill modules until 20 November 2026.",
  startDateIso: "2026-11-01T00:00:00+05:30",
  expiryDateIso: "2026-11-20T23:59:59+05:30",
  expiryDateFormatted: "20 November 2026",
  primaryCtaText: "ENROL NOW — 45% OFF",
  secondaryCtaText: "ENQUIRE NOW",
  leadSourceWebsite: "SKILLVERSE_WEBSITE",
  leadSourceCrm: "SKILLVERSE_CRM",
  campaignKey: "Skillverse Diwali Offer 2026",
  discountPercent: 45,
  phones: {
    main: "+91 91965 96975",
    mainRaw: "+919196596975",
    counselor: "+91 91965 96979",
    counselorRaw: "+919196596979",
  },
};

export const SKILLVERSE_CHHATH_PUJA_CAMPAIGN_2026 = SKILLVERSE_DIWALI_CAMPAIGN_2026;

/**
 * Checks whether the Chhath Puja / Festive Offer campaign is currently active.
 * Automatically deactivates after 23:59:59 IST on 20 November 2026.
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
