import { db } from "../src/server/db/client";
import { CrmApplicationService } from "../src/server/services/crm-application.service";
import { ReceiptService } from "../src/server/services/receipt.service";

async function main() {
  console.log("=== STARTING DIRECT ADMISSION & RECEIPT GENERATION END-TO-END TEST ===");

  // 1. Fetch Super Admin or Counselor user
  const adminUser = await db.user.findFirst({
    where: {
      role: {
        code: { in: ["SUPER_ADMIN", "DIRECTOR", "ADMIN", "COUNSELOR"] },
      },
    },
    include: { role: true },
  });

  if (!adminUser) {
    throw new Error("No staff user found in database with admission permissions.");
  }
  console.log(`[PASS] Using staff user: ${adminUser.email} (Role: ${adminUser.role.code})`);

  // 2. Fetch an active Course
  const course = await db.course.findFirst({
    where: { deletedAt: null },
  });
  if (!course) {
    throw new Error("No active course found in database.");
  }
  console.log(`[PASS] Using course: ${course.title} (Base Fee: ₹${course.baseFee / 100})`);

  // 3. Create a fresh Lead to test lead-to-admission flow
  const testPhone = "98" + Math.floor(10000000 + Math.random() * 90000000);
  const testEmail = `test.admission.${Date.now()}@example.com`;
  const lead = await db.lead.create({
    data: {
      fullName: "Pooja Verma (Test Lead)",
      email: testEmail,
      phone: testPhone,
      source: "WEBSITE",
      course: { connect: { id: course.id } },
      status: "NEW",
    },
  });
  console.log(`[PASS] Created test lead: ${lead.id} (${lead.fullName}, Status: ${lead.status})`);

  try {
    // 4. Execute Direct Admission with:
    // - Custom total fee: ₹60,000 (standard course fee override)
    // - Discount: ₹6,000 (10% scholarship)
    // - Net Payable: ₹54,000
    // - Payment Plan: EMI (3 slots of ₹18,000 each)
    // - Initial Down Payment: ₹18,000 via UPI (Slot 1 fully cleared)
    // - Offline mode, reference 'UPI-TEST-998877'
    const customTotalFee = 60000;
    const discountAmount = 6000;
    const slotAmount = 18000;

    const authContext = {
      id: adminUser.id,
      email: adminUser.email,
      firstName: adminUser.firstName,
      lastName: adminUser.lastName,
      roleCode: adminUser.role.code,
      role: adminUser.role.code,
      permissions: (adminUser.role.permissions as string[]) || ["*"],
    };

    console.log("Invoking CrmApplicationService.createDirectAdmission...");
    const result = await CrmApplicationService.createDirectAdmission(authContext, {
      leadId: lead.id,
      courseId: course.id,
      applicantName: "Pooja Verma",
      applicantEmail: testEmail,
      applicantPhone: testPhone,
      fatherName: "Rajesh Verma",
      motherName: "Sunita Verma",
      gender: "FEMALE",
      dateOfBirth: "2002-05-15",
      address: "12/A Civil Lines",
      city: "Prayagraj",
      state: "Uttar Pradesh",
      pincode: "211001",
      totalCourseFee: customTotalFee * 100,
      discountType: "FIXED",
      discountValue: discountAmount,
      discountAmount: discountAmount * 100,
      discountReason: "Director special scholarship approval",
      paymentPlan: "EMI",
      installmentCount: 3,
      installments: [
        { installmentNumber: 1, amount: slotAmount * 100, dueDate: new Date().toISOString() },
        { installmentNumber: 2, amount: slotAmount * 100, dueDate: new Date(Date.now() + 30 * 86400000).toISOString() },
        { installmentNumber: 3, amount: slotAmount * 100, dueDate: new Date(Date.now() + 60 * 86400000).toISOString() },
      ],
      paidAmount: slotAmount * 100,
      paymentType: "OFFLINE",
      paymentMethod: "UPI",
      paymentReference: "UPI-TEST-998877",
      deliveryMode: "OFFLINE",
      center: "SOFTLAB GLOBAL Main Campus, Prayagraj",
    });

    console.log(`[PASS] Admission created successfully!`);
    console.log(`       Application ID: ${result.application.id}`);
    console.log(`       Application Number: ${result.application.applicationNumber}`);
    console.log(`       Student ID: ${result.student.studentId}`);
    console.log(`       Receipt Number: ${result.receiptNumber}`);

    // 5. Verify Lead Status Transition
    const updatedLead = await db.lead.findUnique({ where: { id: lead.id } });
    if (updatedLead?.status !== "ADMITTED") {
      throw new Error(`Lead status mismatch: expected ADMITTED, got ${updatedLead?.status}`);
    }
    console.log(`[PASS] Lead automatically transitioned to status: ${updatedLead.status}`);

    // 6. Verify Fee Structure Financials (in Paise)
    const feeStructure = await db.feeStructure.findUnique({
      where: { id: result.feeStructure.id },
    });
    if (!feeStructure) throw new Error("Fee structure not found!");

    const expectedTotalPaise = customTotalFee * 100;
    const expectedDiscountPaise = discountAmount * 100;
    const expectedNetPaise = expectedTotalPaise - expectedDiscountPaise;
    const expectedPaidPaise = slotAmount * 100;
    const expectedPendingPaise = expectedNetPaise - expectedPaidPaise;

    console.log("\n--- FINANCIAL AUDIT ---");
    console.log(`Total Fee:     Expected ₹${customTotalFee} | Actual ₹${feeStructure.totalCourseFee / 100}`);
    console.log(`Discount:      Expected ₹${discountAmount}  | Actual ₹${feeStructure.discountAmount / 100}`);
    console.log(`Net Payable:   Expected ₹${expectedNetPaise / 100} | Actual ₹${feeStructure.netPayableAmount / 100}`);
    console.log(`Paid Amount:   Expected ₹${slotAmount} | Actual ₹${feeStructure.paidAmount / 100}`);
    console.log(`Pending:       Expected ₹${expectedPendingPaise / 100} | Actual ₹${feeStructure.pendingAmount / 100}`);

    if (feeStructure.totalCourseFee !== expectedTotalPaise) {
      throw new Error(`FeeStructure totalCourseFee mismatch!`);
    }
    if (feeStructure.discountAmount !== expectedDiscountPaise) {
      throw new Error(`FeeStructure discountAmount mismatch!`);
    }
    if (feeStructure.netPayableAmount !== expectedNetPaise) {
      throw new Error(`FeeStructure netPayableAmount mismatch!`);
    }
    if (feeStructure.paidAmount !== expectedPaidPaise) {
      throw new Error(`FeeStructure paidAmount mismatch!`);
    }
    if (feeStructure.pendingAmount !== expectedPendingPaise) {
      throw new Error(`FeeStructure pendingAmount mismatch!`);
    }
    console.log("[PASS] FeeStructure financials match 100%!");

    // 7. Verify Installment Schedule & Slot 1 Status
    const installments = await db.feeInstallment.findMany({
      where: { feeStructureId: feeStructure.id },
      orderBy: { installmentNumber: "asc" },
    });
    console.log(`\n--- INSTALLMENTS SCHEDULE AUDIT (${installments.length} Slots) ---`);
    installments.forEach((inst) => {
      console.log(`Slot #${inst.installmentNumber}: ₹${inst.amount / 100} | Status: ${inst.status} | Paid: ₹${inst.paidAmount / 100}`);
    });

    if (installments.length !== 3) {
      throw new Error(`Expected 3 installments, found ${installments.length}`);
    }
    if (installments[0].status !== "PAID" || installments[0].paidAmount !== slotAmount * 100) {
      throw new Error(`Slot #1 should be fully PAID! Found ${installments[0].status}, paid: ${installments[0].paidAmount}`);
    }
    if (installments[1].status !== "PENDING" || installments[2].status !== "PENDING") {
      throw new Error(`Slot #2 and #3 should be PENDING!`);
    }
    console.log("[PASS] Installments schedule and initial payment allocation verified!");

    // 8. Verify Payment Transaction & Receipt Number
    const payment = await db.paymentTransaction.findFirst({
      where: { admissionId: result.application.id },
    });
    if (!payment) throw new Error("Payment transaction not recorded!");
    console.log("\n--- PAYMENT TRANSACTION & RECEIPT AUDIT ---");
    console.log(`Payment ID:             ${payment.id}`);
    console.log(`Status:                 ${payment.status}`);
    console.log(`Amount:                 ₹${payment.amount / 100}`);
    console.log(`Receipt Number:         ${payment.receiptNumber}`);
    console.log(`Transaction Reference:  ${payment.transactionReference}`);
    console.log(`Payment Method:         ${payment.paymentMethod}`);

    if (payment.status !== "SUCCESS") throw new Error("Payment status is not SUCCESS!");
    if (!payment.receiptNumber || !payment.receiptNumber.startsWith("SLG-")) {
      throw new Error(`Invalid receipt number: ${payment.receiptNumber}`);
    }
    if (payment.transactionReference !== "UPI-TEST-998877") {
      throw new Error("Transaction reference mismatch!");
    }
    console.log("[PASS] PaymentTransaction and unique SLG sequential receipt number verified!");

    // 9. Verify ReceiptService.getReceiptData
    const receiptData = await ReceiptService.getReceiptData(payment.id);
    console.log("\n--- DUAL FEE RECEIPT DATA AUDIT ---");
    console.log(`Company:          ${receiptData.company.name}`);
    console.log(`Address:          ${receiptData.company.address}`);
    console.log(`GSTIN:            ${receiptData.company.gstin}`);
    console.log(`Receipt Number:   ${receiptData.receiptNumber}`);
    console.log(`Student Name:     ${receiptData.student.name}`);
    console.log(`Student ID:       ${receiptData.student.studentId}`);
    console.log(`Course Title:     ${receiptData.course.title}`);
    console.log(`Amount Paid:      ₹${receiptData.financials.amountPaidPaise / 100}`);
    console.log(`Amount in Words:  "${receiptData.financials.amountInWords}"`);

    if (receiptData.financials.amountPaidPaise !== 1800000) {
      throw new Error("Receipt amount paid mismatch!");
    }
    if (!receiptData.financials.amountInWords.includes("Eighteen Thousand")) {
      throw new Error(`Amount in words mismatch: ${receiptData.financials.amountInWords}`);
    }
    console.log("[PASS] Full printable Dual Fee Receipt data generated accurately!");

    // 10. Clean up test records safely
    console.log("\nCleaning up test records...");
    await db.feeInstallment.deleteMany({ where: { feeStructureId: feeStructure.id } });
    await db.paymentTransaction.deleteMany({ where: { admissionId: result.application.id } });
    await db.studentIdCard.deleteMany({ where: { studentId: result.student.id } });
    await db.feeStructure.deleteMany({ where: { id: feeStructure.id } });
    await db.enrollment.deleteMany({ where: { studentId: result.student.id } });
    await db.admissionApplication.deleteMany({ where: { id: result.application.id } });
    await db.studentProfile.deleteMany({ where: { id: result.student.id } });
    await db.user.deleteMany({ where: { id: result.user.id } });
    await db.lead.deleteMany({ where: { id: lead.id } });
    console.log("[PASS] Test records cleanly purged from database.");

    console.log("\n=======================================================");
    console.log("SUCCESS: ALL ADMISSION, FEE, AND RECEIPT AUDITS PASSED!");
    console.log("=======================================================");
  } catch (err) {
    console.error("TEST FAILED:", err);
    // Cleanup lead if test failed
    try {
      await db.lead.delete({ where: { id: lead.id } });
    } catch {}
    process.exit(1);
  }
}

main().finally(() => db.$disconnect());
