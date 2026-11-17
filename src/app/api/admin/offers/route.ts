import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/server/db/client";
import { WhatsAppBusinessService } from "@/server/services/whatsapp-business.service";
import { EmailService } from "@/server/services/email.service";

export const dynamic = "force-dynamic";

const AUTHORITY_ROLES = ["SUPER_ADMIN", "DIRECTOR", "ADMIN", "MANAGER"];

async function getAuth(req: NextRequest) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  const token =
    (await getToken({ req, secret, secureCookie: true }).catch(() => null)) ||
    (await getToken({ req, secret, secureCookie: false }).catch(() => null));
  if (!token?.sub || !AUTHORITY_ROLES.includes(String(token.roleCode || ""))) {
    return null;
  }
  return token;
}

export async function GET(req: NextRequest) {
  const token = await getAuth(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const offers = await db.marketingOffer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      dispatches: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  const enriched = offers.map((o) => ({
    ...o,
    dispatches: o.dispatches.map((d) => ({
      ...d,
      conversionRate:
        d.totalRecipients > 0 ? Number(((d.admissionCount / d.totalRecipients) * 100).toFixed(2)) : 0,
    })),
  }));

  return NextResponse.json({ ok: true, offers: enriched });
}

export async function POST(req: NextRequest) {
  try {
    const token = await getAuth(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const action = String(body.action || "CREATE_OFFER").toUpperCase();

    if (action === "CREATE_OFFER") {
      const originalFees = Number(body.originalFees || 0);
      const discountPercentage = Number(body.discountPercentage || 0);
      const discountedFees =
        body.discountedFees != null
          ? Number(body.discountedFees)
          : Math.max(0, Math.round(originalFees * (1 - discountPercentage / 100)));

      const offer = await db.marketingOffer.create({
        data: {
          offerName: String(body.offerName || "Special Scholarship Offer"),
          discountPercentage,
          applicableCourses: body.applicableCourses || [],
          originalFees,
          discountedFees,
          startDate: body.startDate ? new Date(body.startDate) : new Date(),
          expiryDate: body.expiryDate ? new Date(body.expiryDate) : new Date(Date.now() + 30 * 86400000),
          eligibility: body.eligibility || "Open to eligible applicants",
          targetAudience: body.targetAudience || "Prospective Learners",
          whatsappTemplate: body.whatsappTemplate || null,
          emailSubject: body.emailSubject || `${body.offerName || "Exclusive Offer"} – SoftLab Global`,
          emailTemplate: body.emailTemplate || null,
          campaignImageUrl: body.campaignImageUrl || null,
          landingPageUrl: body.landingPageUrl || "https://www.softlabglobal.com/courses",
          termsAndConditions: body.termsAndConditions || "Limited period offer.",
          createdById: String(token.sub),
        },
      });

      await db.auditLog.create({
        data: {
          actorId: String(token.sub),
          action: "MARKETING_OFFER_CREATED",
          resourceType: "MarketingOffer",
          resourceId: offer.id,
          newData: { offerName: offer.offerName, discountPercentage },
        },
      });

      return NextResponse.json({ ok: true, offer });
    }

    if (action === "DISPATCH_CAMPAIGN") {
      const offer = await db.marketingOffer.findUnique({ where: { id: String(body.offerId || "") } });
      if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });

      const segmentType = String(body.segmentType || "SELECTED_LEADS").toUpperCase();
      const channels: string[] = Array.isArray(body.channels) && body.channels.length > 0 ? body.channels : ["WHATSAPP", "EMAIL"];
      const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
      const isFutureSchedule = scheduledAt && scheduledAt.getTime() > Date.now() + 60000;

      // Resolve recipients cleanly while respecting opt-out
      const recipients: Array<{
        recipientType: "LEAD" | "STUDENT";
        leadId?: string;
        studentId?: string;
        recipientName: string;
        phone?: string | null;
        email?: string | null;
        isOptedOut?: boolean;
      }> = [];

      if (segmentType === "SELECTED_STUDENTS") {
        const studentIds: string[] = Array.isArray(body.studentIds) ? body.studentIds : [];
        const students = await db.studentProfile.findMany({
          where: studentIds.length ? { id: { in: studentIds } } : {},
          take: 500,
          include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } },
        });
        for (const s of students) {
          recipients.push({
            recipientType: "STUDENT",
            studentId: s.id,
            recipientName: `${s.user.firstName} ${s.user.lastName}`.trim(),
            phone: s.user.phone,
            email: s.user.email,
            isOptedOut: false,
          });
        }
      } else {
        const leadWhere: any = { isOptedOut: false };
        if (segmentType === "SELECTED_LEADS" && Array.isArray(body.leadIds) && body.leadIds.length > 0) {
          leadWhere.id = { in: body.leadIds };
        } else if (segmentType === "COUNSELOR_LEADS" && Array.isArray(body.counselorIds) && body.counselorIds.length > 0) {
          leadWhere.OR = [
            { assignedToId: { in: body.counselorIds } },
            { assignedCounselorId: { in: body.counselorIds } },
          ];
        } else if (segmentType === "CITIES" && Array.isArray(body.cities) && body.cities.length > 0) {
          leadWhere.city = { in: body.cities };
        } else if (segmentType === "CAMPAIGN_SEGMENT" && body.campaignFilter) {
          leadWhere.campaignName = { contains: String(body.campaignFilter), mode: "insensitive" };
        }

        const leads = await db.lead.findMany({
          where: leadWhere,
          take: 500,
          select: { id: true, fullName: true, phone: true, email: true, isOptedOut: true },
        });
        for (const l of leads) {
          recipients.push({
            recipientType: "LEAD",
            leadId: l.id,
            recipientName: l.fullName,
            phone: l.phone,
            email: l.email,
            isOptedOut: l.isOptedOut,
          });
        }
      }

      const dispatch = await db.offerCampaignDispatch.create({
        data: {
          offerId: offer.id,
          campaignName: String(body.campaignName || `${offer.offerName} Campaign`),
          segmentType,
          filters: body.filters || {},
          channels,
          scheduledAt,
          status: isFutureSchedule ? "SCHEDULED" : "PROCESSING",
          totalRecipients: recipients.length,
          createdById: String(token.sub),
        },
      });

      let sentCount = 0;
      let failedCount = 0;

      for (const r of recipients) {
        let whatsappStatus = "SKIPPED";
        let whatsappMessageId: string | null = null;
        let emailStatus = "SKIPPED";
        let emailMessageId: string | null = null;
        let errorMessage: string | null = null;

        if (!isFutureSchedule) {
          const personalizedMsg =
            (offer.whatsappTemplate ||
              `Hello {{name}}, unlock *${offer.offerName}* (${offer.discountPercentage}% OFF — ₹${offer.discountedFees} instead of ₹${offer.originalFees}) at SoftLab Global! Valid till ${offer.expiryDate.toLocaleDateString("en-IN")}. Apply: ${offer.landingPageUrl || "https://www.softlabglobal.com"}`)
              .replace(/\{\{name\}\}/gi, r.recipientName);

          if (channels.includes("WHATSAPP") && r.phone) {
            if (r.isOptedOut || (await WhatsAppBusinessService.isOptedOut(r.phone))) {
              whatsappStatus = "OPTED_OUT";
            } else {
              const waRes = await WhatsAppBusinessService.sendMessage({
                toPhone: r.phone,
                text: personalizedMsg,
                mediaUrl: offer.campaignImageUrl || undefined,
                leadId: r.leadId,
              });
              if (waRes.success) {
                whatsappStatus = "SENT";
                whatsappMessageId = waRes.messageId;
                sentCount++;
              } else {
                whatsappStatus = "FAILED";
                errorMessage = waRes.error || "WhatsApp send failed";
                failedCount++;
              }
            }
          }

          if (channels.includes("EMAIL") && r.email && !r.email.endsWith("@pending.softlabglobal.com")) {
            const emailRes = await EmailService.sendEmail({
              to: r.email,
              subject: offer.emailSubject || `${offer.offerName} – SoftLab Global`,
              html: (offer.emailTemplate || `<p>${personalizedMsg.replace(/\n/g, "<br/>")}</p>`).replace(/\{\{name\}\}/gi, r.recipientName),
              text: personalizedMsg,
            }).catch((e) => ({ success: false, messageId: "", error: e?.message }));
            if ((emailRes as any)?.success) {
              emailStatus = "SENT";
              emailMessageId = (emailRes as any).messageId || null;
              if (whatsappStatus === "SKIPPED") sentCount++;
            } else {
              emailStatus = "FAILED";
            }
          }
        }

        await db.offerCampaignRecipient.create({
          data: {
            dispatchId: dispatch.id,
            recipientType: r.recipientType,
            leadId: r.leadId || null,
            studentId: r.studentId || null,
            recipientName: r.recipientName,
            phone: r.phone || null,
            email: r.email || null,
            whatsappStatus,
            whatsappMessageId,
            emailStatus,
            emailMessageId,
            errorMessage,
          },
        });
      }

      const finalDispatch = await db.offerCampaignDispatch.update({
        where: { id: dispatch.id },
        data: {
          status: isFutureSchedule ? "SCHEDULED" : "COMPLETED",
          dispatchedAt: isFutureSchedule ? null : new Date(),
          sentCount,
          failedCount,
        },
      });

      return NextResponse.json({ ok: true, dispatch: finalDispatch });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Offer API error" }, { status: 500 });
  }
}
