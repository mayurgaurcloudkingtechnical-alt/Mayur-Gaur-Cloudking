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
 * Checks whether the Diwali Offer 2026 campaign is currently active.
 * Automatically deactivates at 23:59:59 IST on 10 November 2026.
 */
export function isDiwaliCampaignActive(customDate?: Date): boolean {
  const now = customDate ? customDate.getTime() : Date.now();
  const expiry = new Date(DIWALI_CAMPAIGN_2026.expiryDateIso).getTime();
  const start = new Date(DIWALI_CAMPAIGN_2026.startDateIso).getTime();

  return now >= start && now <= expiry;
}
