import { db } from "../src/server/db/client";
import * as bcrypt from "bcryptjs";
import { UserRoleCode, BatchStatus, DeliveryMode, EnrollmentStatus, FeePaymentStatus, FeeStructureStatus, InstallmentStatus, PaymentMethod, PaymentTransactionStatus } from "@prisma/client";

async function main() {
  console.log("==> Starting student provisioning for Srishti Sharma...");

  const studentRole = await db.role.findUnique({
    where: { code: UserRoleCode.STUDENT },
  });
  if (!studentRole) {
    throw new Error("STUDENT role not found in database.");
  }

  const course = await db.course.findFirst({
    where: {
      OR: [
        { slug: "ai-ml-complete-course-master-level" },
        { title: { contains: "AI & ML" } },
      ],
    },
  });

  if (!course) {
    throw new Error("AI & ML course not found in database.");
  }
  console.log(`✓ Found Course: ${course.title} (ID: ${course.id})`);

  let batch = await db.batch.findFirst({
    where: {
      courseId: course.id,
      code: "AIML-2026-B1",
    },
  });

  if (!batch) {
    batch = await db.batch.create({
      data: {
        courseId: course.id,
        code: "AIML-2026-B1",
        name: "AI & ML Master Cohort 2026 (Prayagraj)",
        startDate: new Date("2026-09-15T10:00:00Z"),
        status: BatchStatus.ONGOING,
        maxCapacity: 25,
        deliveryMode: DeliveryMode.OFFLINE,
        location: "Lab 2, Tashkent Marg, Civil Lines, Prayagraj",
      },
    });
    console.log(`✓ Created Active Batch: ${batch.code} - ${batch.name}`);
  } else {
    console.log(`✓ Found Batch: ${batch.code}`);
  }

  const studentEmail = "srishti.sharma@softlabglobal.com";
  const rawPassword = "Password@123";
  const passwordHash = await bcrypt.hash(rawPassword, 12);

  let user = await db.user.findUnique({
    where: { email: studentEmail },
  });

  if (!user) {
    user = await db.user.create({
      data: {
        email: studentEmail,
        passwordHash,
        firstName: "Srishti",
        lastName: "Sharma",
        roleCode: UserRoleCode.STUDENT,
        emailVerifiedAt: new Date(),
        phone: "+91-9876543210",
      },
    });
    console.log(`✓ Created User Account: ${user.email}`);
  } else {
    user = await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        firstName: "Srishti",
        lastName: "Sharma",
      },
    });
    console.log(`✓ Updated User Account: ${user.email}`);
  }

  let studentProfile = await db.studentProfile.findUnique({
    where: { userId: user.id },
  });

  if (!studentProfile) {
    studentProfile = await db.studentProfile.create({
      data: {
        userId: user.id,
        studentId: "SLG-2026-AIML-001",
        city: "Prayagraj",
        state: "Uttar Pradesh",
        highestDegree: "B.Tech / Graduate",
      },
    });
    console.log(`✓ Created StudentProfile: ID ${studentProfile.studentId}`);
  } else {
    console.log(`✓ Found StudentProfile: ID ${studentProfile.studentId}`);
  }

  let enrollment = await db.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId: studentProfile.id,
        courseId: course.id,
      },
    },
  });

  if (!enrollment) {
    enrollment = await db.enrollment.create({
      data: {
        studentId: studentProfile.id,
        courseId: course.id,
        batchId: batch.id,
        status: EnrollmentStatus.ACTIVE,
      },
    });
    console.log(`✓ Created Enrollment: ${enrollment.id}`);
  } else {
    enrollment = await db.enrollment.update({
      where: { id: enrollment.id },
      data: {
        batchId: batch.id,
        status: EnrollmentStatus.ACTIVE,
      },
    });
    console.log(`✓ Updated Enrollment: ${enrollment.id}`);
  }

  const totalFeePaise = 90000 * 100;
  const downPaymentPaise = 5000 * 100;
  const remainingPaise = 85000 * 100;

  let feeStructure = await db.feeStructure.findUnique({
    where: { enrollmentId: enrollment.id },
  });

  if (!feeStructure) {
    feeStructure = await db.feeStructure.create({
      data: {
        studentId: studentProfile.id,
        enrollmentId: enrollment.id,
        courseId: course.id,
        batchId: batch.id,
        totalCourseFee: totalFeePaise,
        registrationFee: 0,
        discountAmount: 0,
        scholarshipAmount: 0,
        netPayableAmount: totalFeePaise,
        paidAmount: downPaymentPaise,
        pendingAmount: remainingPaise,
        paymentStatus: FeePaymentStatus.PARTIAL,
        status: FeeStructureStatus.ACTIVE,
        remarks: "Down Payment of ₹5,000 received. Balance ₹85,000 in scheduled installments.",
      },
    });
    console.log(`✓ Created FeeStructure: Net ₹90,000 | Paid ₹5,000 | Pending ₹85,000`);
  } else {
    feeStructure = await db.feeStructure.update({
      where: { id: feeStructure.id },
      data: {
        totalCourseFee: totalFeePaise,
        netPayableAmount: totalFeePaise,
        paidAmount: downPaymentPaise,
        pendingAmount: remainingPaise,
        paymentStatus: FeePaymentStatus.PARTIAL,
        status: FeeStructureStatus.ACTIVE,
        remarks: "Down Payment of ₹5,000 received. Balance ₹85,000 in scheduled installments.",
      },
    });
    console.log(`✓ Updated FeeStructure: Net ₹90,000 | Paid ₹5,000 | Pending ₹85,000`);
  }

  await db.paymentTransaction.deleteMany({
    where: { feeStructureId: feeStructure.id },
  });
  await db.feeInstallment.deleteMany({
    where: { feeStructureId: feeStructure.id },
  });

  const inst1 = await db.feeInstallment.create({
    data: {
      feeStructureId: feeStructure.id,
      installmentNumber: 1,
      amount: downPaymentPaise,
      paidAmount: downPaymentPaise,
      dueDate: new Date(),
      status: InstallmentStatus.PAID,
      notes: "Seat Confirmation / Initial Down Payment",
      paidAt: new Date(),
    },
  });

  const inst2DueDate = new Date();
  inst2DueDate.setDate(inst2DueDate.getDate() + 30);
  await db.feeInstallment.create({
    data: {
      feeStructureId: feeStructure.id,
      installmentNumber: 2,
      amount: 42500 * 100,
      paidAmount: 0,
      dueDate: inst2DueDate,
      status: InstallmentStatus.PENDING,
      notes: "First Milestone Installment (Month 1)",
    },
  });

  const inst3DueDate = new Date();
  inst3DueDate.setDate(inst3DueDate.getDate() + 60);
  await db.feeInstallment.create({
    data: {
      feeStructureId: feeStructure.id,
      installmentNumber: 3,
      amount: 42500 * 100,
      paidAmount: 0,
      dueDate: inst3DueDate,
      status: InstallmentStatus.PENDING,
      notes: "Final Balance Installment (Month 2)",
    },
  });

  console.log(`✓ Seeded 3 Installments: ₹5,000 (PAID), ₹42,500 (PENDING), ₹42,500 (PENDING)`);

  const payment = await db.paymentTransaction.create({
    data: {
      transactionReference: "PAY-2026-SRISHTI-01",
      feeStructureId: feeStructure.id,
      installmentId: inst1.id,
      studentId: studentProfile.id,
      enrollmentId: enrollment.id,
      amount: downPaymentPaise,
      paymentDate: new Date(),
      paymentMethod: PaymentMethod.UPI,
      status: PaymentTransactionStatus.SUCCESS,
      providerReference: "UPI-ICICI-94085890-001",
      remarks: "Down Payment for AI & ML Master Course Seat Confirmation",
      receiptNumber: "REC-2026-AIML-001",
      paidAt: new Date(),
    },
  });

  console.log(`✓ Created Payment Transaction: ${payment.transactionReference} (₹5,000 SUCCESS)`);

  console.log("================================================================================");
  console.log("   STUDENT LOGIN & ENROLLMENT PROVISIONED SUCCESSFULLY!");
  console.log("   Email:       " + studentEmail);
  console.log("   Password:    " + rawPassword);
  console.log("   Student ID:  " + studentProfile.studentId);
  console.log("   Course:      " + course.title);
  console.log("   Total Fee:   ₹90,000");
  console.log("   Paid:        ₹5,000 (Down Payment)");
  console.log("   Remaining:   ₹85,000 (Pending Balance)");
  console.log("================================================================================");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Error provisioning student:", e);
    process.exit(1);
  });
