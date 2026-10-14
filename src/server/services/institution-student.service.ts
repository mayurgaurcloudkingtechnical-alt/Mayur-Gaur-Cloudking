import { db } from "@/server/db/client";
import { TRPCError } from "@trpc/server";
import { AuthenticatedUser } from "@/server/auth/rbac";
import { AuditService } from "./audit.service";
import { UserRoleCode, Prisma } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { InstitutionPartnershipService } from "./institution-partnership.service";

export interface StudentRegistrationInput {
  institutionId?: string;
  fullName: string;
  email: string;
  mobile: string;
  gender?: string;
  dateOfBirth?: Date;
  address?: string;
  pincode?: string;
  guardianName?: string;
  guardianPhone?: string;
  
  courseName: string;
  department?: string;
  degreeType?: string;
  academicYear: string;
  admissionYear?: number;
  passingYear: number;
  currentSemester?: number;
  currentYear?: number;
  enrollmentNumber: string;
  rollNumber?: string;
  
  academicPercentage?: number;
  cgpa?: number;
  activeBacklogs?: number;
  historyBacklogs?: number;
  technicalSkills?: string[];
  preferredRole?: string;
  preferredLocation?: string;
  resumeUrl?: string;
  consentForRecruiters?: boolean;
  
  registrationFeeAmount?: number; // in Rupees
  feePaymentStatus?: "NOT_APPLICABLE" | "PENDING" | "PAID" | "WAIVED";
  paymentReference?: string;
}

export interface RawStudentImportRow {
  fullName: string;
  email: string;
  mobile: string;
  gender?: string;
  courseName: string;
  department?: string;
  degreeType?: string;
  academicYear: string;
  passingYear: string | number;
  enrollmentNumber: string;
  rollNumber?: string;
  currentSemester?: string | number;
  cgpa?: string | number;
  percentage?: string | number;
  activeBacklogs?: string | number;
  skills?: string;
  preferredRole?: string;
  preferredLocation?: string;
  feeAmount?: string | number;
}

export interface ValidatedStudentRow {
  index: number;
  data: RawStudentImportRow;
  isValid: boolean;
  errors: string[];
  isDuplicate: boolean;
}

