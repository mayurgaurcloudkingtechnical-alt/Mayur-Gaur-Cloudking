import { db } from "@/server/db/client";
import { AuthenticatedUser } from "@/server/auth/rbac";
import { TRPCError } from "@trpc/server";
import { ServiceEnquiryStatus, UserRoleCode } from "@prisma/client";

export const DEFAULT_SERVICE_CATEGORIES = [
  {
    code: "WEB_DEV",
    name: "Website Development",
    description: "Modern, high-performance, mobile-responsive corporate websites, e-commerce portals, and bespoke web platforms.",
    icon: "Globe",
    sortOrder: 1,
    packages: [
      {
        name: "Starter Website",
        code: "WEB_STARTER",
        description: "5-page responsive website ideal for startups, local businesses, and personal portfolios.",
        price: 14999,
        priceDisplay: "₹14,999",
        billingType: "ONE_TIME",
        deliveryPeriod: "5 - 7 Days",
        supportPeriod: "1 Month Free AMC",
        features: ["Up to 5 Pages", "Mobile & Tablet Responsive", "Contact & WhatsApp Form", "Domain & Hosting Setup", "Basic SEO Optimization"],
        isPopular: false,
      },
      {
        name: "Business Website",
        code: "WEB_BUSINESS",
        description: "Dynamic corporate website with CMS, high-converting service landing pages, and lead capture.",
        price: 24999,
        priceDisplay: "₹24,999",
        billingType: "ONE_TIME",
        deliveryPeriod: "7 - 12 Days",
        supportPeriod: "3 Months Free AMC",
        features: ["Up to 10 Pages", "Interactive CMS / Admin Panel", "Lead Capture Integration", "Google Analytics & Search Console", "Speed Optimization (90+ PageSpeed)"],
        isPopular: true,
      },
      {
        name: "Professional Corporate Website",
        code: "WEB_CORPORATE",
        description: "Enterprise portal with tailored UI/UX, multi-location architecture, and custom integrations.",
        price: 44999,
        priceDisplay: "₹44,999",
        billingType: "ONE_TIME",
        deliveryPeriod: "14 - 21 Days",
        supportPeriod: "6 Months Free AMC",
        features: ["Unlimited Dynamic Pages", "Custom Figma to Code Architecture", "Blog & Resource Engine", "Multi-Language & Location Support", "Advanced Cybersecurity Hardening"],
        isPopular: false,
      },
      {
        name: "E-Commerce Website",
        code: "WEB_ECOMMERCE",
        description: "Full-scale online store with Razorpay/payment gateways, inventory control, and order tracking.",
        price: 54999,
        priceDisplay: "₹54,999",
        billingType: "ONE_TIME",
        deliveryPeriod: "15 - 25 Days",
        supportPeriod: "6 Months Free AMC",
        features: ["Payment Gateway (Razorpay/UPI/Cards)", "Automated Invoice & Order Notifications", "Product Variations & Inventory", "Customer Login & Order History", "Abandoned Cart Recovery"],
        isPopular: false,
      },
      {
        name: "Custom Web Platform",
        code: "WEB_CUSTOM",
        description: "Bespoke SaaS frontends, internal portals, client dashboards, and custom web applications.",
        price: 89999,
        priceDisplay: "Starting ₹89,999",
        billingType: "ONE_TIME",
        deliveryPeriod: "30 - 45 Days",
        supportPeriod: "12 Months SLA Support",
        features: ["Next.js / React Modern Stack", "REST & GraphQL API Integrations", "Role-Based Access Control", "Microservice / Serverless Ready", "Custom Business Logic Workflows"],
        isPopular: false,
      },
      {
        name: "Website AMC (Annual Maintenance)",
        code: "WEB_AMC",
        description: "End-to-end security updates, weekly backups, uptime monitoring, and priority technical support.",
        price: 15000,
        priceDisplay: "₹15,000 / year",
        billingType: "ANNUAL",
        deliveryPeriod: "Immediate Onboarding",
        supportPeriod: "Year-Round 24/7",
        features: ["24/7 Uptime & Health Monitoring", "Weekly Offsite Cloud Backups", "SSL Certificate & Domain Renewal Assistance", "Bug Fixes & Content Updates", "Malware & Firewall Protection"],
        isPopular: false,
      },
    ],
  },
  {
    code: "SOFTWARE_DEV",
    name: "Software Development",
    description: "Enterprise-grade bespoke software systems, automation engines, ERPs, CRMs, and scalable cloud SaaS.",
    icon: "Code",
    sortOrder: 2,
    packages: [
      {
        name: "Business Software",
        code: "SOFT_BUSINESS",
        description: "Custom operational software automating billing, inventory, bookings, or client records.",
        price: 49999,
        priceDisplay: "Starting ₹49,999",
        billingType: "ONE_TIME",
        deliveryPeriod: "20 - 30 Days",
        supportPeriod: "6 Months Support",
        features: ["Automated Invoicing & GST Billing", "Real-Time Stock & Inventory Tracking", "Multi-Branch Support", "Export to Excel/PDF", "Role-Based Staff Access"],
        isPopular: false,
      },
      {
        name: "Custom Enterprise Software",
        code: "SOFT_CUSTOM",
        description: "Tailored software engineered from scratch to match unique institutional or industrial processes.",
        price: 99999,
        priceDisplay: "Starting ₹99,999",
        billingType: "ONE_TIME",
        deliveryPeriod: "30 - 60 Days",
        supportPeriod: "12 Months Dedicated Support",
        features: ["Modular Distributed Architecture", "Automated Business Logic Workflows", "Integration with Existing Legacy Systems", "Enterprise Database Encryption", "Complete Source Code Handover"],
        isPopular: true,
      },
      {
        name: "Enterprise ERP System",
        code: "SOFT_ERP",
        description: "Comprehensive Enterprise Resource Planning system integrating finance, HR, inventory, and ops.",
        price: 149999,
        priceDisplay: "Starting ₹1,49,999",
        billingType: "ONE_TIME",
        deliveryPeriod: "45 - 90 Days",
        supportPeriod: "1 Year Dedicated SLA",
        features: ["Finance & Ledger Management", "Procurement & Supply Chain Engine", "Staff & Payroll Modules", "Comprehensive Executive Dashboards", "Cloud/On-Premises Deployment"],
        isPopular: false,
      },
      {
        name: "Custom CRM & Lead Engine",
        code: "SOFT_CRM",
        description: "Sales CRM with multi-channel lead ingestion, automated call queues, and conversion tracking.",
        price: 69999,
        priceDisplay: "Starting ₹69,999",
        billingType: "ONE_TIME",
        deliveryPeriod: "25 - 40 Days",
        supportPeriod: "6 Months Support",
        features: ["Lead Funnel & Pipeline Tracking", "WhatsApp & Telephony Integration", "Counselor Performance Analytics", "Automated Follow-up Alerts", "CSV & Direct Webhook Imports"],
        isPopular: false,
      },
      {
        name: "HRMS & Payroll Portal",
        code: "SOFT_HRMS",
        description: "Human Resource Management system with biometric attendance, leave management, and automated payroll.",
        price: 79999,
        priceDisplay: "Starting ₹79,999",
        billingType: "ONE_TIME",
        deliveryPeriod: "30 - 45 Days",
        supportPeriod: "6 Months Support",
        features: ["Biometric & Geo-Fenced Attendance", "Leave Approval Hierarchy", "Automated Salary Slips & Deductions", "Employee Document Vault", "Compliance & PF/ESI Reports"],
        isPopular: false,
      },
      {
        name: "LMS & Educational Portal",
        code: "SOFT_LMS",
        description: "Scalable Learning Management System with video streaming, quizzes, certifications, and student apps.",
        price: 89999,
        priceDisplay: "Starting ₹89,999",
        billingType: "ONE_TIME",
        deliveryPeriod: "30 - 50 Days",
        supportPeriod: "12 Months Support",
        features: ["Video DRM & Streaming Protection", "Student & Faculty Portals", "Online Fee Collection & Receipts", "Exams, Quizzes & Grading Engine", "Cryptographic Digital Certificates"],
        isPopular: false,
      },
      {
        name: "SaaS Platform & Multi-Tenant Cloud",
        code: "SOFT_SAAS",
        description: "Multi-tenant software-as-a-service platforms with subscription billing and isolated customer databases.",
        price: 199999,
        priceDisplay: "Starting ₹1,99,999",
        billingType: "CUSTOM",
        deliveryPeriod: "60 - 90 Days",
        supportPeriod: "1 Year SLA",
        features: ["Multi-Tenant Architecture", "Stripe/Razorpay Recurring Subscriptions", "Tenant Isolation & Custom Subdomains", "Usage Analytics & Metering", "Kubernetes Auto-Scaling Setup"],
        isPopular: false,
      },
      {
        name: "API Integration & Middleware",
        code: "SOFT_API",
        description: "Secure REST/GraphQL API bridges, webhook dispatchers, payment connectors, and third-party integrations.",
        price: 29999,
        priceDisplay: "Starting ₹29,999",
        billingType: "ONE_TIME",
        deliveryPeriod: "7 - 14 Days",
        supportPeriod: "3 Months Support",
        features: ["Payment Gateway Connectors", "WhatsApp Business API Setup", "Accounting/Tally API Integration", "Automated Cron Webhooks", "API Documentation (Swagger/OpenAPI)"],
        isPopular: false,
      },
    ],
  },
  {
    code: "APP_DEV",
    name: "Application Development",
    description: "Native and cross-platform Android and iOS mobile applications engineered for consumer and enterprise use.",
    icon: "Smartphone",
    sortOrder: 3,
    packages: [
      {
        name: "Android Application",
        code: "APP_ANDROID",
        description: "High-performance native Android application published on Google Play Store.",
        price: 49999,
        priceDisplay: "Starting ₹49,999",
        billingType: "ONE_TIME",
        deliveryPeriod: "20 - 30 Days",
        supportPeriod: "3 Months Play Store AMC",
        features: ["Modern Kotlin / Jetpack Compose", "Push Notifications (Firebase)", "Offline Caching & SQLite", "Google Play Store Publishing", "Lightweight Battery-Efficient Architecture"],
        isPopular: false,
      },
      {
        name: "iOS Application",
        code: "APP_IOS",
        description: "Swift native mobile app built strictly to Apple Human Interface Guidelines and App Store standards.",
        price: 59999,
        priceDisplay: "Starting ₹59,999",
        billingType: "ONE_TIME",
        deliveryPeriod: "25 - 35 Days",
        supportPeriod: "3 Months App Store AMC",
        features: ["Native Swift & SwiftUI", "Apple Pay / In-App Purchases Support", "iCloud Sync & Biometric FaceID/TouchID", "App Store Compliance & Approval", "Retina Fluid Responsive UI"],
        isPopular: false,
      },
      {
        name: "Cross-Platform Flutter App (Android + iOS)",
        code: "APP_FLUTTER",
        description: "Unified Flutter codebase delivering 60fps native performance on both Android and iOS simultaneously.",
        price: 69999,
        priceDisplay: "Starting ₹69,999",
        billingType: "ONE_TIME",
        deliveryPeriod: "25 - 40 Days",
        supportPeriod: "6 Months Dual-Store Support",
        features: ["Single Dart Codebase for Android & iOS", "Custom Material 3 & Cupertino Components", "Fast 60fps Native Rendering", "Dual Store Deployment Support", "Offline First Data Sync"],
        isPopular: true,
      },
      {
        name: "React Native Mobile Suite",
        code: "APP_REACT_NATIVE",
        description: "React Native application seamlessly connected to existing web API backends and admin dashboards.",
        price: 74999,
        priceDisplay: "Starting ₹74,999",
        billingType: "ONE_TIME",
        deliveryPeriod: "25 - 40 Days",
        supportPeriod: "6 Months Support",
        features: ["Seamless Code Sharing with Web React Apps", "Expo EAS Cloud Build Workflows", "Native Device Camera & GPS Access", "Real-Time WebSocket Updates", "App Store & Play Store Submissions"],
        isPopular: false,
      },
      {
        name: "Enterprise Mobile Solution",
        code: "APP_ENTERPRISE",
        description: "Heavy-duty enterprise mobile app with offline synchronization, barcode/QR scanning, and MDM compatibility.",
        price: 119999,
        priceDisplay: "Starting ₹1,19,999",
        billingType: "ONE_TIME",
        deliveryPeriod: "45 - 60 Days",
        supportPeriod: "1 Year Enterprise Support",
        features: ["End-to-End Local DB Encryption", "Offline Mode with Conflict Resolution", "Hardware & Barcode Integration", "Enterprise MDM Policy Compliance", "Real-Time Telemetry & Crash Analytics"],
        isPopular: false,
      },
    ],
  },
  {
    code: "DIGITAL_MARKETING",
    name: "Digital Marketing",
    description: "High-ROI digital growth strategies, performance marketing, search rankings, and multi-channel lead funnels.",
    icon: "TrendingUp",
    sortOrder: 4,
    packages: [
      {
        name: "Search Engine Optimization (SEO)",
        code: "MKT_SEO",
        description: "Technical, on-page, and high-authority backlink SEO driving sustainable organic Google Page 1 rankings.",
        price: 14999,
        priceDisplay: "₹14,999 / month",
        billingType: "MONTHLY",
        deliveryPeriod: "Continuous Monthly",
        supportPeriod: "Bi-Weekly Ranking Reports",
        features: ["Full Technical & Core Web Vitals Audit", "High-Intent Keyword Research", "On-Page Metadata & Schema Markup", "High-Authority Contextual Backlinks", "Monthly Transparent Progress Reports"],
        isPopular: false,
      },
      {
        name: "Social Media Marketing (SMM)",
        code: "MKT_SMM",
        description: "Brand elevation, daily creative posting, community engagement, and growth across Instagram, LinkedIn, and Facebook.",
        price: 19999,
        priceDisplay: "₹19,999 / month",
        billingType: "MONTHLY",
        deliveryPeriod: "Ongoing Monthly",
        supportPeriod: "Dedicated Social Media Manager",
        features: ["15 - 20 Custom Branded Creatives/Reels", "Caption Writing & Trend Hashtags", "Community Engagement & DM Handling", "Profile Optimization & Bio Styling", "Monthly Reach & Engagement Analytics"],
        isPopular: false,
      },
      {
        name: "Google & Search Ads (PPC)",
        code: "MKT_GOOGLE_ADS",
        description: "Targeted Google Search, Call, and Display campaigns designed to capture high-intent inbound customers immediately.",
        price: 24999,
        priceDisplay: "₹24,999 / month",
        billingType: "MONTHLY",
        deliveryPeriod: "Setup in 3 Days",
        supportPeriod: "Daily Bid Optimization",
        features: ["Ad Account Setup & Conversion Tracking", "Negative Keyword Filtering", "A/B Copywriting Testing", "Landing Page CRO Guidance", "ROAS & Cost-Per-Lead Tracking"],
        isPopular: true,
      },
      {
        name: "Meta Ads (Facebook & Instagram Lead Gen)",
        code: "MKT_META_ADS",
        description: "Hyper-targeted visual lead campaigns capturing verified customer phone numbers and enquiries daily.",
        price: 24999,
        priceDisplay: "₹24,999 / month",
        billingType: "MONTHLY",
        deliveryPeriod: "Setup in 3 Days",
        supportPeriod: "Daily Ad Tuning",
        features: ["Instant Instant Forms & WhatsApp Ads", "Custom Audience & Lookalike Modeling", "High-Converting Video & Carousel Creatives", "Automated CRM Lead Webhook Dispatch", "Real-Time Ad Spend Auditing"],
        isPopular: true,
      },
      {
        name: "LinkedIn B2B Lead Marketing",
        code: "MKT_LINKEDIN",
        description: "Executive B2B outreach and sponsored content reaching corporate decision makers, CXOs, and business owners.",
        price: 34999,
        priceDisplay: "₹34,999 / month",
        billingType: "MONTHLY",
        deliveryPeriod: "Monthly Campaign",
        supportPeriod: "Weekly Account Reviews",
        features: ["Job Title & Industry Targeting", "Lead Gen Forms & Sponsored InMail", "Thought Leadership Content Strategy", "C-Suite Audience Reach", "Detailed B2B Lead Scoring"],
        isPopular: false,
      },
      {
        name: "WhatsApp Marketing & Chatbot Automation",
        code: "MKT_WHATSAPP",
        description: "Official WhatsApp Business API setup, broadcast sequences, automated greeting, and customer service bots.",
        price: 19999,
        priceDisplay: "Starting ₹19,999",
        billingType: "ONE_TIME",
        deliveryPeriod: "5 - 7 Days",
        supportPeriod: "3 Months Support",
        features: ["Official Meta Green Tick Assistance", "Broadcast Catalog Campaigns", "Interactive Flow & Menu Chatbot", "Multi-Agent Support Dashboard", "Webhook Sync to Google Sheets / CRM"],
        isPopular: false,
      },
    ],
  },
  {
    code: "GRAPHICS_DESIGN",
    name: "Graphics & Creative Design",
    description: "High-impact visual identity, branding guidelines, social creatives, marketing collateral, and video production.",
    icon: "Palette",
    sortOrder: 5,
    packages: [
      {
        name: "Logo & Visual Identity Kit",
        code: "DES_LOGO",
        description: "Bespoke vector logo design with brand color palette, typography guidelines, and social avatar assets.",
        price: 9999,
        priceDisplay: "₹9,999",
        billingType: "ONE_TIME",
        deliveryPeriod: "3 - 5 Days",
        supportPeriod: "Unlimited Concept Iterations",
        features: ["3 Unique Creative Concepts", "High-Resolution Vector Source Files (AI/EPS/SVG)", "Brand Guidelines PDF", "Favicon & App Icon Variants", "Full Commercial Copyright Ownership"],
        isPopular: false,
      },
      {
        name: "Corporate Brand Collateral Kit",
        code: "DES_COLLATERAL",
        description: "Complete print-ready business stationery including business cards, letterheads, ID cards, and envelopes.",
        price: 14999,
        priceDisplay: "₹14,999",
        billingType: "ONE_TIME",
        deliveryPeriod: "4 - 7 Days",
        supportPeriod: "Print Support Guaranteed",
        features: ["Business Card (Front/Back)", "Official Letterhead & Envelope", "Staff ID Card & Lanyard Design", "Company Invoice / Receipt Template", "Print-Ready CMYK PDF Files"],
        isPopular: false,
      },
      {
        name: "Corporate Brochure & Catalogue Design",
        code: "DES_BROCHURE",
        description: "Luxury multi-page corporate brochure, product catalogue, or institutional prospectus.",
        price: 19999,
        priceDisplay: "₹19,999",
        billingType: "ONE_TIME",
        deliveryPeriod: "7 - 10 Days",
        supportPeriod: "Print & Digital Formats",
        features: ["Up to 12 Custom Layout Pages", "Professional Infographics & Data Visuals", "High-Res Photography Treatment", "Interactive Digital PDF with Clickable Links", "Print-Ready Bleed & Crop Margins"],
        isPopular: true,
      },
      {
        name: "Monthly Social Media Design Retainer",
        code: "DES_RETAINER",
        description: "Dedicated monthly package of 30 custom branded social creatives, banners, and marketing flyers.",
        price: 24999,
        priceDisplay: "₹24,999 / month",
        billingType: "MONTHLY",
        deliveryPeriod: "Delivered in Batches",
        supportPeriod: "Dedicated Graphic Designer",
        features: ["30 High-Resolution Social Posts/Banners", "Custom Carousel Slides & Stories", "Ad Campaign Banners for Meta & Google", "Editable Canva / PSD Templates", "Express 24-Hour Turnaround Available"],
        isPopular: true,
      },
      {
        name: "Video & Reels Editing Suite",
        code: "DES_VIDEO",
        description: "Professional short-form video editing for Instagram Reels, YouTube Shorts, and corporate promos.",
        price: 19999,
        priceDisplay: "Starting ₹19,999",
        billingType: "MONTHLY",
        deliveryPeriod: "Ongoing Batches",
        supportPeriod: "Audio & Color Correction Included",
        features: ["15 Polished Short-Form Videos", "Dynamic Subtitles & Motion Graphics", "Sound Design & Copyright-Free Music", "Color Grading & 4K Export", "Optimized for 9:16 Mobile Engagement"],
        isPopular: false,
      },
    ],
  },
  {
    code: "CORPORATE_COMBO",
    name: "Corporate Retainer Packages",
    description: "All-in-one monthly growth packages combining Website, Software Support, Digital Marketing, and Graphics.",
    icon: "Briefcase",
    sortOrder: 6,
    packages: [
      {
        name: "Corporate Starter",
        code: "COMBO_STARTER",
        description: "Essential tech & marketing package for growing businesses establishing digital leadership.",
        price: 35000,
        priceDisplay: "₹35,000 / month",
        billingType: "MONTHLY",
        deliveryPeriod: "Monthly Retainer",
        supportPeriod: "24/7 Team Access",
        features: [
          "Website Hosting & AMC Included",
          "15 Custom Social Media Creatives",
          "SEO Optimization for 10 Target Keywords",
          "Google Business Profile Management",
          "Monthly Performance Review Call",
        ],
        isPopular: false,
      },
      {
        name: "Corporate Growth",
        code: "COMBO_GROWTH",
        description: "Comprehensive acceleration package with active Meta/Google Ads management and creative production.",
        price: 60000,
        priceDisplay: "₹60,000 / month",
        billingType: "MONTHLY",
        deliveryPeriod: "Monthly Retainer",
        supportPeriod: "Dedicated Account Lead",
        features: [
          "Complete Website AMC & Minor Feature Updates",
          "Meta & Google Paid Ads Management",
          "25 Monthly Visual Creatives & 4 Reels",
          "Full SEO Strategy for 25 Target Keywords",
          "WhatsApp Campaign Support & Weekly Reporting",
        ],
        isPopular: true,
      },
      {
        name: "Corporate Pro",
        code: "COMBO_PRO",
        description: "Aggressive multi-channel digital dominance for established enterprises and regional market leaders.",
        price: 100000,
        priceDisplay: "₹1,00,000 / month",
        billingType: "MONTHLY",
        deliveryPeriod: "Monthly Retainer",
        supportPeriod: "Priority Dedicated Squad",
        features: [
          "Continuous Website & Web App Engineering",
          "Multi-Platform Paid Advertising (Google, Meta, LinkedIn)",
          "Daily Social Content (40 Creatives + 8 Reels)",
          "Aggressive Technical SEO & Backlink Building",
          "Custom CRM Automation & Lead Pipeline Optimization",
        ],
        isPopular: false,
      },
      {
        name: "Enterprise Digital Partner",
        code: "COMBO_ENTERPRISE",
        description: "Your fully outsourced Chief Technology & Digital Marketing department with dedicated senior engineers.",
        price: 150000,
        priceDisplay: "₹1,50,000 / month onwards",
        billingType: "MONTHLY",
        deliveryPeriod: "Dedicated SLA",
        supportPeriod: "Executive Director Escalation",
        features: [
          "Dedicated Full-Stack Developer & UI/UX Designer",
          "Dedicated Senior Performance Marketing Strategist",
          "End-to-End Enterprise Cloud & Infrastructure Hosting",
          "Bespoke Internal Tooling & Automation Development",
          "99.9% Uptime Guarantee with Custom Corporate SLA",
        ],
        isPopular: false,
      },
    ],
  },
  {
    code: "AMC_SUPPORT",
    name: "AMC, Cloud & Infrastructure SLA",
    description: "Rock-solid cloud infrastructure, domain management, security audits, and guaranteed enterprise SLAs.",
    icon: "ShieldCheck",
    sortOrder: 7,
    packages: [
      {
        name: "Cloud Hosting & Domain SLA",
        code: "AMC_CLOUD",
        description: "Managed high-availability cloud servers (AWS/DigitalOcean), SSL encryption, and domain lifecycle.",
        price: 25000,
        priceDisplay: "₹25,000 / year",
        billingType: "ANNUAL",
        deliveryPeriod: "Immediate Provisioning",
        supportPeriod: "365 Days 24/7 Monitoring",
        features: ["High-Speed Cloud SSD VPS Server", "Automated Daily Snapshots & Disasters Recovery", "Free Wildcard SSL Certificate", "DDoS Mitigation & Enterprise Web Application Firewall", "Domain DNS & Business Email Provisioning"],
        isPopular: false,
      },
      {
        name: "Software & Mobile App AMC",
        code: "AMC_SOFTWARE",
        description: "Continuous version compatibility, OS updates, security patches, database tuning, and API maintenance.",
        price: 45000,
        priceDisplay: "Starting ₹45,000 / year",
        billingType: "ANNUAL",
        deliveryPeriod: "Annual Contract",
        supportPeriod: "1 Hour Critical Response",
        features: ["Android & iOS New OS Version Compatibility", "Database Index Tuning & Optimization", "Third-Party API & Webhook Breakage Fixes", "Security Vulnerability Audits", "Monthly Uptime & Performance Audits"],
        isPopular: false,
      },
      {
        name: "Corporate Enterprise SLA",
        code: "AMC_SLA",
        description: "Legally binding Service Level Agreement with guaranteed resolution timelines and dedicated support engineer.",
        price: 75000,
        priceDisplay: "Custom Annual SLA",
        billingType: "CUSTOM",
        deliveryPeriod: "Formal SLA Agreement",
        supportPeriod: "24/7 365 Days Dedicated Support",
        features: ["Guaranteed 15-Minute First Response Time", "Dedicated Senior Tech Support Manager", "On-Demand Staging Environment for Pre-Release Testing", "Quarterly Disaster Recovery Drills", "Quarterly Architecture & Cybersecurity Reviews"],
        isPopular: false,
      },
    ],
  },
];

