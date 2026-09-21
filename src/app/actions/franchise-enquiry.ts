"use server";

import { CrmLeadService } from "@/server/services/crm-lead.service";
import { headers } from "next/headers";
import { z } from "zod";

const franchiseEnquirySchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  phone: z.string().min(10, "Please enter a valid 10-digit mobile number").max(15),
  email: z.string().email("Please enter a valid email address"),
  city: z.string().min(2, "City is required").max(100),
  state: z.string().min(2, "State is required").max(100),
  preferredLocation: z.string().max(150).optional(),
  applicantProfile: z.string().min(2, "Please select your professional profile"),
  investmentCapacity: z.string().min(2, "Please select investment capacity"),
  existingInstitute: z.string().optional(),
  experience: z.string().max(500).optional(),
  launchTimeline: z.string().max(100).optional(),
  requirements: z.string().max(1000).optional(),
  notes: z.string().max(1000).optional(),
  campaignName: z.string().optional(),
  adsetName: z.string().optional(),
  adCreativeName: z.string().optional(),
  keywordSearch: z.string().optional(),
  landingPageUrl: z.string().optional(),
  honeypot: z.string().optional(),
});

export type FranchiseEnquiryState = {
  success: boolean;
  message?: string;
  referenceNumber?: string;
  leadId?: string;
  isNew?: boolean;
  errors?: Record<string, string[]>;
};

export async function submitFranchiseEnquiryAction(
  _prevState: FranchiseEnquiryState,
  formData: FormData
): Promise<FranchiseEnquiryState> {
  const rawData = {
    fullName: (formData.get("fullName") as string) || "",
    phone: (formData.get("phone") as string) || "",
    email: (formData.get("email") as string) || "",
    city: (formData.get("city") as string) || "",
    state: (formData.get("state") as string) || "",
    preferredLocation: (formData.get("preferredLocation") as string) || "",
    applicantProfile: (formData.get("applicantProfile") as string) || "",
    investmentCapacity: (formData.get("investmentCapacity") as string) || "",
    existingInstitute: (formData.get("existingInstitute") as string) || "false",
    experience: (formData.get("experience") as string) || "",
    launchTimeline: (formData.get("launchTimeline") as string) || "",
    requirements: (formData.get("requirements") as string) || "",
    notes: (formData.get("notes") as string) || "",
    campaignName: (formData.get("campaignName") as string) || "",
    adsetName: (formData.get("adsetName") as string) || "",
    adCreativeName: (formData.get("adCreativeName") as string) || "",
    keywordSearch: (formData.get("keywordSearch") as string) || "",
    landingPageUrl: (formData.get("landingPageUrl") as string) || "/franchise",
    honeypot: (formData.get("honeypot") as string) || "",
  };

  const validated = franchiseEnquirySchema.safeParse(rawData);
  if (!validated.success) {
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors,
      message: "Please fill all required franchise fields correctly.",
    };
  }

  try {
    const headersList = headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
    const userAgent = headersList.get("user-agent") || "unknown";

    const result = await CrmLeadService.submitFranchiseEnquiry(
      {
        fullName: validated.data.fullName,
        phone: validated.data.phone,
        email: validated.data.email,
        city: validated.data.city,
        state: validated.data.state,
        preferredLocation: validated.data.preferredLocation || undefined,
        applicantProfile: validated.data.applicantProfile,
        investmentCapacity: validated.data.investmentCapacity,
        existingInstitute:
          validated.data.existingInstitute === "true" ||
          validated.data.existingInstitute === "on",
        experience: validated.data.experience || undefined,
        launchTimeline: validated.data.launchTimeline || undefined,
        requirements: validated.data.requirements || undefined,
        notes: validated.data.notes || undefined,
        campaignName: validated.data.campaignName || undefined,
        adsetName: validated.data.adsetName || undefined,
        adCreativeName: validated.data.adCreativeName || undefined,
        keywordSearch: validated.data.keywordSearch || undefined,
        landingPageUrl: validated.data.landingPageUrl || "/franchise",
        honeypot: validated.data.honeypot || undefined,
      },
      ipAddress,
      userAgent
    );

    return {
      success: true,
      leadId: result.leadId,
      referenceNumber: result.referenceNumber,
      isNew: result.isNew,
      message: result.message || "Thank you! Your franchise enquiry has been recorded.",
    };
  } catch (error: any) {
    return {
      success: false,
      message:
        error?.message ||
        "Failed to submit franchise application. Please contact our leadership directly.",
    };
  }
}
