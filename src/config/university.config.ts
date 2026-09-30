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

/**
 * Centralized Configuration for Delaware Digital University (USA) Partner Programs
 * Global Skill Certification, Credential Verification & SoftLab Administration Desk
 */
export const DDU_CONFIG = {
  universityName: "Delaware Digital University",
  shortName: "DDU",
  country: "United States Of America",
  state: "Delaware",
  registrationNumber: "7349298", // Registered with the Delaware Department of State
  institutionType: "Non-profit Educational Institution in the State of Delaware, USA",
  address: "The Green, City of Dover, Delaware 19901, United States Of America",
  phone: "+1 302 2138121",
  certificationBadge: "USA Globally Accredited Skill Certification",

  // Official Endpoints
  portals: {
    // Official University Website
    mainWebsiteUrl: "https://delawaredigitaluniversity.us/",
    // SoftLab Administration & Management Desk
    adminDashboardUrl: "https://skill.delawaredigitaluniversity.us/dashboard",
    // Student & Employer Global Credential Verification
    verificationUrl: "https://delawaredigitaluniversity.us/verify/",
    // TVET (Skill Development) Programs
    tvetSkillUrl: "https://delawaredigitaluniversity.us/tvetddu/",
  },

  // Relationship description
  disclaimer:
    "Delaware Digital University is registered with the Delaware Department of State with registration number 7349298. DDU is a non-profit educational institution in the State of Delaware, USA. In partnership with SoftLab Global, graduates of accredited technical cohorts qualify for globally verifiable skill credentials and digital certificates.",
} as const;

export type DDUConfig = typeof DDU_CONFIG;