export interface SubmitServiceEnquiryInput {
  fullName: string;
  companyName?: string;
  phone: string;
  email: string;
  city?: string;
  serviceCategoryCode?: string;
  packageName?: string;
  requirement?: string;
  preferredContact?: string;
  message?: string;
  source?: string;
  estimatedBudget?: number;
}

export class ServicesService {
  /**
   * Automatically seeds default service categories and packages if not present.
   */
  static async seedDefaultCatalog() {
    for (const catData of DEFAULT_SERVICE_CATEGORIES) {
      const category = await db.serviceCategory.upsert({
        where: { code: catData.code },
        update: {
          name: catData.name,
          description: catData.description,
          icon: catData.icon,
          sortOrder: catData.sortOrder,
        },
        create: {
          code: catData.code,
          name: catData.name,
          description: catData.description,
          icon: catData.icon,
          sortOrder: catData.sortOrder,
        },
      });

      for (let i = 0; i < catData.packages.length; i++) {
        const pkg = catData.packages[i];
        await db.servicePackage.upsert({
          where: { code: pkg.code },
          update: {
            name: pkg.name,
            description: pkg.description,
            price: pkg.price,
            priceDisplay: pkg.priceDisplay,
            billingType: pkg.billingType,
            features: pkg.features,
            deliveryPeriod: pkg.deliveryPeriod,
            supportPeriod: pkg.supportPeriod,
            isPopular: pkg.isPopular,
            sortOrder: i + 1,
            categoryId: category.id,
          },
          create: {
            code: pkg.code,
            name: pkg.name,
            description: pkg.description,
            price: pkg.price,
            priceDisplay: pkg.priceDisplay,
            billingType: pkg.billingType,
            features: pkg.features,
            deliveryPeriod: pkg.deliveryPeriod,
            supportPeriod: pkg.supportPeriod,
            isPopular: pkg.isPopular,
            sortOrder: i + 1,
            categoryId: category.id,
          },
        });
      }
    }
  }

