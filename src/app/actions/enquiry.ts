"use server";

import { CrmLeadService } from "@/server/services/crm-lead.service";
import { headers } from "next/headers";
import { z } from "zod";

const enquirySchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().min(10, "Please enter a valid 10-digit mobile number"),
  email: z.string().email("Please enter a valid email address"),
  city: z.string().optional(),
  qualification: z.string().optional(),
  source: z.string().optional(),
  interestedCourseId: z.string().optional(),
  campaignName: z.string().optional(),
  trainingMode: z.string().optional(),
  notes: z.string().optional(),
  honeypot: z.string().optional(),
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
    fullName: formData.get("fullName") as string,
    phone: formData.get("phone") as string,
    email: formData.get("email") as string,
    city: formData.get("city") as string,
    qualification: formData.get("qualification") as string,
    source: formData.get("source") as string,
    campaignName: formData.get("campaignName") as string,
    interestedCourseId: formData.get("interestedCourseId") as string,
    trainingMode: formData.get("trainingMode") as string,
    notes: (formData.get("notes") || formData.get("message")) as string,
    honeypot: formData.get("honeypot") as string,
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
    const headersList = headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
    const userAgent = headersList.get("user-agent") || "unknown";

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
        city: validated.data.city,
        qualification: validated.data.qualification,
        source: leadSource,
        campaignName: validated.data.campaignName || undefined,
        interestedCourseId: validated.data.interestedCourseId || undefined,
        notes: combinedNotes || undefined,
        honeypot: validated.data.honeypot,
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
