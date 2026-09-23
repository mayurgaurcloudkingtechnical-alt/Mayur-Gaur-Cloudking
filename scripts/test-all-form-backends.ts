import { db } from "../src/server/db/client";
import { CrmLeadService } from "../src/server/services/crm-lead.service";
import { CrmApplicationService } from "../src/server/services/crm-application.service";
import { LeadSource, LeadStatus, PaymentMethod } from "@prisma/client";

async function main() {
  console.log("=== COMPREHENSIVE SERVICE-LEVEL FORM TEST ===");

  const admin = await db.user.findFirst({
    where: { roleCode: "SUPER_ADMIN", status: "ACTIVE" },
    include: { role: true },
  });
  if (!admin) throw new Error("No super admin found");

  const authUser = {
    id: admin.id,
    email: admin.email,
    roleCode: admin.roleCode,
    permissions: admin.role?.permissions || [],
    firstName: admin.firstName,
    lastName: admin.lastName,
  };

  const course = await db.course.findFirst({ where: { status: "PUBLISHED" } });
  if (!course) throw new Error("No published course found");

  // TEST 1: CrmLeadService.createLead (Counselor "Add New Prospect / Lead")
  console.log("\n1. Testing CrmLeadService.createLead...");
  try {
    const res = await CrmLeadService.createLead(authUser, {
      fullName: "Test Automated Prospect",
      phone: "9199990001",
      email: "test_counselor_prospect@example.com",
      city: "Prayagraj",
      qualification: "B.Tech",
      source: LeadSource.WALK_IN,
      qualityScore: "HOT",
      interestedCourseId: course.id,
      notes: "Testing counselor create lead end-to-end",
    });
    console.log("✓ CrmLeadService.createLead SUCCESS, ID:", res.lead.id);
    // Clean up created test lead immediately
    await db.lead.delete({ where: { id: res.lead.id } });
    console.log("✓ Cleaned up test lead.");
  } catch (err: any) {
    console.error("✗ CrmLeadService.createLead FAILED:", err.message);
  }

  // TEST 2: CrmLeadService.submitPublicEnquiry (Public website enquiry)
  console.log("\n2. Testing CrmLeadService.submitPublicEnquiry...");
  try {
    const res = await CrmLeadService.submitPublicEnquiry(
      {
        fullName: "Test Public Website Lead",
        phone: "9199990002",
        email: "test_public_website@example.com",
        city: "Prayagraj",
        source: LeadSource.WEBSITE,
        interestedCourseId: course.id,
        notes: "Testing public website enquiry",
      },
      "127.0.0.1",
      "test-agent"
    );
    console.log("✓ CrmLeadService.submitPublicEnquiry SUCCESS, ID:", res.leadId);
    if (res.leadId && res.leadId !== "spam-filtered") {
      await db.lead.delete({ where: { id: res.leadId } });
      console.log("✓ Cleaned up test lead.");
    }
  } catch (err: any) {
    console.error("✗ CrmLeadService.submitPublicEnquiry FAILED:", err.message);
  }

  // TEST 3: CrmLeadService.submitFranchiseEnquiry (Franchise form)
  console.log("\n3. Testing CrmLeadService.submitFranchiseEnquiry...");
  try {
    const res = await CrmLeadService.submitFranchiseEnquiry(
      {
        fullName: "Test Franchise Applicant",
        phone: "9199990003",
        email: "test_franchise_lead@example.com",
        city: "Varanasi",
        state: "Uttar Pradesh",
        preferredLocation: "Sigra",
        applicantProfile: "Entrepreneur",
        investmentCapacity: "₹10L - ₹15L",
        existingInstitute: false,
        experience: "5 Years",
        launchTimeline: "Within 30 Days",
        requirements: "Need 2000 sq ft syllabus and lab guidance",
        notes: "Test franchise application",
      },
      "127.0.0.1",
      "test-agent"
    );
    console.log("✓ CrmLeadService.submitFranchiseEnquiry SUCCESS, ID:", res.leadId);
    if (res.leadId && res.leadId !== "spam-filtered") {
      await db.lead.delete({ where: { id: res.leadId } });
      console.log("✓ Cleaned up test lead.");
    }
  } catch (err: any) {
    console.error("✗ CrmLeadService.submitFranchiseEnquiry FAILED:", err.message);
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
