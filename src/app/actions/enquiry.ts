"use server";

import { CrmLeadService } from "@/server/services/crm-lead.service";
import { headers } from "next/headers";
import { z } from "zod";

const enquirySchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().min(10, "Please enter a valid 10-digit mobile number"),
  email: z.string().email("Please enter a valid email address"),
  city: z.string().nullable().optional(),
  qualification: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  interestedCourseId: z.string().nullable().optional(),
  campaignName: z.string().nullable().optional(),
  trainingMode: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  honeypot: z.string().nullable().optional(),
});

export type EnquiryState = {
  success: boolean;
  message?: string;
  leadId?: string;
  errors?: Record<string, string[]>;
};

export async function submitEnquiryAction(
  _prevState: EnquiryState,
  formData: FormData
): Promise<EnquiryState> {
  const rawData = {
    fullName: ((formData.get("fullName") as string) || "").trim(),
    phone: ((formData.get("phone") as string) || "").trim(),
    email: ((formData.get("email") as string) || "").trim(),
    city: (formData.get("city") as string) || undefined,
    qualification: (formData.get("qualification") as string) || undefined,
    source: (formData.get("source") as string) || undefined,
    campaignName: (formData.get("campaignName") as string) || undefined,
    interestedCourseId: (formData.get("interestedCourseId") as string) || undefined,
    trainingMode: (formData.get("trainingMode") as string) || undefined,
    notes: ((formData.get("notes") || formData.get("message")) as string) || undefined,
    honeypot: (formData.get("honeypot") as string) || undefined,
  };

  const validated = enquirySchema.safeParse(rawData);
  if (!validated.success) {
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors,
      message: "Please fill all required fields correctly.",
    };
  }

  try {
    let ipAddress = "127.0.0.1";
    let userAgent = "unknown";
    try {
      const headersList = headers();
      const forwardedFor = headersList.get("x-forwarded-for");
      ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
      userAgent = headersList.get("user-agent") || "unknown";
    } catch {
      // Fallback if headers() context unavailable
    }

    const combinedNotes = [
      validated.data.trainingMode ? `Mode: ${validated.data.trainingMode}` : null,
      validated.data.notes || null,
    ]
      .filter(Boolean)
      .join(" | ");

    const leadSource = (validated.data.source as any) || undefined;

    const result = await CrmLeadService.submitPublicEnquiry(
      {
        fullName: validated.data.fullName,
        phone: validated.data.phone,
        email: validated.data.email,
        city: validated.data.city || undefined,
        qualification: validated.data.qualification || undefined,
        source: leadSource,
        campaignName: validated.data.campaignName || undefined,
        interestedCourseId: validated.data.interestedCourseId || undefined,
        notes: combinedNotes || undefined,
        honeypot: validated.data.honeypot || undefined,
      },
      ipAddress,
      userAgent
    );

    return {
      success: true,
      leadId: result.leadId,
      message: "Thank you! Our senior academic counselor will call you within 15 minutes.",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Failed to submit enquiry. Please call us directly.",
    };
  }
}