  /**
   * Generates unique Service Enquiry Number: SRV-YYYY-XXXX
   */
  private static async generateEnquiryNumber(): Promise<string> {
    const year = new Date().getFullYear();
    for (let i = 0; i < 5; i++) {
      const rand = Math.floor(1000 + Math.random() * 9000);
      const code = `SRV-${year}-${rand}`;
      const existing = await db.serviceEnquiry.findUnique({
        where: { enquiryNumber: code },
      });
      if (!existing) return code;
    }
    return `SRV-${year}-${Date.now().toString().slice(-4)}`;
  }

  /**
   * Submits a public service enquiry from the website.
   * Completely isolated from student admissions and leads.
   */
  static async submitPublicEnquiry(input: SubmitServiceEnquiryInput) {
    const enquiryNumber = await this.generateEnquiryNumber();

    // Look up category if specified
    let categoryId: string | null = null;
    if (input.serviceCategoryCode) {
      const cat = await db.serviceCategory.findUnique({
        where: { code: input.serviceCategoryCode },
      });
      if (cat) categoryId = cat.id;
    }

    const created = await db.serviceEnquiry.create({
      data: {
        enquiryNumber,
        fullName: input.fullName.trim(),
        companyName: input.companyName?.trim() || null,
        phone: input.phone.trim(),
        email: input.email.trim().toLowerCase(),
        city: input.city?.trim() || null,
        serviceCategoryCode: input.serviceCategoryCode || null,
        categoryId,
        packageName: input.packageName?.trim() || null,
        requirement: input.requirement?.trim() || null,
        preferredContact: input.preferredContact || "PHONE",
        message: input.message?.trim() || null,
        source: input.source || "Website — Services",
        status: ServiceEnquiryStatus.NEW,
        estimatedBudget: input.estimatedBudget || null,
      },
    });

    // Record initial activity
    await db.serviceEnquiryActivity.create({
      data: {
        enquiryId: created.id,
        actorName: "System (Website)",
        action: "ENQUIRY_CREATED",
        details: `Service enquiry received from ${created.fullName} (${created.companyName || "Individual"}) for ${input.serviceCategoryCode || "General Services"}.`,
      },
    });

    return created;
  }

