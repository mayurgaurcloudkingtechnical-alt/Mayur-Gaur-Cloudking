/**
 * Google Analytics 4 (GA4) & Advertising Telemetry Engine
 * Property: softlabglobal (https://www.softlabglobal.com)
 * Stream ID: 16144183114
 * Measurement ID: G-7F6R0124G6
 * Google Ads ID: AW-18444757013
 */

export const GA_MEASUREMENT_ID = "G-7F6R0124G6";
export const GOOGLE_ADS_ID = "AW-18444757013";

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Dispatches a pageview event to Google Analytics 4.
 */
export function trackPageView(url: string, title?: string) {
  if (typeof window === "undefined" || !window.gtag) return;

  try {
    window.gtag("config", GA_MEASUREMENT_ID, {
      page_path: url,
      page_title: title || (typeof document !== "undefined" ? document.title : undefined),
    });
  } catch (err) {
    console.debug("[Analytics] Failed to track pageview:", err);
  }
}

/**
 * Dispatches a standard or custom event to Google Analytics.
 */
export function trackEvent(eventName: string, params: Record<string, any> = {}) {
  if (typeof window === "undefined" || !window.gtag) return;

  try {
    window.gtag("event", eventName, {
      send_to: GA_MEASUREMENT_ID,
      ...params,
    });
  } catch (err) {
    console.debug("[Analytics] Failed to track event:", err);
  }
}

/**
 * Dispatches standard GA4 lead generation event `generate_lead`.
 */
export function trackLeadSubmission(params: {
  source: string;
  courseOrInterest?: string;
  value?: number;
  currency?: string;
  leadId?: string;
}) {
  trackEvent("generate_lead", {
    event_category: "Engagement",
    event_label: params.source,
    value: params.value ?? 1,
    currency: params.currency || "INR",
    course_name: params.courseOrInterest || "General Inquiry",
    lead_source: params.source,
    lead_id: params.leadId,
  });

  // Also notify Google Ads of conversion if configured
  if (typeof window !== "undefined" && window.gtag) {
    try {
      window.gtag("event", "conversion", {
        send_to: GOOGLE_ADS_ID,
        value: params.value ?? 1,
        currency: params.currency || "INR",
      });
    } catch {
      // ignore
    }
  }
}

/**
 * Tracks WhatsApp click interactions for admissions or counselor desks.
 */
export function trackWhatsAppClick(label: string = "WhatsApp Desk") {
  trackEvent("contact", {
    method: "WhatsApp",
    event_category: "Contact Desk",
    event_label: label,
  });
}

/**
 * Tracks phone call click interactions.
 */
export function trackPhoneClick(phone: string = "+91 9196596975") {
  trackEvent("contact", {
    method: "Phone",
    event_category: "Admissions Helpline",
    event_label: phone,
  });
}
