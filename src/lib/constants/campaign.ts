/**
 * Centralized Campaign Configuration: SOFTLAB GLOBAL DIWALI OFFER 2026
 * Valid through 10 November 2026, 23:59:59 IST (Asia/Kolkata).
 */

export const DIWALI_CAMPAIGN_2026 = {
  id: "diwali-dhamaka-2026",
  headline: "DIWALI DHAMAKA 2026",
  discountBadge: "UP TO 45% OFF",
  discountSubtext: "ON EVERY COURSE",
  supportingCopy: [
    "Celebrate Diwali with a brighter future and career-ready skills.",
    "Special festive offers on SoftLab Global courses.",
    "Limited-period offer valid until 10 November 2026.",
    "Enquire now to learn about available courses and offer eligibility.",
  ],
  termsNote:
    "Up to 45% festive concession applicable on select technical masterclasses and university certifications. Concessions vary by course domain and batch availability.",
  startDateIso: "2026-10-15T00:00:00+05:30",
  // 10 November 2026 inclusive, Asia/Kolkata timezone
  expiryDateIso: "2026-11-10T23:59:59+05:30",
  expiryDateFormatted: "10 November 2026",
  primaryCtaText: "APPLY NOW",
  secondaryCtaText: "ENQUIRE NOW",
  leadSourceWebsite: "WEBSITE",
  leadSourceCrm: "CRM",
  campaignKey: "Diwali Offer 2026",
};

/**
 * SLG SKILLVERSE — Centralized Diwali Festive Campaign 2026
 * Valid through 10 November 2026, 23:59:59 IST (Asia/Kolkata).
 */
export const SKILLVERSE_DIWALI_CAMPAIGN_2026 = {
  id: "skillverse-diwali-2026",
  headline: "LIGHT UP YOUR CAREER THIS DIWALI",
  subheadline: "DIWALI FESTIVE OFFER — UP TO 45% OFF ON COURSES",
  discountBadge: "UP TO 45% OFF",
  discountSubtext: "ON ACADEMIC & SKILL COURSES",
  flyerPath: "/images/skillverse-diwali-offer-2026.jpg?v=20261023",
  supportingCopy: [
    "Learn In-Demand Skills with Live & Practical Masterclasses.",
    "Expert Faculty & Academic Mentorship for Classes 8–12, JEE & NEET.",
    "Future-Ready Tech Tracks: Python Coding, AI Literacy, Robotics & Cyber.",
    "Special festive scholarship concession valid until 10 November 2026.",
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
    "Up to 45% festive academic fee concession applicable on full-year foundation packages and skill modules. Concessions applied directly on batch registration before 10 November 2026.",
  startDateIso: "2026-10-15T00:00:00+05:30",
  expiryDateIso: "2026-11-10T23:59:59+05:30",
  expiryDateFormatted: "10 November 2026",
  primaryCtaText: "APPLY NOW",
  secondaryCtaText: "ENQUIRE NOW",
  leadSourceWebsite: "SKILLVERSE_WEBSITE",
  leadSourceCrm: "SKILLVERSE_CRM",
  campaignKey: "Skillverse Diwali Offer 2026",
  phones: {
    main: "+91 91965 96975",
    mainRaw: "+919196596975",
    counselor: "+91 91965 96979",
    counselorRaw: "+919196596979",
  },
};

/**
 * Checks whether the Diwali Offer 2026 campaign is currently active.
 * Automatically deactivates at 23:59:59 IST on 10 November 2026.
 */
export function isDiwaliCampaignActive(customDate?: Date): boolean {
  const now = customDate ? customDate.getTime() : Date.now();
  const expiry = new Date(DIWALI_CAMPAIGN_2026.expiryDateIso).getTime();
  const start = new Date(DIWALI_CAMPAIGN_2026.startDateIso).getTime();

  return now >= start && now <= expiry;
}