  /**
   * Fetches high-level metrics for LMS Services Dashboard.
   */
  static async getDashboardMetrics(user: AuthenticatedUser) {
    const allowedRoles: UserRoleCode[] = [
      UserRoleCode.SUPER_ADMIN,
      UserRoleCode.ADMIN,
      UserRoleCode.DIRECTOR,
      UserRoleCode.COUNSELOR,
    ];

    if (!allowedRoles.includes(user.roleCode)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permission to view Services dashboard metrics.",
      });
    }

    const whereScope =
      user.roleCode === UserRoleCode.COUNSELOR
        ? { assignedCounselorId: user.id }
        : {};

    const [
      totalEnquiries,
      newEnquiries,
      contacted,
      requirementDiscussed,
      quoteRequested,
      quotationSent,
      converted,
      closed,
      lost,
      followUpsPending,
    ] = await Promise.all([
      db.serviceEnquiry.count({ where: whereScope }),
      db.serviceEnquiry.count({ where: { ...whereScope, status: ServiceEnquiryStatus.NEW } }),
      db.serviceEnquiry.count({ where: { ...whereScope, status: ServiceEnquiryStatus.CONTACTED } }),
      db.serviceEnquiry.count({ where: { ...whereScope, status: ServiceEnquiryStatus.REQUIREMENT_DISCUSSED } }),
      db.serviceEnquiry.count({ where: { ...whereScope, status: ServiceEnquiryStatus.QUOTE_REQUESTED } }),
      db.serviceEnquiry.count({ where: { ...whereScope, status: ServiceEnquiryStatus.QUOTATION_SENT } }),
      db.serviceEnquiry.count({ where: { ...whereScope, status: ServiceEnquiryStatus.CONVERTED } }),
      db.serviceEnquiry.count({ where: { ...whereScope, status: ServiceEnquiryStatus.CLOSED } }),
      db.serviceEnquiry.count({ where: { ...whereScope, status: ServiceEnquiryStatus.LOST } }),
      db.serviceEnquiry.count({
        where: {
          ...whereScope,
          status: { in: [ServiceEnquiryStatus.FOLLOW_UP, ServiceEnquiryStatus.CONTACTED, ServiceEnquiryStatus.QUOTE_REQUESTED] },
          nextFollowUp: { lte: new Date() },
        },
      }),
    ]);

    return {
      totalEnquiries,
      newEnquiries,
      contacted,
      requirementDiscussed,
      quoteRequested,
      quotationSent,
      converted,
      closed,
      lost,
      followUpsPending,
    };
  }

  /**
   * Lists service enquiries with search, status filters, and pagination.
   */
  static async listEnquiries(
    user: AuthenticatedUser,
    params: {
      status?: ServiceEnquiryStatus;
      categoryCode?: string;
      counselorId?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const allowedRoles: UserRoleCode[] = [
      UserRoleCode.SUPER_ADMIN,
      UserRoleCode.ADMIN,
      UserRoleCode.DIRECTOR,
      UserRoleCode.COUNSELOR,
    ];

    if (!allowedRoles.includes(user.roleCode)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permission to view Service enquiries.",
      });
    }

    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    // Counselor scope
    if (user.roleCode === UserRoleCode.COUNSELOR) {
      where.assignedCounselorId = user.id;
    } else if (params.counselorId) {
      where.assignedCounselorId = params.counselorId;
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.categoryCode) {
      where.serviceCategoryCode = params.categoryCode;
    }

    if (params.search && params.search.trim() !== "") {
      const q = params.search.trim();
      where.OR = [
        { fullName: { contains: q, mode: "insensitive" } },
        { companyName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { enquiryNumber: { contains: q, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      db.serviceEnquiry.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, code: true } },
          package: { select: { id: true, name: true, priceDisplay: true } },
          assignedCounselor: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.serviceEnquiry.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Retrieves single service enquiry details with activity logs.
   */
  static async getEnquiryDetails(user: AuthenticatedUser, enquiryId: string) {
    const allowedRoles: UserRoleCode[] = [
      UserRoleCode.SUPER_ADMIN,
      UserRoleCode.ADMIN,
      UserRoleCode.DIRECTOR,
      UserRoleCode.COUNSELOR,
    ];

    if (!allowedRoles.includes(user.roleCode)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permission to inspect this Service enquiry.",
      });
    }

    const enquiry = await db.serviceEnquiry.findUnique({
      where: { id: enquiryId },
      include: {
        category: true,
        package: true,
        assignedCounselor: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        activities: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!enquiry) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Service enquiry not found.",
      });
    }

    if (user.roleCode === UserRoleCode.COUNSELOR && enquiry.assignedCounselorId !== user.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are only permitted to view service enquiries assigned to you.",
      });
    }

    return enquiry;
  }

  /**
   * Updates an enquiry's status, notes, or next follow-up.
   */
  static async updateEnquiryStatus(
    user: AuthenticatedUser,
    input: {
      enquiryId: string;
      status?: ServiceEnquiryStatus;
      notes?: string;
      nextFollowUp?: Date | null;
      estimatedBudget?: number;
    }
  ) {
    const enquiry = await this.getEnquiryDetails(user, input.enquiryId);

    const oldStatus = enquiry.status;
    const newStatus = input.status || oldStatus;

    const updated = await db.serviceEnquiry.update({
      where: { id: input.enquiryId },
      data: {
        status: newStatus,
        notes: input.notes !== undefined ? input.notes : enquiry.notes,
        nextFollowUp: input.nextFollowUp !== undefined ? input.nextFollowUp : enquiry.nextFollowUp,
        estimatedBudget: input.estimatedBudget !== undefined ? input.estimatedBudget : enquiry.estimatedBudget,
      },
    });

    // Log activity
    const activityParts: string[] = [];
    if (newStatus !== oldStatus) {
      activityParts.push(`Status changed from ${oldStatus} to ${newStatus}`);
    }
    if (input.notes) {
      activityParts.push(`Note added: "${input.notes.slice(0, 100)}..."`);
    }
    if (input.nextFollowUp) {
      activityParts.push(`Next follow-up scheduled for ${input.nextFollowUp.toISOString().slice(0, 10)}`);
    }

    if (activityParts.length > 0) {
      await db.serviceEnquiryActivity.create({
        data: {
          enquiryId: input.enquiryId,
          actorId: user.id,
          actorName: `${user.firstName} ${user.lastName}`.trim() || user.email,
          action: "UPDATE",
          details: activityParts.join(" | "),
        },
      });
    }

    return updated;
  }

  /**
   * Assigns an enquiry to a counselor (Super Admin, Admin, Director only).
   */
  static async assignEnquiry(
    user: AuthenticatedUser,
    input: { enquiryId: string; counselorId: string }
  ) {
    const managerRoles: UserRoleCode[] = [
      UserRoleCode.SUPER_ADMIN,
      UserRoleCode.ADMIN,
      UserRoleCode.DIRECTOR,
    ];

    if (!managerRoles.includes(user.roleCode)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only management users can assign service enquiries.",
      });
    }

    const counselor = await db.user.findUnique({
      where: { id: input.counselorId },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    if (!counselor) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Assigned counselor was not found.",
      });
    }

    const updated = await db.serviceEnquiry.update({
      where: { id: input.enquiryId },
      data: { assignedCounselorId: counselor.id },
    });

    await db.serviceEnquiryActivity.create({
      data: {
        enquiryId: input.enquiryId,
        actorId: user.id,
        actorName: `${user.firstName} ${user.lastName}`.trim() || user.email,
        action: "ASSIGNED",
        details: `Assigned to Counselor: ${counselor.firstName} ${counselor.lastName} (${counselor.email})`,
      },
    });

    return updated;
  }

  /**
   * Lists all service categories and their associated packages for LMS catalog.
   */
  static async listCatalog() {
    return db.serviceCategory.findMany({
      where: { isActive: true },
      include: {
        packages: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });
  }

  /**
   * Lists available counselors for enquiry assignment.
   */
  static async listCounselors() {
    return db.user.findMany({
      where: {
        roleCode: { in: [UserRoleCode.COUNSELOR, UserRoleCode.ADMIN, UserRoleCode.SUPER_ADMIN] },
        status: "ACTIVE",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        roleCode: true,
      },
      orderBy: { firstName: "asc" },
    });
  }
}
