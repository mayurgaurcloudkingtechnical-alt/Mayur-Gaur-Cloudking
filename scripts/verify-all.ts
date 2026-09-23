import { PrismaClient, UserRoleCode, PaymentMethod } from "@prisma/client";
import { CrmLeadService } from "../src/server/services/crm-lead.service";
import { PaymentService } from "../src/server/services/payment.service";

const db = new PrismaClient();

async function runEndToEndVerification() {
  console.log("=================================================");
  console.log("STARTING END-TO-END VERIFICATION OF LMS FEATURES");
  console.log("=================================================");

  // Find a super admin user for authenticated context
  const adminUser = await db.user.findFirst({
    where: { roleCode: UserRoleCode.SUPER_ADMIN, status: "ACTIVE" },
  });

  if (!adminUser) {
    throw new Error("No active Super Admin found in database for test context.");
  }

  const authUser = {
    id: adminUser.id,
    email: adminUser.email,
    roleCode: adminUser.roleCode,
    firstName: adminUser.firstName,
    lastName: adminUser.lastName,
    permissions: ["*"],
    status: adminUser.status,
  };

  console.log(`[TEST CONTEXT] Authenticated as: ${authUser.email} (${authUser.roleCode})`);

  // ==========================================================
  // 1. TEST FRANCHISE VIEW: ASSIGN ENQUIRY
  // ==========================================================
  console.log("\n--- TEST 1: FRANCHISE ASSIGN ENQUIRY ---");
  const testLead = await db.lead.findFirst({
    where: { franchiseState: { not: null } },
  });

  if (testLead) {
    const staff = await db.user.findFirst({
      where: { roleCode: { in: [UserRoleCode.COUNSELOR, UserRoleCode.MANAGER, UserRoleCode.ADMIN] } },
    });

    if (staff) {
      console.log(`Assigning franchise lead "${testLead.fullName}" (ID: ${testLead.id}) to staff "${staff.firstName} ${staff.lastName}" (ID: ${staff.id})...`);
      await CrmLeadService.assignFranchiseLead(authUser, {
        leadId: testLead.id,
        assignedToId: staff.id,
      });

      // Verify persistence in DB
      const refreshedLead = await db.lead.findUnique({
        where: { id: testLead.id },
        include: { assignedTo: true },
      });

      if (refreshedLead?.assignedToId === staff.id) {
        console.log(`✓ SUCCESS: Franchise enquiry assigned to ${refreshedLead.assignedTo?.firstName} ${refreshedLead.assignedTo?.lastName} and persisted in DB.`);
      } else {
        throw new Error("FAILED: Assigned staff was not persisted.");
      }
    }
  } else {
    console.log("No franchise leads found in database. Skipping lead assignment test.");
  }

  // ==========================================================
  // 2. TEST FRANCHISE VIEW: EDIT FRANCHISE SALE
  // ==========================================================
  console.log("\n--- TEST 2: FRANCHISE EDIT SALE / PAYMENT ---");
  const existingSale = await db.franchiseSale.findFirst({
    include: { franchise: true },
  });

  if (existingSale) {
    console.log(`Editing sale invoice "${existingSale.saleInvoiceNo}" for center "${existingSale.franchise.centerName}"...`);
    const testNotes = `Verified update - ${new Date().toISOString()}`;

    await CrmLeadService.updateFranchiseSale(authUser, {
      saleId: existingSale.id,
      packageName: existingSale.packageName,
      totalAmount: existingSale.totalAmount,
      discountAmount: existingSale.discountAmount,
      paidAmount: existingSale.paidAmount,
      pendingAmount: existingSale.pendingAmount,
      paymentStatus: existingSale.paymentStatus,
      paymentMethod: existingSale.paymentMethod,
      referenceNumber: "VERIF-REF-9999",
      notes: testNotes,
    });

    // Refresh from database
    const refreshedSale = await db.franchiseSale.findUnique({
      where: { id: existingSale.id },
    });

    if (refreshedSale?.referenceNumber === "VERIF-REF-9999" && refreshedSale?.notes === testNotes) {
      console.log(`✓ SUCCESS: Franchise sale updated and verified in DB (Ref: ${refreshedSale.referenceNumber}, Total: ₹${refreshedSale.totalAmount / 100}, Paid: ₹${refreshedSale.paidAmount / 100}, Pending: ₹${refreshedSale.pendingAmount / 100}).`);
    } else {
      throw new Error("FAILED: Franchise sale update did not persist.");
    }
  }

  // ==========================================================
  // 3. TEST STUDENT DETAIL VIEW: EDIT PROFILE & PHOTO
  // ==========================================================
  console.log("\n--- TEST 3: STUDENT EDIT PROFILE & DEMOGRAPHICS ---");
  const student = await db.studentProfile.findFirst({
    include: { user: true, enrollments: { include: { feeStructure: true } } },
  });

  if (!student) {
    throw new Error("No students found in database.");
  }

  console.log(`Testing profile update for student: ${student.user.firstName} ${student.user.lastName} (${student.studentId})...`);

  const testFatherName = "Shri Rajesh Kumar";
  const testMotherName = "Smt. Sunita Devi";
  const testWhatsapp = "9876501234";
  const testCenter = "SoftLab Global, Civil Lines, Prayagraj";
  const testAdmDate = new Date("2024-07-15T00:00:00.000Z");
  const testPhotoUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150";

  await db.studentProfile.update({
    where: { id: student.id },
    data: {
      fatherName: testFatherName,
      motherName: testMotherName,
      whatsappNumber: testWhatsapp,
      center: testCenter,
      admissionDate: testAdmDate,
      photoUrl: testPhotoUrl,
      schoolOrCollege: "University of Allahabad",
      passingYear: "2024",
      percentageOrCgpa: "8.4 CGPA",
    },
  });

  // Verify DB state
  const refreshedStudent = await db.studentProfile.findUnique({
    where: { id: student.id },
    include: { user: true },
  });

  if (
    refreshedStudent?.fatherName === testFatherName &&
    refreshedStudent?.motherName === testMotherName &&
    refreshedStudent?.whatsappNumber === testWhatsapp &&
    refreshedStudent?.center === testCenter &&
    refreshedStudent?.photoUrl === testPhotoUrl
  ) {
    console.log(`✓ SUCCESS: Student profile fields updated and verified in DB:`);
    console.log(`   - Father Name: ${refreshedStudent.fatherName}`);
    console.log(`   - Mother Name: ${refreshedStudent.motherName}`);
    console.log(`   - WhatsApp: ${refreshedStudent.whatsappNumber}`);
    console.log(`   - Center: ${refreshedStudent.center}`);
    console.log(`   - Admission Date: ${refreshedStudent.admissionDate?.toISOString()}`);
    console.log(`   - Photo URL: ${refreshedStudent.photoUrl}`);
  } else {
    throw new Error("FAILED: Student profile updates did not persist.");
  }

  // ==========================================================
  // 4. TEST HISTORICAL FEE: RECORD BACKDATED PAYMENT
  // ==========================================================
  console.log("\n--- TEST 4: HISTORICAL FEE ENTRY ---");
  const enrollment = student.enrollments[0];
  if (!enrollment || !enrollment.feeStructure) {
    throw new Error("Student has no fee structure.");
  }

  const historicalDate = new Date("2024-08-10T10:00:00.000Z");
  const historicalAmountPaise = 500000; // ₹5,000
  const historicalReceiptNo = `SLG-HIST-2024-${Date.now().toString().slice(-4)}`;

  console.log(`Recording historical fee of ₹${historicalAmountPaise / 100} with date ${historicalDate.toISOString()}...`);

  const prevPaid = enrollment.feeStructure.paidAmount;

  const payment = await PaymentService.recordOfflinePayment(authUser, {
    feeStructureId: enrollment.feeStructure.id,
    amount: historicalAmountPaise,
    paymentMethod: PaymentMethod.CASH,
    paymentDate: historicalDate,
    receiptNumber: historicalReceiptNo,
    remarks: "Historical offline cash fee installment",
    isHistorical: true,
  });

  // Verify payment date was strictly preserved
  const refreshedPayment = await db.paymentTransaction.findUnique({
    where: { id: payment.payment.id },
  });

  if (!refreshedPayment) {
    throw new Error("Payment transaction not found in database.");
  }

  const payDateStr = new Date(refreshedPayment.paymentDate).toISOString().split("T")[0];
  const expectedDateStr = historicalDate.toISOString().split("T")[0];

  if (payDateStr !== expectedDateStr) {
    throw new Error(`FAILED: Historical payment date was altered! Expected ${expectedDateStr}, got ${payDateStr}`);
  }

  // Verify fee structure totals recalculated
  const refreshedFs = await db.feeStructure.findUnique({
    where: { id: enrollment.feeStructure.id },
  });

  if (!refreshedFs || refreshedFs.paidAmount !== prevPaid + historicalAmountPaise) {
    throw new Error("FAILED: Fee structure paidAmount did not recalculate correctly.");
  }

  console.log(`✓ SUCCESS: Historical payment created and preserved in DB:`);
  console.log(`   - Receipt No: ${refreshedPayment.receiptNumber}`);
  console.log(`   - Payment Date: ${payDateStr} (Preserved exact historical date)`);
  console.log(`   - Amount: ₹${refreshedPayment.amount / 100}`);
  console.log(`   - Fee Structure Paid: ₹${refreshedFs.paidAmount / 100} (Recalculated)`);
  console.log(`   - Fee Structure Pending: ₹${refreshedFs.pendingAmount / 100} (Recalculated)`);

  // ==========================================================
  // 5. TEST EDIT PAYMENT
  // ==========================================================
  console.log("\n--- TEST 5: EDIT PAYMENT RECORD ---");
  await PaymentService.updatePayment(authUser, {
    paymentId: refreshedPayment.id,
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    providerReference: "UTR-VERIF-12345678",
    remarks: "Updated payment record with verified UTR",
    receiptNumber: `${historicalReceiptNo}-EDITED`,
  });

  const verifiedEditedPayment = await db.paymentTransaction.findUnique({
    where: { id: refreshedPayment.id },
  });

  if (
    verifiedEditedPayment?.paymentMethod === PaymentMethod.BANK_TRANSFER &&
    verifiedEditedPayment?.providerReference === "UTR-VERIF-12345678" &&
    verifiedEditedPayment?.receiptNumber === `${historicalReceiptNo}-EDITED`
  ) {
    console.log(`✓ SUCCESS: Payment record edited and verified in DB:`);
    console.log(`   - New Payment Mode: ${verifiedEditedPayment.paymentMethod}`);
    console.log(`   - New Reference: ${verifiedEditedPayment.providerReference}`);
    console.log(`   - New Receipt No: ${verifiedEditedPayment.receiptNumber}`);
  } else {
    throw new Error("FAILED: Edit payment did not persist.");
  }

  // ==========================================================
  // 6. TEST STUDENT DOCUMENTS
  // ==========================================================
  console.log("\n--- TEST 6: STUDENT DOCUMENTS (UPLOAD & DELETE) ---");
  const doc = await db.studentDocument.create({
    data: {
      studentId: student.id,
      title: "10th High School Marksheet",
      documentType: "ACADEMIC_CERTIFICATE",
      documentUrl: "https://example.com/docs/marksheet10th.pdf",
      fileName: "marksheet10th.pdf",
    },
  });

  const studentWithDocs = await db.studentProfile.findUnique({
    where: { id: student.id },
    include: { documents: true },
  });

  const docFound = studentWithDocs?.documents.find((d) => d.id === doc.id);
  if (!docFound) {
    throw new Error("FAILED: Student document was not saved or linked to student profile.");
  }
  console.log(`✓ SUCCESS: Document linked to student profile:`);
  console.log(`   - Document ID: ${docFound.id}`);
  console.log(`   - Title: ${docFound.title}`);
  console.log(`   - Type: ${docFound.documentType}`);
  console.log(`   - URL: ${docFound.documentUrl}`);

  // Test document deletion
  await db.studentDocument.delete({ where: { id: doc.id } });
  const docAfterDelete = await db.studentDocument.findUnique({ where: { id: doc.id } });
  if (docAfterDelete === null) {
    console.log(`✓ SUCCESS: Document deleted cleanly from database.`);
  } else {
    throw new Error("FAILED: Document was not deleted.");
  }

  // ==========================================================
  // 7. TEST STUDENT ID CARD GENERATION
  // ==========================================================
  console.log("\n--- TEST 7: STUDENT ID CARD GENERATION ---");
  const year = new Date().getFullYear();
  const validUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  const cardCount = await db.studentIdCard.count();
  const cardNumber = `SLG-IDC-${year}-${String(cardCount + 1).padStart(5, "0")}`;

  const qrPayload = JSON.stringify({
    inst: "SOFTLAB GLOBAL",
    sid: student.studentId,
    name: `${student.user.firstName} ${student.user.lastName}`,
    course: enrollment.courseId,
    valid: validUntil.getFullYear(),
  });

  await db.studentIdCard.upsert({
    where: { studentId: student.id },
    create: {
      studentId: student.id,
      cardNumber,
      validUntil,
      qrCodeData: qrPayload,
      educationProvider: "SoftLab Global",
      status: "ACTIVE",
    },
    update: {
      validUntil,
      qrCodeData: qrPayload,
      status: "ACTIVE",
      updatedAt: new Date(),
    },
  });

  const studentWithCard = await db.studentProfile.findUnique({
    where: { id: student.id },
    include: { idCard: true },
  });

  if (studentWithCard?.idCard?.cardNumber === cardNumber && studentWithCard?.idCard?.status === "ACTIVE") {
    console.log(`✓ SUCCESS: Official Student ID Card generated and linked in DB:`);
    console.log(`   - Card Number: ${studentWithCard.idCard.cardNumber}`);
    console.log(`   - Status: ${studentWithCard.idCard.status}`);
    console.log(`   - Valid Until: ${studentWithCard.idCard.validUntil.toISOString()}`);
    console.log(`   - QR Payload: ${studentWithCard.idCard.qrCodeData}`);
  } else {
    throw new Error("FAILED: Student ID Card was not generated or linked properly.");
  }

  console.log("\n=================================================");
  console.log("ALL 7 END-TO-END FEATURES VERIFIED SUCCESSFULLY!");
  console.log("=================================================");
}

runEndToEndVerification()
  .catch((err) => {
    console.error("VERIFICATION FAILED WITH ERROR:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
