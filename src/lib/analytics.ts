/**
 * Google Analytics 4 (GA4), Google Ads & Meta (Facebook/Instagram) Pixel Telemetry Engine
 * Property: softlabglobal (https://www.softlabglobal.com)
 * Stream ID: 16144183114
 * Measurement ID: G-7F6R0124G6
 * Google Ads ID: AW-18444757013
 * Meta Pixel ID: 28379921225020377
 * Google Tag Manager ID: GTM-NR7P36ST
 */

export const GA_MEASUREMENT_ID = "G-7F6R0124G6";
export const GOOGLE_ADS_ID = "AW-18444757013";
export const META_PIXEL_ID = "28379921225020377";
export const GTM_CONTAINER_ID = "GTM-NR7P36ST";

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}

/**
 * Dispatches a pageview event to Google Analytics 4 & Meta Pixel.
 */
export function trackPageView(url: string, title?: string) {
  if (typeof window === "undefined") return;

  // 1. Google Analytics 4
  if (window.gtag) {
    try {
      window.gtag("config", GA_MEASUREMENT_ID, {
        page_path: url,
        page_title: title || (typeof document !== "undefined" ? document.title : undefined),
      });
    } catch (err) {
      console.debug("[Analytics] Failed to track GA4 pageview:", err);
    }
  }

  // 2. Meta (Facebook) Pixel PageView
  if (typeof window.fbq === "function") {
    try {
      window.fbq("track", "PageView");
    } catch (err) {
      console.debug("[Meta Pixel] Failed to track PageView:", err);
    }
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
 * Dispatches a standard event to Meta (Facebook) Pixel.
 * Standard events: 'Lead', 'Contact', 'PageView', 'ViewContent', 'InitiateCheckout', etc.
 */
export function trackMetaEvent(eventName: string, params: Record<string, any> = {}) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;

  try {
    window.fbq("track", eventName, params);
  } catch (err) {
    console.debug(`[Meta Pixel] Failed to track ${eventName}:`, err);
  }
}

/**
 * Dispatches a custom event to Meta (Facebook) Pixel.
 */
export function trackMetaCustomEvent(eventName: string, params: Record<string, any> = {}) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;

  try {
    window.fbq("trackCustom", eventName, params);
  } catch (err) {
    console.debug(`[Meta Pixel] Failed to track custom ${eventName}:`, err);
  }
}

/**
 * Dispatches lead generation event to Google Analytics (`generate_lead`),
 * Google Ads (`conversion`), and Meta Pixel (`Lead`).
 */
export function trackLeadSubmission(params: {
  source: string;
  courseOrInterest?: string;
  value?: number;
  currency?: string;
  leadId?: string;
}) {
  // 1. GA4 generate_lead
  trackEvent("generate_lead", {
    event_category: "Engagement",
    event_label: params.source,
    value: params.value ?? 1,
    currency: params.currency || "INR",
    course_name: params.courseOrInterest || "General Inquiry",
    lead_source: params.source,
    lead_id: params.leadId,
  });

  // 2. Google Ads conversion
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

  // 3. Meta Pixel standard Lead event
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    try {
      window.fbq("track", "Lead", {
        content_name: params.courseOrInterest || "General Inquiry",
        content_category: "Education",
        value: params.value ?? 1,
        currency: params.currency || "INR",
        lead_source: params.source,
        lead_id: params.leadId,
      });
    } catch (err) {
      console.debug("[Meta Pixel] Failed to track Lead:", err);
    }
  }
}

/**
 * Tracks WhatsApp click interactions for admissions or counselor desks.
 */
export function trackWhatsAppClick(label: string = "WhatsApp Desk") {
  // GA4
  trackEvent("contact", {
    method: "WhatsApp",
    event_category: "Contact Desk",
    event_label: label,
  });

  // Meta Pixel
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    try {
      window.fbq("track", "Contact");
      window.fbq("trackCustom", "WhatsAppClick", { desk: label });
    } catch {
      // ignore
    }
  }
}

/**
 * Tracks phone call click interactions.
 */
export function trackPhoneClick(phone: string = "+91 9196596975") {
  // GA4
  trackEvent("contact", {
    method: "Phone",
    event_category: "Admissions Helpline",
    event_label: phone,
  });

  // Meta Pixel
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    try {
      window.fbq("track", "Contact");
      window.fbq("trackCustom", "PhoneClick", { phone });
    } catch {
      // ignore
    }
  }
}
