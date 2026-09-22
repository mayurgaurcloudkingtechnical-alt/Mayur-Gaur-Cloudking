/**
 * Centralized Configuration for Dr. Preeti Global University Partner Programs
 * Phases 56 & 57: Level 1 Official Portal Access & Authentication Redirects
 */

export const DPGU_CONFIG = {
  universityName: "Dr. Preeti Global University",
  shortName: "DPGU",
  partnerName: "SoftLab Global",
  admissionSession: "2026",
  sessionFull: "2026-27",
  
  // Official Portal Endpoints (Configured centrally)
  portals: {
    // Consultant & Partner Desk
    consultantPortalUrl: "https://cons.dpguindia.com/",
    // Student Portal
    studentPortalUrl: "http://student.dpguindia.com/Default.aspx?ReturnUrl=%2f",
    // Official Website Reference
    mainWebsiteUrl: "https://dpguindia.com/",
  },

  // Integration Level (Level 1: Official Portal Access / Redirect)
  integrationLevel: "PORTAL_ACCESS", // LEVEL 1: Portal Access, LEVEL 2: API, LEVEL 3: SSO
  integrationLabel: "Official University Portal Access",

  // Relationship description
  disclaimer:
    "SoftLab Global advises, coordinates, and facilitates student admissions and academic counseling for Dr. Preeti Global University degree, diploma, professional, and research programs. All official certifications, degrees, and academic marks are conferred directly by Dr. Preeti Global University under its statutory governance.",
  
  // Fee Defaults
  defaultRegistrationFeePaise: 100000, // ₹1,000 (one-time)
  defaultExaminationFeePaise: 100000,  // ₹1,000 (per semester)
} as const;

export type UniversityConfig = typeof DPGU_CONFIG;
