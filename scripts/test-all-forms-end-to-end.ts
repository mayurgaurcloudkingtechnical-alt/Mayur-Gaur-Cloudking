import { db } from "../src/server/db/client";
import { CrmLeadService } from "../src/server/services/crm-lead.service";
import { CrmApplicationService } from "../src/server/services/crm-application.service";
import { PaymentService } from "../src/server/services/payment.service";
import { submitEnquiryAction } from "../src/app/actions/enquiry";
import { submitFranchiseEnquiryAction } from "../src/app/actions/franchise-enquiry";
import { LeadSource, LeadStatus, PaymentMethod } from "@prisma/client";

async function main() {
  console.log("=== COMPREHENSIVE END-TO-END AUDIT OF ALL FORMS ===");

  const admin = await db.user.findFirst({
    where: { roleCode: "SUPER_ADMIN", status: "ACTIVE" },
    include: { role: true },
  });
  if (!admin || !admin.role) throw new Error("No super admin or role found");

  const authAdmin = {
    id: admin.id,
    email: admin.email,
    roleCode: admin.roleCode,
    permissions: admin.role.permissions || [],
    firstName: admin.firstName,
    lastName: admin.lastName,
  };

  const course = await db.course.findFirst({ where: { status: "PUBLISHED" } });
  if (!course) throw new Error("No course found");

  // Pre-cleanup test artifacts if any exist from previous runs
  const prevStudent = await db.user.findFirst({ where: { email: "aman.gupta.test@gmail.com" } });
  if (prevStudent) {
    const sp = await db.studentProfile.findFirst({ where: { userId: prevStudent.id } });
    if (sp) {
      await db.studentIdCard.deleteMany({ where: { studentId: sp.id } });
      await db.paymentTransaction.deleteMany({ where: { studentId: sp.id } });
      await db.feeInstallment.deleteMany({ where: { feeStructure: { enrollment: { studentId: sp.id } } } });
      await db.feeStructure.deleteMany({ where: { studentId: sp.id } });
      await db.lessonProgress.deleteMany({ where: { enrollment: { studentId: sp.id } } });
      await db.enrollment.deleteMany({ where: { studentId: sp.id } });
      await db.admissionApplication.deleteMany({ where: { convertedStudentProfileId: sp.id } });
      await db.studentProfile.delete({ where: { id: sp.id } });
    }
    await db.user.delete({ where: { id: prevStudent.id } });
  }

  const prevFranchiseLead = await db.lead.findFirst({ where: { email: "rohan.kapoor.test@gmail.com" } });
  if (prevFranchiseLead) {
    const fr = await db.franchise.findFirst({ where: { leadId: prevFranchiseLead.id } });
    if (fr) {
      await db.franchiseSale.deleteMany({ where: { franchiseId: fr.id } });
      await db.franchise.delete({ where: { id: fr.id } });
    }
    await db.leadActivity.deleteMany({ where: { leadId: prevFranchiseLead.id } });
    await db.lead.delete({ where: { id: prevFranchiseLead.id } });
  }

  // FORM 1: Server Action - Public Website Enquiry (used by public-enquiry-form, career-counseling-modal, hero-lead-form)
  console.log("\n[FORM 1] Testing Server Action 'submitEnquiryAction' (Public Website / Counseling Modal / Hero Form)...");
  const formData1 = new FormData();
  formData1.append("fullName", "Ananya Verma");
  formData1.append("phone", "9876543219");
  formData1.append("email", "ananya.verma.test@gmail.com");
  formData1.append("city", "Prayagraj");
  formData1.append("qualification", "B.Sc Computer Science");
  formData1.append("source", "WEBSITE_CAREER_POPUP");
  formData1.append("interestedCourseId", course.title);
  formData1.append("trainingMode", "Offline Classroom");
  formData1.append("notes", "Interested in AI and Python classes");

  const res1 = await submitEnquiryAction({ success: false }, formData1);
  console.log("Result 1:", res1);
  if (!res1.success || !res1.leadId) {
    throw new Error(`FORM 1 FAILED: ${res1.message}`);
  }
  const lead1 = await db.lead.findUnique({ where: { id: res1.leadId } });
  console.log("✓ FORM 1 Verified in DB:", lead1?.fullName, lead1?.phone, lead1?.source);
  // Clean up
  await db.lead.delete({ where: { id: res1.leadId } });
  console.log("✓ Cleaned up test record.");

  // FORM 2: Server Action - Franchise Enquiry (used by /franchise page)
  console.log("\n[FORM 2] Testing Server Action 'submitFranchiseEnquiryAction' (/franchise page)...");
  const formData2 = new FormData();
  formData2.append("fullName", "Vikram Rathore");
  formData2.append("phone", "9876543218");
  formData2.append("email", "vikram.rathore.test@gmail.com");
  formData2.append("city", "Gorakhpur");
  formData2.append("state", "Uttar Pradesh");
  formData2.append("preferredLocation", "Civil Lines Gorakhpur");
  formData2.append("applicantProfile", "Business Entrepreneur");
  formData2.append("investmentCapacity", "₹10L - ₹15L");
  formData2.append("existingInstitute", "false");
  formData2.append("experience", "7 years in professional training");
  formData2.append("launchTimeline", "Within 30 Days");
  formData2.append("requirements", "Need 3000 sq ft space approval and marketing kit");
  formData2.append("notes", "Looking for official center partnership");

  const res2 = await submitFranchiseEnquiryAction({ success: false }, formData2);
  console.log("Result 2:", res2);
  if (!res2.success || !res2.leadId) {
    throw new Error(`FORM 2 FAILED: ${res2.message}`);
  }
  const lead2 = await db.lead.findUnique({ where: { id: res2.leadId } });
  console.log("✓ FORM 2 Verified in DB:", {
    fullName: lead2?.fullName,
    requirements: lead2?.franchiseRequirements,
    state: lead2?.franchiseState,
  });
  // Clean up
  await db.lead.delete({ where: { id: res2.leadId } });
  console.log("✓ Cleaned up test record.");

  // FORM 3: Admin New Franchise Enquiry
  console.log("\n[FORM 3] Testing Admin '+ New Franchise Enquiry' (CrmLeadService.createFranchiseEnquiry)...");
  const res3 = await CrmLeadService.createFranchiseEnquiry(authAdmin, {
    fullName: "Sunil Agarwal",
    phone: "9876543217",
    email: "sunil.agarwal.test@gmail.com",
    city: "Kanpur",
    franchiseState: "Uttar Pradesh",
    franchisePreferredLocation: "Swaroop Nagar",
    franchiseProfile: "IT Education Owner",
    franchiseInvestmentCapacity: "Under ₹10 Lakh",
    franchiseExistingInstitute: true,
    franchiseExperience: "10 Years",
    franchiseLaunchTimeline: "Immediate",
    requirements: "Need syllabus affiliation and online exam portal",
    notes: "Direct campus visit scheduled",
  });
  console.log("✓ FORM 3 Verified in DB:", res3.id, res3.fullName, res3.franchiseRequirements);
  await db.lead.delete({ where: { id: res3.id } });
  console.log("✓ Cleaned up test record.");

  // FORM 4: Counselor Direct Admission
  console.log("\n[FORM 4] Testing Counselor 'Direct Admission' (CrmApplicationService.createDirectAdmission)...");
  const res4 = await CrmApplicationService.createDirectAdmission(authAdmin, {
    courseId: course.id,
    applicantName: "Aman Gupta",
    applicantEmail: "aman.gupta.test@gmail.com",
    applicantPhone: "9876543216",
    city: "Prayagraj",
    state: "Uttar Pradesh",
    highestQualification: "B.Tech CSE",
    finalFee: 3500000,
    paidAmount: 1000000,
    paymentMethod: PaymentMethod.UPI,
    remarks: "Direct walk-in enrollment",
  });
  console.log("✓ FORM 4 Succeeded:", {
    applicationId: res4.application.id,
    studentId: res4.studentProfile.studentId,
    email: res4.user.email,
  });
  // Verify persistence
  const verifiedApp = await db.admissionApplication.findUnique({
    where: { id: res4.application.id },
    include: { convertedStudentProfile: true },
  });
  console.log("✓ FORM 4 Verified in DB:", verifiedApp?.applicantName, verifiedApp?.applicationNumber);
  
  // FORM 5: Record Additional Manual Payment on Fee Structure
  console.log("\n[FORM 5] Testing 'Record Manual Payment' (PaymentService.recordOfflinePayment)...");
  const feeStructure = await db.feeStructure.findFirst({
    where: { studentId: res4.studentProfile.id },
  });
  if (!feeStructure) throw new Error("Fee structure not found for test student");

  const res5 = await PaymentService.recordOfflinePayment(authAdmin, {
    feeStructureId: feeStructure.id,
    amount: 500000,
    paymentMethod: PaymentMethod.UPI,
    remarks: "Manual follow-up installment",
  });
  console.log("✓ FORM 5 Succeeded:", {
    receiptNumber: res5.payment.receiptNumber,
    newPaidAmount: res5.feeStructure.paidAmount,
    newPendingAmount: res5.feeStructure.pendingAmount,
  });

  // Clean up student profile and admission safely
  await db.studentIdCard.deleteMany({ where: { studentId: res4.studentProfile.id } });
  await db.paymentTransaction.deleteMany({ where: { studentId: res4.studentProfile.id } });
  await db.feeInstallment.deleteMany({ where: { feeStructure: { enrollment: { studentId: res4.studentProfile.id } } } });
  await db.feeStructure.deleteMany({ where: { studentId: res4.studentProfile.id } });
  await db.lessonProgress.deleteMany({ where: { enrollment: { studentId: res4.studentProfile.id } } });
  await db.enrollment.deleteMany({ where: { studentId: res4.studentProfile.id } });
  await db.admissionApplication.delete({ where: { id: res4.application.id } });
  await db.studentProfile.delete({ where: { id: res4.studentProfile.id } });
  await db.user.delete({ where: { id: res4.user.id } });
  console.log("✓ Cleaned up test admission safely.");

  // FORM 6: Convert Lead to Franchise Partner
  console.log("\n[FORM 6] Testing Franchise Partner Conversion (CrmLeadService.convertToFranchise)...");
  const franchiseLead = await CrmLeadService.createFranchiseEnquiry(authAdmin, {
    fullName: "Rohan Kapoor",
    phone: "9876543215",
    email: "rohan.kapoor.test@gmail.com",
    city: "Lucknow",
    franchiseState: "Uttar Pradesh",
    franchisePreferredLocation: "Hazratganj",
    franchiseProfile: "EdTech Investor",
    franchiseInvestmentCapacity: "₹15L - ₹25L",
    requirements: "Need premium franchise agreement",
  });

  const res6 = await CrmLeadService.convertFranchiseToSale(authAdmin, {
    leadId: franchiseLead.id,
    centerName: "SoftLab Global Lucknow Tech Hub",
    legalName: "Kapoor Learning Solutions LLP",
    contactPerson: "Rohan Kapoor",
    email: "rohan.kapoor.test@gmail.com",
    phone: "9876543215",
    address: "24 Hazratganj Main Road",
    city: "Lucknow",
    state: "Uttar Pradesh",
    pincode: "226001",
    packageName: "PREMIUM ATC",
    totalAmountPaise: 150000000,
    paidAmountPaise: 50000000,
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    notes: "Official MOU signed",
  });
  console.log("✓ FORM 6 Succeeded:", {
    franchiseCode: res6.franchise.code,
    centerName: res6.franchise.centerName,
    invoiceNo: res6.sale.saleInvoiceNo,
  });

  // Verify franchise in DB
  const verifiedFranchise = await db.franchise.findUnique({
    where: { id: res6.franchise.id },
    include: { sales: true },
  });
  console.log("✓ FORM 6 Verified in DB:", verifiedFranchise?.code, verifiedFranchise?.centerName);

  // Clean up franchise test record safely
  await db.franchiseSale.deleteMany({ where: { franchiseId: res6.franchise.id } });
  await db.franchise.delete({ where: { id: res6.franchise.id } });
  await db.leadActivity.deleteMany({ where: { leadId: franchiseLead.id } });
  await db.lead.delete({ where: { id: franchiseLead.id } });
  console.log("✓ Cleaned up test franchise records safely.");

  console.log("\n=======================================================");
  console.log("ALL TESTED FORM WORKFLOWS EXECUTED AND PASSED WITH 0 ERRORS!");
  console.log("=======================================================");
}

main()
  .catch((err) => {
    console.error("✗ AUDIT FAILED:", err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
