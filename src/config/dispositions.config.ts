import { LeadStatus } from "@prisma/client";

export interface DispositionOption {
  code: string;
  label: string;
  category: "INITIAL_CONTACT" | "ENGAGED_INTEREST" | "COUNSELLING_ADMISSION" | "TERMINAL_CLOSED";
  mappedLeadStatus: LeadStatus;
  temperature: "HOT" | "WARM" | "COLD";
  requiresFollowUp: boolean;
  defaultCallStatus: "CONNECTED" | "NO_ANSWER" | "BUSY" | "FAILED";
}

export const CANONICAL_DISPOSITIONS: DispositionOption[] = [
  {
    code: "NEW",
    label: "New / Uncontacted Enquiry",
    category: "INITIAL_CONTACT",
    mappedLeadStatus: LeadStatus.NEW,
    temperature: "WARM",
    requiresFollowUp: true,
    defaultCallStatus: "CONNECTED",
  },
  {
    code: "NOT_CONNECTED",
    label: "Not Connected / Unreachable",
    category: "INITIAL_CONTACT",
    mappedLeadStatus: LeadStatus.FOLLOW_UP,
    temperature: "WARM",
    requiresFollowUp: true,
    defaultCallStatus: "NO_ANSWER",
  },
  {
    code: "NO_ANSWER",
    label: "Ringing — No Answer",
    category: "INITIAL_CONTACT",
    mappedLeadStatus: LeadStatus.FOLLOW_UP,
    temperature: "WARM",
    requiresFollowUp: true,
    defaultCallStatus: "NO_ANSWER",
  },
  {
    code: "BUSY",
    label: "Line Busy / On Another Call",
    category: "INITIAL_CONTACT",
    mappedLeadStatus: LeadStatus.FOLLOW_UP,
    temperature: "WARM",
    requiresFollowUp: true,
    defaultCallStatus: "BUSY",
  },
  {
    code: "CALL_BACK_REQUESTED",
    label: "Call Back Requested",
    category: "INITIAL_CONTACT",
    mappedLeadStatus: LeadStatus.FOLLOW_UP,
    temperature: "WARM",
    requiresFollowUp: true,
    defaultCallStatus: "CONNECTED",
  },
  {
    code: "FOLLOW_UP_REQUIRED",
    label: "Follow-Up Required",
    category: "INITIAL_CONTACT",
    mappedLeadStatus: LeadStatus.FOLLOW_UP,
    temperature: "WARM",
    requiresFollowUp: true,
    defaultCallStatus: "CONNECTED",
  },
  {
    code: "INTERESTED",
    label: "Interested in Program",
    category: "ENGAGED_INTEREST",
    mappedLeadStatus: LeadStatus.INTERESTED,
    temperature: "HOT",
    requiresFollowUp: true,
    defaultCallStatus: "CONNECTED",
  },
  {
    code: "HIGHLY_INTERESTED",
    label: "Highly Interested — Ready for Admission",
    category: "ENGAGED_INTEREST",
    mappedLeadStatus: LeadStatus.INTERESTED,
    temperature: "HOT",
    requiresFollowUp: true,
    defaultCallStatus: "CONNECTED",
  },
  {
    code: "COURSE_ENQUIRY",
    label: "Course Curriculum & Syllabus Enquiry",
    category: "ENGAGED_INTEREST",
    mappedLeadStatus: LeadStatus.CONTACTED,
    temperature: "WARM",
    requiresFollowUp: true,
    defaultCallStatus: "CONNECTED",
  },
  {
    code: "FEE_ENQUIRY",
    label: "Fee Structure & EMI Plan Enquiry",
    category: "ENGAGED_INTEREST",
    mappedLeadStatus: LeadStatus.NEGOTIATION,
    temperature: "HOT",
    requiresFollowUp: true,
    defaultCallStatus: "CONNECTED",
  },
  {
    code: "DEMO_REQUESTED",
    label: "Demo Class Requested / Scheduled",
    category: "ENGAGED_INTEREST",
    mappedLeadStatus: LeadStatus.DEMO,
    temperature: "HOT",
    requiresFollowUp: true,
    defaultCallStatus: "CONNECTED",
  },
  {
    code: "DEMO_COMPLETED",
    label: "Demo Class Attended / Completed",
    category: "ENGAGED_INTEREST",
    mappedLeadStatus: LeadStatus.DEMO,
    temperature: "HOT",
    requiresFollowUp: true,
    defaultCallStatus: "CONNECTED",
  },
  {
    code: "COUNSELLING_REQUIRED",
    label: "Academic Counselling Required",
    category: "COUNSELLING_ADMISSION",
    mappedLeadStatus: LeadStatus.FOLLOW_UP,
    temperature: "HOT",
    requiresFollowUp: true,
    defaultCallStatus: "CONNECTED",
  },
  {
    code: "COUNSELLING_COMPLETED",
    label: "Academic Counselling Completed",
    category: "COUNSELLING_ADMISSION",
    mappedLeadStatus: LeadStatus.QUALIFIED,
    temperature: "HOT",
    requiresFollowUp: true,
    defaultCallStatus: "CONNECTED",
  },
  {
    code: "DOCUMENTS_PENDING",
    label: "Documents Pending for Verification",
    category: "COUNSELLING_ADMISSION",
    mappedLeadStatus: LeadStatus.NEGOTIATION,
    temperature: "HOT",
    requiresFollowUp: true,
    defaultCallStatus: "CONNECTED",
  },
  {
    code: "PAYMENT_PENDING",
    label: "Fee Payment Link Sent / Payment Pending",
    category: "COUNSELLING_ADMISSION",
    mappedLeadStatus: LeadStatus.NEGOTIATION,
    temperature: "HOT",
    requiresFollowUp: true,
    defaultCallStatus: "CONNECTED",
  },
  {
    code: "PAYMENT_COMPLETED",
    label: "Fee Payment Completed",
    category: "COUNSELLING_ADMISSION",
    mappedLeadStatus: LeadStatus.APPROVED,
    temperature: "HOT",
    requiresFollowUp: true,
    defaultCallStatus: "CONNECTED",
  },
  {
    code: "ADMISSION_IN_PROGRESS",
    label: "Admission Application in Progress",
    category: "COUNSELLING_ADMISSION",
    mappedLeadStatus: LeadStatus.NEGOTIATION,
    temperature: "HOT",
    requiresFollowUp: true,
    defaultCallStatus: "CONNECTED",
  },
  {
    code: "ADMITTED",
    label: "Admitted / Enrollment Confirmed",
    category: "COUNSELLING_ADMISSION",
    mappedLeadStatus: LeadStatus.ADMITTED,
    temperature: "HOT",
    requiresFollowUp: false,
    defaultCallStatus: "CONNECTED",
  },
  {
    code: "NOT_INTERESTED",
    label: "Not Interested",
    category: "TERMINAL_CLOSED",
    mappedLeadStatus: LeadStatus.LOST,
    temperature: "COLD",
    requiresFollowUp: false,
    defaultCallStatus: "CONNECTED",
  },
  {
    code: "INVALID_NUMBER",
    label: "Invalid / Unassigned Phone Number",
    category: "TERMINAL_CLOSED",
    mappedLeadStatus: LeadStatus.DISQUALIFIED,
    temperature: "COLD",
    requiresFollowUp: false,
    defaultCallStatus: "FAILED",
  },
  {
    code: "WRONG_NUMBER",
    label: "Wrong Number / Not the Applicant",
    category: "TERMINAL_CLOSED",
    mappedLeadStatus: LeadStatus.DISQUALIFIED,
    temperature: "COLD",
    requiresFollowUp: false,
    defaultCallStatus: "CONNECTED",
  },
  {
    code: "DUPLICATE_LEAD",
    label: "Duplicate Lead Record",
    category: "TERMINAL_CLOSED",
    mappedLeadStatus: LeadStatus.DISQUALIFIED,
    temperature: "COLD",
    requiresFollowUp: false,
    defaultCallStatus: "CONNECTED",
  },
  {
    code: "NOT_ELIGIBLE",
    label: "Not Eligible for Program Criteria",
    category: "TERMINAL_CLOSED",
    mappedLeadStatus: LeadStatus.DISQUALIFIED,
    temperature: "COLD",
    requiresFollowUp: false,
    defaultCallStatus: "CONNECTED",
  },
  {
    code: "CLOSED",
    label: "Enquiry Resolved / Closed",
    category: "TERMINAL_CLOSED",
    mappedLeadStatus: LeadStatus.LOST,
    temperature: "COLD",
    requiresFollowUp: false,
    defaultCallStatus: "CONNECTED",
  },
];

