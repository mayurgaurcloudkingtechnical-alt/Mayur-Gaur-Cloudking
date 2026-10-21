import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  SKILLVERSE_BRAND,
  INITIAL_SKILLVERSE_COURSES,
  INITIAL_SKILLVERSE_FAQS,
  INITIAL_SKILLVERSE_BLOGS,
} from "@/lib/constants/skillverse-data";
import { SkillverseService } from "@/server/services/skillverse.service";
import { SkillverseLeadForm } from "@/components/skillverse/skillverse-lead-form";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Users,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";

const STATIC_INFO_PAGES: Record<
  string,
  {
    badge: string;
    title: string;
    subtitle: string;
    sections: { heading: string; paragraphs: string[] }[];
  }
> = {
  about: {
    badge: "About SLG SKILLVERSE",
    title: "Empowering Classes 8–12 with Strong Academic Foundations & Future Skills",
    subtitle: `${SKILLVERSE_BRAND.tagline} ${SKILLVERSE_BRAND.supportingLine}`,
    sections: [
      {
        heading: "Our Mission & SoftLab Global Heritage",
        paragraphs: [
          "SLG SKILLVERSE — Powered by SoftLab Global is a dedicated education division engineered to bridge school academic mastery (Classes 8 to 12) with national competitive entrance preparation (IIT-JEE, NEET-UG, Olympiads, CUET, NDA) and practical 21st-century technology literacy (AI, Python Coding, Web Development, Data Analytics, Robotics, and Communication).",
          "Rooted in SoftLab Global's engineering and academic rigor, Skillverse ensures that students neither rely on rote memorization nor miss out on foundational computing and communication skills during their formative school years.",
        ],
      },
      {
        heading: "Complete Transparency, Child Safety & Parent Partnership",
        paragraphs: [
          "We operate on verifiable parent/guardian consent, zero-hidden-fee pricing, and real-time family visibility through our isolated Parent Portal. Every attendance mark, diagnostic assessment score, and fee receipt is accessible to authorized parents.",
        ],
      },
    ],
  },
  "privacy-policy": {
    badge: "Privacy Policy • DPDP Framework Aligned",
    title: "Privacy Policy & Student Data Protection",
    subtitle:
      "How SLG SKILLVERSE collects, processes, protects, and retains student and parent data in accordance with Indian data protection laws (including the Digital Personal Data Protection framework).",
    sections: [
      {
        heading: "1. Verifiable Parent / Guardian Consent for Minors",
        paragraphs: [
          "Because SLG SKILLVERSE serves school students in Classes 8 to 12 (who are typically under 18 years of age), we require verifiable parent or legal guardian consent prior to collecting or processing student personal data for admissions, diagnostic assessments, or LMS enrollment.",
          "We never conduct behavioral tracking, targeted advertising, or detrimental profiling of children.",
        ],
      },
      {
        heading: "2. Data Collected & Purpose Limitation",
        paragraphs: [
          "We collect only the minimum data necessary for academic delivery: student name, class/board, parent/guardian name, parent contact details, attendance records, assessment submissions, and fee invoices.",
          "Student and parent data is never sold, shared with unauthorized third parties, or exposed in public URLs or analytics events.",
        ],
      },
      {
        heading: "3. Data Retention, Correction & Deletion Rights",
        paragraphs: [
          "Parents and legal guardians have the right to review their child's academic profile, request corrections, withdraw consent, or request erasure of non-statutory personal data by contacting our Grievance & Privacy Desk at admissions@softlabglobal.com.",
        ],
      },
    ],
  },
  "terms-and-conditions": {
    badge: "Terms & Conditions",
    title: "Terms and Conditions of Enrollment & Platform Use",
    subtitle:
      "Governing academic packages, competitive add-ons, standalone courses, LMS usage, and institutional conduct.",
    sections: [
      {
        heading: "1. Scope of Educational Services",
        paragraphs: [
          "SLG SKILLVERSE (Powered by SoftLab Global) provides supplementary school academic foundation, competitive entrance coaching, and skill development programs. Our courses and certificates do not imply government board affiliation, university accreditation, or guaranteed admission/rank in external examinations.",
        ],
      },
      {
        heading: "2. Fee Transparency & Payment Terms",
        paragraphs: [
          "All monthly package fees, competitive-exam add-ons, standalone course fees, and one-time admission/kit fees are disclosed prior to enrollment. Payments are processed only through verified server-side payment orders or authorized institutional receipts.",
        ],
      },
      {
        heading: "3. Student Code of Conduct & Academic Integrity",
        paragraphs: [
          "Students must maintain respectful conduct in classroom and online batches, protect their login credentials, and complete assessments honestly.",
        ],
      },
    ],
  },
  "refund-policy": {
    badge: "Refund & Cancellation Policy",
    title: "Transparent Refund, Cancellation & Batch Transfer Policy",
    subtitle:
      "Clear rules governing demo classes, monthly subscriptions, one-time fees, and refund requests.",
    sections: [
      {
        heading: "1. Free Demo Class & Initial Assessment Before Payment",
        paragraphs: [
          "Both the initial diagnostic assessment and the trial demo class are provided free of charge (₹0) so families can evaluate teaching quality before making any financial commitment.",
        ],
      },
      {
        heading: "2. Monthly Package & Add-On Cancellations",
        paragraphs: [
          "Monthly academic packages and competitive-exam add-ons may be cancelled prior to the start of the next monthly billing cycle by submitting a request through the Parent Portal or emailing admissions@softlabglobal.com.",
        ],
      },
      {
        heading: "3. Pro-Rata Refund Eligibility & Processing",
        paragraphs: [
          "If a newly enrolled student withdraws within 7 calendar days of batch commencement, tuition fees are eligible for refund after deducting only utilized sessions and physical kit materials already issued. Approved refunds are processed back to the original payment source within 7–10 working days.",
        ],
      },
    ],
  },
  "child-safety-consent": {
    badge: "Child Safety & Parent Consent",
    title: "Child Safety, Online Safeguarding & Verifiable Parent Consent Policy",
    subtitle:
      "Mandatory safeguarding standards for students in Classes 8 to 12 across physical classrooms and live online sessions.",
    sections: [
      {
        heading: "1. Parent-First Communication & Family Portal Isolation",
        paragraphs: [
          "All official admission confirmations, fee invoices, schedule changes, and assessment reports are shared directly with the registered parent/legal guardian.",
          "Each family's Parent Portal is cryptographically isolated so no parent or external user can view another student's records.",
        ],
      },
      {
        heading: "2. Safe Classroom & Moderated Online Learning",
        paragraphs: [
          "Live online classes and doubt sessions are moderated by authorized faculty. Direct unmoderated peer messaging and external file sharing are restricted to protect young learners.",
        ],
      },
      {
        heading: "3. Responsible AI & Cyber Safety Guardrails",
        paragraphs: [
          "Our AI Literacy and Coding labs teach students never to share personal identifiers, passwords, or family information with external AI tools.",
        ],
      },
    ],
  },
};

export default async function SkillverseDynamicSlugPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const catalogData = await SkillverseService.getCatalogAndConfig();

  // 1. Check if slug is Contact page
  if (slug === "contact") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <div className="bg-gradient-to-r from-[#071630] to-[#0052CC] rounded-3xl p-8 sm:p-10 text-white space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-lime-300">
            Campus & Admissions Helpdesk
          </span>
          <h1 className="text-3xl sm:text-4xl font-black">Contact SLG SKILLVERSE</h1>
          <p className="text-sm text-slate-200 max-w-2xl">
            Visit our Civil Lines, Prayagraj academic center or connect with our counseling desk for
            Classes 8–12 admissions, demo bookings, and parent support.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 bg-slate-50 rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-5 text-xs sm:text-sm">
            <h2 className="text-xl font-extrabold text-slate-900">
              Official Campus & Contact Details
            </h2>
            <div className="space-y-4 text-slate-700">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900">Campus Address:</strong>
                  {catalogData.cms.contactAddress}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900">Phone & WhatsApp:</strong>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    <a
                      href="tel:+919196596975"
                      className="text-blue-700 font-bold hover:underline"
                    >
                      {catalogData.cms.contactPhone}
                    </a>
                    <a
                      href="https://wa.me/919196596975"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#15803D] hover:bg-emerald-200 text-xs font-bold inline-flex items-center gap-1 transition-colors"
                    >
                      WhatsApp Us
                    </a>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900">Admissions Email:</strong>
                  {catalogData.cms.contactEmail}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900">Support Hours:</strong>
                  {catalogData.cms.supportHours}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <SkillverseLeadForm mode="ADMISSION_ENQUIRY" title="Send an Enquiry to Our Academic Desk" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Check if slug is FAQs page
  if (slug === "faqs") {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="bg-gradient-to-r from-[#071630] to-[#15803D] rounded-3xl p-8 text-white space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-lime-300">
            Student & Parent Help Center
          </span>
          <h1 className="text-3xl font-black">Frequently Asked Questions</h1>
          <p className="text-sm text-slate-200">
            Transparent answers regarding Classes 8–12 curriculum, competitive foundations, fees,
            and child safety.
          </p>
        </div>

        <div className="space-y-4">
          {INITIAL_SKILLVERSE_FAQS.map((faq, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                {faq.category}
              </span>
              <h2 className="text-base font-extrabold text-slate-900">{faq.question}</h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3. Check if slug is Blog & Learning Resources page
  if (slug === "blog") {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="bg-gradient-to-r from-[#071630] to-[#0052CC] rounded-3xl p-8 text-white space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-lime-300">
            Academic Guides & Study Strategies
          </span>
          <h1 className="text-3xl font-black">SLG SKILLVERSE Blog & Learning Resources</h1>
          <p className="text-sm text-slate-200">
            Articles on NCERT mastery, JEE/NEET foundation habits, responsible AI use, and senior
            secondary stream selection.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {INITIAL_SKILLVERSE_BLOGS.map((post) => (
            <article
              key={post.slug}
              className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-bold text-blue-600 uppercase">{post.category}</span>
                  <span>{post.readTime}</span>
                </div>
                <h2 className="text-lg font-extrabold text-slate-900">{post.title}</h2>
                <p className="text-xs text-slate-600 leading-relaxed">{post.summary}</p>
                <div className="pt-2 space-y-2 text-xs text-slate-700 border-t border-slate-100">
                  {post.content.map((para, i) => (
                    <p key={i} className="leading-relaxed">
                      {para}
                    </p>
                  ))}
                </div>
              </div>
              <div className="pt-3 text-[11px] text-slate-400">Published: {post.publishedAt}</div>
            </article>
          ))}
        </div>
      </div>
    );
  }

  // 4. Check if slug is one of the Static Policy / About pages
  if (STATIC_INFO_PAGES[slug]) {
    const info = STATIC_INFO_PAGES[slug];
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="bg-gradient-to-r from-[#071630] to-[#0B2247] rounded-3xl p-8 text-white space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-lime-300">
            {info.badge}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black">{info.title}</h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{info.subtitle}</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
          {info.sections.map((sec, idx) => (
            <div key={idx} className="space-y-2">
              <h2 className="text-lg font-extrabold text-slate-900">{sec.heading}</h2>
              {sec.paragraphs.map((p, pIdx) => (
                <p key={pIdx} className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {p}
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 5. Check if slug matches a Course / Curriculum Program (Server-Side PUBLISHED Enforcement)
  const course =
    catalogData.courses.find((c) => c.slug === slug) ||
    INITIAL_SKILLVERSE_COURSES.find((c) => c.slug === slug);

  if (!course || course.status !== "PUBLISHED") {
    notFound();
  }

  await SkillverseService.recordAnalyticsEvent({
    eventType: "COURSE_PAGE_VIEW",
    courseSlug: course.slug,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Breadcrumb & Hero */}
      <div className="bg-gradient-to-br from-[#071630] via-[#0B2247] to-[#0052CC] rounded-3xl p-8 sm:p-10 text-white space-y-4">
        <Link
          href="/skillverse/courses"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300 hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to All Courses
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-lime-500/20 border border-lime-400/40 text-lime-300 text-xs font-bold uppercase">
            {course.categoryLabel}
          </span>
          <span className="font-mono text-xs text-slate-300">Course Code: {course.code}</span>
          <span className="text-xs text-cyan-200">
            • Syllabus Rev: {course.syllabusRevisionDate}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black leading-tight">{course.title}</h1>
        <p className="text-sm sm:text-base text-slate-200 max-w-3xl leading-relaxed">
          {course.description}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10 text-xs">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-slate-400 block">Eligible Classes</span>
            <span className="font-bold text-white">{course.eligibleGrades.join(", ")}</span>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-slate-400 block">Duration & Hours</span>
            <span className="font-bold text-white">
              {course.durationLabel} ({course.teachingHours} Hrs)
            </span>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-slate-400 block">Default Batch Timetable</span>
            <span className="font-bold text-white">{course.defaultTimetable}</span>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-slate-400 block">Transparent Fee</span>
            <span className="font-black text-lime-300 text-base">
              ₹{course.priceInr.toLocaleString("en-IN")}
              {course.billingCycle === "MONTHLY" ? "/month" : " total"}
            </span>
          </div>
        </div>
      </div>

      {course.officialExamNotice && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Academic & Examination Compliance Notice:</strong> {course.officialExamNotice}
          </div>
        </div>
      )}

      {/* Curriculum Modules & Learning Outcomes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-extrabold text-slate-900">
              Key Learning Outcomes & Prerequisites
            </h2>
            <p className="text-xs text-slate-600">
              <strong>Prerequisites:</strong> {course.prerequisites} |{" "}
              <strong>Applicable Boards:</strong> {course.applicableBoards.join(", ")} |{" "}
              <strong>Batch Capacity:</strong> Max {course.batchCapacity} Students
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
              {course.learningOutcomes.map((outcome, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-extrabold text-slate-900">
              Detailed Modules, Chapters & Lesson Plan
            </h2>
            {course.modules.map((mod, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">{mod.title}</h3>
                  <span className="px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-bold">
                    {mod.teachingHours} Teaching Hrs
                  </span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600 pl-4 list-disc">
                  {mod.lessons.map((lesson, lIdx) => (
                    <li key={lIdx}>{lesson}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 text-xs text-slate-700">
            <strong>Assessment & Evaluation Pattern:</strong> {course.assessmentPattern}
          </div>
        </div>

        <div className="lg:col-span-5">
          <SkillverseLeadForm
            mode="ADMISSION_ENQUIRY"
            defaultCourseSlug={course.slug}
            defaultGrade={course.eligibleGrades[0] || "Class 9"}
            title={`Enquire or Book Demo for ${course.title}`}
          />
        </div>
      </div>
    </div>
  );
}