export class InstitutionStudentService {
  /**
   * Helper to normalize mobile phone number
   */
  public static normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10) return `+91${digits}`;
    if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
    return digits ? `+${digits}` : "";
  }

  /**
   * Generates CSV template string for bulk import.
   */
  public static getCsvTemplate(): string {
    const headers = [
      "Enrollment Number*",
      "Roll Number",
      "Full Name*",
      "Email Address*",
      "Mobile Number*",
      "Gender",
      "Course / Program*",
      "Department",
      "Degree Type",
      "Academic Year*",
      "Passing Year*",
      "Current Semester",
      "CGPA",
      "Percentage",
      "Active Backlogs",
      "Technical Skills",
      "Preferred Role",
      "Preferred Location",
      "Registration Fee",
    ];

    const sampleRow = [
      "ENR-2026-1001",
      "CS-01",
      "Rahul Sharma",
      "rahul.sharma@example.edu",
      "9876543210",
      "Male",
      "B.Tech Computer Science",
      "Computer Science & Engineering",
      "B.Tech",
      "2022-2026",
      "2026",
      "7",
      "8.4",
      "84.0",
      "0",
      "Java; Python; React; SQL",
      "Software Development Engineer",
      "Noida / Remote",
      "0",
    ];

    return `${headers.join(",")}\n${sampleRow.join(",")}`;
  }

  /**
   * Manual Single Student Registration by College Administrator or Placement Officer.
   */
  public static async registerSingleStudent(user: AuthenticatedUser, input: StudentRegistrationInput) {
    const tenant = await InstitutionPartnershipService.getTenantInstitutionForUser(user);
    const targetInstitutionId = tenant ? tenant.id : input.institutionId;

    if (!targetInstitutionId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Institution ID is required for student registration.",
      });
    }

    const email = input.email.trim().toLowerCase();
    const phone = this.normalizePhone(input.mobile);
    const enrollmentNo = input.enrollmentNumber.trim();

    // Check duplicate enrollment number within this institution
    const existingEnrollment = await db.studentInstitutionEnrollment.findUnique({
      where: {
        institutionId_enrollmentNumber: {
          institutionId: targetInstitutionId,
          enrollmentNumber: enrollmentNo,
        },
      },
    });

    if (existingEnrollment) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `Student with enrollment number '${enrollmentNo}' is already registered in this institution.`,
      });
    }

    const rawPassword = "Student@2026";
    const passwordHash = await bcrypt.hash(rawPassword, 8);

    const result = await db.$transaction(
      async (tx) => {
        let studentUser = await tx.user.findFirst({
          where: {
            OR: [
              { email },
              ...(phone ? [{ phone }] : []),
            ],
          },
        });

        if (!studentUser) {
          const nameParts = input.fullName.trim().split(" ");
          const firstName = nameParts[0] || "Student";
          const lastName = nameParts.slice(1).join(" ") || "";

          let phoneToSet: string | null = null;
          if (phone) {
            const phoneOwner = await tx.user.findUnique({ where: { phone } });
            if (!phoneOwner) phoneToSet = phone;
          }

          studentUser = await tx.user.create({
            data: {
              email,
              phone: phoneToSet,
              passwordHash,
              firstName,
              lastName,
              roleCode: UserRoleCode.STUDENT,
            },
          });
        }

      // 2. Check or create StudentProfile
      let profile = await tx.studentProfile.findUnique({
        where: { userId: studentUser.id },
      });

      if (!profile) {
        const studentCount = await tx.studentProfile.count();
        const studentId = `SLG-CAMPUS-${String(studentCount + 1).padStart(5, "0")}`;

        profile = await tx.studentProfile.create({
          data: {
            userId: studentUser.id,
            studentId,
            gender: input.gender || null,
            dateOfBirth: input.dateOfBirth || null,
            address: input.address || null,
            pincode: input.pincode || null,
            guardianName: input.guardianName || null,
            guardianPhone: input.guardianPhone || null,
            schoolOrCollege: tenant?.name || "Partner College",
            passingYear: String(input.passingYear),
            percentageOrCgpa: input.cgpa ? String(input.cgpa) : input.academicPercentage ? String(input.academicPercentage) : null,
          },
        });
      }

      // 3. Create or update Placement Profile
      const skillsArray = input.technicalSkills || [];
      await tx.studentPlacementProfile.upsert({
        where: { studentId: profile.id },
        update: {
          skills: skillsArray,
          preferredRole: input.preferredRole || null,
          preferredLocation: input.preferredLocation || null,
          resumeUrl: input.resumeUrl || null,
        },
        create: {
          studentId: profile.id,
          skills: skillsArray,
          preferredRole: input.preferredRole || null,
          preferredLocation: input.preferredLocation || null,
          resumeUrl: input.resumeUrl || null,
          placementStatus: "REGISTERED",
        },
      });

      // 4. Create StudentInstitutionEnrollment
      const feeRupees = input.registrationFeeAmount || 0;
      const feePaise = feeRupees * 100;
      const initialPaymentStatus = input.feePaymentStatus || (feeRupees > 0 ? "PENDING" : "NOT_APPLICABLE");

      const enrollment = await tx.studentInstitutionEnrollment.create({
        data: {
          institutionId: targetInstitutionId,
          studentProfileId: profile.id,
          enrollmentNumber: enrollmentNo,
          rollNumber: input.rollNumber?.trim() || null,
          courseName: input.courseName.trim(),
          department: input.department?.trim() || null,
          degreeType: input.degreeType?.trim() || null,
          academicYear: input.academicYear.trim(),
          admissionYear: input.admissionYear || null,
          passingYear: input.passingYear,
          currentSemester: input.currentSemester || null,
          currentYear: input.currentYear || null,
          academicPercentage: input.academicPercentage || null,
          cgpa: input.cgpa || null,
          activeBacklogs: input.activeBacklogs || 0,
          historyBacklogs: input.historyBacklogs || 0,
          placementEligibility: (input.activeBacklogs || 0) === 0,
          ineligibilityReason: (input.activeBacklogs || 0) > 0 ? "Active backlogs present" : null,
          consentForRecruiters: input.consentForRecruiters ?? true,
          isProfileComplete: Boolean(profile.studentId && input.courseName && input.passingYear),
          registrationFeeAmount: feePaise,
          feeAmountPaid: 0,
          paymentStatus: initialPaymentStatus,
        },
      });

      // 5. If registration fee entered and payment details provided, record payment as PENDING
      if (feeRupees > 0 && input.paymentReference) {
        await tx.studentRegistrationPayment.create({
          data: {
            enrollmentId: enrollment.id,
            institutionId: targetInstitutionId,
            studentProfileId: profile.id,
            amount: feePaise,
            paymentMethod: "OFFLINE_COLLEGE",
            transactionReference: input.paymentReference,
            paymentStatus: "PENDING",
            notes: "Pending central verification by SoftLab Global accounts desk.",
          },
        });
      }

      return {
        enrollmentId: enrollment.id,
        studentId: profile.studentId,
      };
    },
    { timeout: 30000, maxWait: 15000 }
  );

  await AuditService.log({
    actorId: user.id,
    action: "STUDENT_ENROLLED_INSTITUTION",
    resourceType: "StudentInstitutionEnrollment",
    resourceId: result.enrollmentId,
    newData: {
      institutionId: targetInstitutionId,
      enrollmentNumber: enrollmentNo,
      studentEmail: email,
    },
  });

  return {
    success: true,
    enrollmentId: result.enrollmentId,
    studentId: result.studentId,
    message: "Student registered successfully.",
  };
  }

  /**
   * Bulk CSV / Excel Parser, Validation, and Transactional Importer.
   */
  public static async processBulkStudentImport(
    user: AuthenticatedUser,
    input: {
      institutionId?: string;
      fileName: string;
      csvContent: string;
    }
  ) {
    const tenant = await InstitutionPartnershipService.getTenantInstitutionForUser(user);
    const targetInstitutionId = tenant ? tenant.id : input.institutionId;

    if (!targetInstitutionId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Institution ID is required for bulk import.",
      });
    }

    const lines = input.csvContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "CSV file must contain at least a header row and one student data row.",
      });
    }

    // Parse header
    const headers = lines[0].split(",").map((h) => h.replace(/^["']|["']$/g, "").trim().toLowerCase());
    const findIndex = (keywords: string[]) =>
      headers.findIndex((h) => keywords.some((k) => h.includes(k)));

    const idxEnrollment = findIndex(["enrollment", "reg"]);
    const idxRoll = findIndex(["roll"]);
    const idxName = findIndex(["name", "student"]);
    const idxEmail = findIndex(["email", "mail"]);
    const idxPhone = findIndex(["phone", "mobile", "contact"]);
    const idxGender = findIndex(["gender"]);
    const idxCourse = findIndex(["course", "program"]);
    const idxDept = findIndex(["dept", "department", "branch"]);
    const idxDegree = findIndex(["degree"]);
    const idxAcadYear = findIndex(["academic", "batch"]);
    const idxPassingYear = findIndex(["passing", "grad"]);
    const idxSemester = findIndex(["sem", "semester"]);
    const idxCgpa = findIndex(["cgpa", "gpa"]);
    const idxPercentage = findIndex(["percent", "percentage"]);
    const idxBacklogs = findIndex(["backlog", "backlogs"]);
    const idxSkills = findIndex(["skill", "skills"]);
    const idxRole = findIndex(["role"]);
    const idxLocation = findIndex(["location", "city"]);

    const rows: ValidatedStudentRow[] = [];
    const seenEnrollments = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      // Split respecting potential quotes
      const rawCols = lines[i].split(",").map((c) => c.replace(/^["']|["']$/g, "").trim());
      if (rawCols.length < 3) continue;

      const enrollmentNo = idxEnrollment >= 0 ? rawCols[idxEnrollment] : "";
      const name = idxName >= 0 ? rawCols[idxName] : "";
      const email = idxEmail >= 0 ? rawCols[idxEmail] : "";
      const mobile = idxPhone >= 0 ? rawCols[idxPhone] : "";
      const course = idxCourse >= 0 ? rawCols[idxCourse] : "";
      const passingYearStr = idxPassingYear >= 0 ? rawCols[idxPassingYear] : "2026";
      const passingYear = parseInt(passingYearStr.replace(/\D/g, "")) || 2026;

      const errors: string[] = [];
      if (!enrollmentNo) errors.push("Missing Enrollment Number");
      if (!name) errors.push("Missing Full Name");
      if (!email || !email.includes("@")) errors.push("Invalid or missing Email");
      if (!mobile) errors.push("Missing Mobile Number");
      if (!course) errors.push("Missing Course/Program");

      let isDuplicate = false;
      if (enrollmentNo) {
        if (seenEnrollments.has(enrollmentNo.toLowerCase())) {
          isDuplicate = true;
          errors.push("Duplicate enrollment number in same file");
        } else {
          seenEnrollments.add(enrollmentNo.toLowerCase());
        }
      }

      rows.push({
        index: i,
        data: {
          enrollmentNumber: enrollmentNo,
          rollNumber: idxRoll >= 0 ? rawCols[idxRoll] : "",
          fullName: name,
          email,
          mobile,
          gender: idxGender >= 0 ? rawCols[idxGender] : "",
          courseName: course,
          department: idxDept >= 0 ? rawCols[idxDept] : "",
          degreeType: idxDegree >= 0 ? rawCols[idxDegree] : "",
          academicYear: idxAcadYear >= 0 ? rawCols[idxAcadYear] : "2022-2026",
          passingYear,
          currentSemester: idxSemester >= 0 ? rawCols[idxSemester] : "",
          cgpa: idxCgpa >= 0 ? rawCols[idxCgpa] : "",
          percentage: idxPercentage >= 0 ? rawCols[idxPercentage] : "",
          activeBacklogs: idxBacklogs >= 0 ? rawCols[idxBacklogs] : "0",
          skills: idxSkills >= 0 ? rawCols[idxSkills] : "",
          preferredRole: idxRole >= 0 ? rawCols[idxRole] : "",
          preferredLocation: idxLocation >= 0 ? rawCols[idxLocation] : "",
        },
        isValid: errors.length === 0,
        errors,
        isDuplicate,
      });
    }

    const validRows = rows.filter((r) => r.isValid);
    const invalidRows = rows.filter((r) => !r.isValid);

    let createdCount = 0;
    let duplicateDbCount = 0;
    let failedCount = 0;
    const errorReports: Array<{ row: number; enrollment: string; error: string }> = [];

    // Collect pre-validation errors
    for (const inv of invalidRows) {
      errorReports.push({
        row: inv.index,
        enrollment: inv.data.enrollmentNumber || "N/A",
        error: inv.errors.join("; "),
      });
    }

    const defaultBulkPasswordHash = await bcrypt.hash("Student@2026", 8);

    // Process valid rows
    for (const row of validRows) {
      try {
        const item = row.data;
        const normalizedEmail = item.email.toLowerCase();
        const normalizedPhone = this.normalizePhone(item.mobile);
        const passingYearInt = typeof item.passingYear === "number" ? item.passingYear : parseInt(item.passingYear) || 2026;
        const cgpaVal = item.cgpa ? parseFloat(String(item.cgpa)) : null;
        const percentageVal = item.percentage ? parseFloat(String(item.percentage)) : null;
        const backlogsInt = parseInt(String(item.activeBacklogs || 0)) || 0;
        const semInt = parseInt(String(item.currentSemester || 0)) || null;

        // Check if enrollment already exists in DB
        const exists = await db.studentInstitutionEnrollment.findUnique({
          where: {
            institutionId_enrollmentNumber: {
              institutionId: targetInstitutionId,
              enrollmentNumber: item.enrollmentNumber,
            },
          },
        });

        if (exists) {
          duplicateDbCount++;
          errorReports.push({
            row: row.index,
            enrollment: item.enrollmentNumber,
            error: "Already exists in database for this institution",
          });
          continue;
        }

        // Insert / link student
        await db.$transaction(
          async (tx) => {
            let userRecord = await tx.user.findFirst({
              where: {
                OR: [
                  { email: normalizedEmail },
                  ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
                ],
              },
            });

            if (!userRecord) {
              const nameParts = item.fullName.split(" ");
              let phoneToSet: string | null = null;
              if (normalizedPhone) {
                const phoneOwner = await tx.user.findUnique({ where: { phone: normalizedPhone } });
                if (!phoneOwner) phoneToSet = normalizedPhone;
              }

              userRecord = await tx.user.create({
                data: {
                  email: normalizedEmail,
                  phone: phoneToSet,
                  passwordHash: defaultBulkPasswordHash,
                  firstName: nameParts[0] || "Student",
                  lastName: nameParts.slice(1).join(" ") || "",
                  roleCode: UserRoleCode.STUDENT,
                },
              });
            }

          let profile = await tx.studentProfile.findUnique({
            where: { userId: userRecord.id },
          });

          if (!profile) {
            const count = await tx.studentProfile.count();
            const studentId = `SLG-CAMPUS-${String(count + 1).padStart(5, "0")}`;
            profile = await tx.studentProfile.create({
              data: {
                userId: userRecord.id,
                studentId,
                gender: item.gender || null,
                passingYear: String(passingYearInt),
                percentageOrCgpa: cgpaVal ? String(cgpaVal) : percentageVal ? String(percentageVal) : null,
              },
            });
          }

          const parsedSkills = item.skills ? item.skills.split(/[;,]/).map((s) => s.trim()).filter(Boolean) : [];
          await tx.studentPlacementProfile.upsert({
            where: { studentId: profile.id },
            update: {
              skills: parsedSkills.length ? parsedSkills : undefined,
              preferredRole: item.preferredRole || undefined,
              preferredLocation: item.preferredLocation || undefined,
            },
            create: {
              studentId: profile.id,
              skills: parsedSkills,
              preferredRole: item.preferredRole || null,
              preferredLocation: item.preferredLocation || null,
              placementStatus: "REGISTERED",
            },
          });

          await tx.studentInstitutionEnrollment.create({
            data: {
              institutionId: targetInstitutionId,
              studentProfileId: profile.id,
              enrollmentNumber: item.enrollmentNumber,
              rollNumber: item.rollNumber || null,
              courseName: item.courseName,
              department: item.department || null,
              degreeType: item.degreeType || null,
              academicYear: item.academicYear || "2022-2026",
              passingYear: passingYearInt,
              currentSemester: semInt,
              cgpa: cgpaVal,
              academicPercentage: percentageVal,
              activeBacklogs: backlogsInt,
              placementEligibility: backlogsInt === 0,
              ineligibilityReason: backlogsInt > 0 ? "Active backlogs present" : null,
              consentForRecruiters: true,
              isProfileComplete: true,
              paymentStatus: "NOT_APPLICABLE",
            },
          });
        },
        { timeout: 30000, maxWait: 15000 }
      );

        createdCount++;
      } catch (err: any) {
        failedCount++;
        errorReports.push({
          row: row.index,
          enrollment: row.data.enrollmentNumber,
          error: err?.message || "Internal database transaction error",
        });
      }
    }

    // Record import job record
    const importJob = await db.studentImportJob.create({
      data: {
        institutionId: targetInstitutionId,
        uploadedById: user.id,
        fileName: input.fileName,
        totalRecords: rows.length,
        validRecords: validRows.length,
        invalidRecords: invalidRows.length,
        duplicateRecords: duplicateDbCount,
        createdRecords: createdCount,
        failedRecords: failedCount,
        status: failedCount > 0 && createdCount === 0 ? "FAILED" : "COMPLETED",
        errorReport: errorReports,
      },
    });

    return {
      success: true,
      importJobId: importJob.id,
      summary: {
        totalRows: rows.length,
        created: createdCount,
        duplicates: duplicateDbCount,
        invalid: invalidRows.length,
        failed: failedCount,
      },
      errorReports,
    };
  }

  /**
   * Filterable student roster (Tenant Scoped).
   */
  public static async listStudents(
    user: AuthenticatedUser,
    params?: {
      institutionId?: string;
      courseName?: string;
      passingYear?: number;
      eligibility?: boolean;
      search?: string;
      page?: number;
      pageSize?: number;
    }
  ) {
    const tenant = await InstitutionPartnershipService.getTenantInstitutionForUser(user);
    const targetInstitutionId = tenant ? tenant.id : params?.institutionId;

    const page = Math.max(1, params?.page || 1);
    const pageSize = Math.min(100, Math.max(1, params?.pageSize || 25));
    const skip = (page - 1) * pageSize;

    const where: Prisma.StudentInstitutionEnrollmentWhereInput = {};

    if (targetInstitutionId) {
      where.institutionId = targetInstitutionId;
    }

    if (params?.courseName) {
      where.courseName = { contains: params.courseName, mode: "insensitive" };
    }

    if (params?.passingYear) {
      where.passingYear = params.passingYear;
    }

    if (params?.eligibility !== undefined) {
      where.placementEligibility = params.eligibility;
    }

    if (params?.search) {
      const q = params.search.trim();
      where.OR = [
        { enrollmentNumber: { contains: q, mode: "insensitive" } },
        { rollNumber: { contains: q, mode: "insensitive" } },
        { courseName: { contains: q, mode: "insensitive" } },
        {
          student: {
            user: {
              OR: [
                { firstName: { contains: q, mode: "insensitive" } },
                { lastName: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
              ],
            },
          },
        },
      ];
    }

    const [total, items] = await Promise.all([
      db.studentInstitutionEnrollment.count({ where }),
      db.studentInstitutionEnrollment.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          institution: { select: { id: true, name: true, code: true, city: true } },
          student: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
              placementProfile: true,
            },
          },
          payments: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Verify Student Registration Payment (Admin / Accountant Workflow).
   */
  public static async verifyPayment(
    user: AuthenticatedUser,
    input: {
      paymentId: string;
      decision: "VERIFY" | "REJECT" | "WAIVE";
      notes?: string;
    }
  ) {
    InstitutionPartnershipService.checkGlobalAdmin(user);

    const payment = await db.studentRegistrationPayment.findUnique({
      where: { id: input.paymentId },
      include: { enrollment: true },
    });

    if (!payment) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Payment record not found." });
    }

    const newPaymentStatus =
      input.decision === "VERIFY" ? "VERIFIED" : input.decision === "WAIVE" ? "WAIVED" : "REJECTED";

    const enrollmentStatus =
      input.decision === "VERIFY" ? "PAID" : input.decision === "WAIVE" ? "WAIVED" : "FAILED";

    await db.$transaction(async (tx) => {
      await tx.studentRegistrationPayment.update({
        where: { id: input.paymentId },
        data: {
          paymentStatus: newPaymentStatus,
          verifiedById: user.id,
          verifiedAt: new Date(),
          notes: input.notes || payment.notes,
        },
      });

      await tx.studentInstitutionEnrollment.update({
        where: { id: payment.enrollmentId },
        data: {
          paymentStatus: enrollmentStatus,
          feeAmountPaid: input.decision === "VERIFY" ? payment.amount : 0,
        },
      });
    });

    await AuditService.log({
      actorId: user.id,
      action: `STUDENT_PAYMENT_${newPaymentStatus}`,
      resourceType: "StudentRegistrationPayment",
      resourceId: input.paymentId,
      newData: { decision: input.decision, notes: input.notes },
    });

    return {
      success: true,
      message: `Payment successfully marked as ${newPaymentStatus}.`,
    };
  }
}