const LEGACY_DISPOSITION_ALIASES: Record<string, string> = {
  CALLBACK: "CALL_BACK_REQUESTED",
  CALLBACK_REQUESTED: "CALL_BACK_REQUESTED",
  FOLLOW_UP: "FOLLOW_UP_REQUIRED",
  CONNECTED: "INTERESTED",
  CONNECTED_CALL: "INTERESTED",
  NOT_REACHABLE: "NOT_CONNECTED",
  BUSY_NO_ANSWER: "NO_ANSWER",
  ADMISSION_CONFIRMED: "ADMITTED",
  ENQUIRY_RESOLVED: "CLOSED",
  DEMO_SCHEDULED: "DEMO_REQUESTED",
};

export function resolveCanonicalDisposition(rawCode?: string | null): DispositionOption {
  if (!rawCode) {
    return CANONICAL_DISPOSITIONS.find((d) => d.code === "INTERESTED")!;
  }
  const normalized = rawCode.trim().toUpperCase().replace(/[\s-]+/g, "_");
  const canonicalCode = LEGACY_DISPOSITION_ALIASES[normalized] || normalized;
  const matched = CANONICAL_DISPOSITIONS.find((d) => d.code === canonicalCode);
  if (matched) return matched;

  return {
    code: canonicalCode,
    label: rawCode.replace(/_/g, " "),
    category: "INITIAL_CONTACT",
    mappedLeadStatus: LeadStatus.CONTACTED,
    temperature: "WARM",
    requiresFollowUp: true,
    defaultCallStatus: "CONNECTED",
  };
}
