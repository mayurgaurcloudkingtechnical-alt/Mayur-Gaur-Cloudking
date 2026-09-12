import { db } from "@/server/db/client";
import { ExamType, ExamStatus, Prisma } from "@prisma/client";
import { AuthenticatedUser } from "@/server/auth/rbac";
import { TRPCError } from "@trpc/server";

export interface CreateExamInput {
  title: string;
  slug?: string;
  description?: string;
  instructions?: string;
  courseId: string;
  moduleId?: string;
  type?: ExamType;
  durationMinutes: number;
  totalMarks: number;
  passingPercentage: number;
  negativeMarking?: boolean;
  negativeMarksPerQuestion?: number;
  randomizeQuestions?: boolean;
  maxAttempts?: number;
  allowReview?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface UpdateExamInput {
  id: string;
  title?: string;
  description?: string;
  instructions?: string;
  durationMinutes?: number;
  totalMarks?: number;
  passingPercentage?: number;
  negativeMarking?: boolean;
  negativeMarksPerQuestion?: number;
  randomizeQuestions?: boolean;
  maxAttempts?: number;
  allowReview?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export class ExamService {
  private static checkCanManage(user: AuthenticatedUser) {
    const isSuperOrAdmin =
      user.roleCode === "SUPER_ADMIN" ||
      user.roleCode === "ADMIN" ||
      user.roleCode === "DIRECTOR";
    const isTrainer = user.roleCode === "TRAINER";
    if (!isSuperOrAdmin && !isTrainer) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permissions to manage examinations.",
      });
    }
  }

  static async createExam(user: AuthenticatedUser, data: CreateExamInput) {
    this.checkCanManage(user);

    if (data.passingPercentage > 100 || data.passingPercentage < 1) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Passing percentage must be between 1 and 100.",
      });
    }
    if (data.durationMinutes < 1) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Duration must be at least 1 minute.",
      });
    }

    // Validate course exists
    const course = await db.course.findUnique({ where: { id: data.courseId } });
    if (!course) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Course not found." });
    }

    // If moduleId provided, validate relationship
    if (data.moduleId) {
      const mod = await db.module.findFirst({
        where: { id: data.moduleId, courseId: data.courseId },
      });
      if (!mod) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Module does not belong to the selected course.",
        });
      }
    }

    return db.exam.create({
      data: {
        title: data.title.trim(),
        slug: data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description: data.description,
        instructions: data.instructions,
        courseId: data.courseId,
        moduleId: data.moduleId || null,
        type: data.type || ExamType.MODULE_QUIZ,
        durationMinutes: data.durationMinutes,
        totalMarks: data.totalMarks,
        passingPercentage: data.passingPercentage,
        negativeMarking: data.negativeMarking ?? false,
        negativeMarksPerQuestion: data.negativeMarksPerQuestion ?? 0,
        randomizeQuestions: data.randomizeQuestions ?? false,
        maxAttempts: data.maxAttempts ?? 3,
        allowReview: data.allowReview ?? true,
        startDate: data.startDate,
        endDate: data.endDate,
        createdById: user.id,
        status: ExamStatus.DRAFT,
      },
      include: {
        course: { select: { id: true, title: true } },
        module: { select: { id: true, title: true } },
      },
    });
  }

  static async updateExam(user: AuthenticatedUser, data: UpdateExamInput) {
    this.checkCanManage(user);

    const existing = await db.exam.findUnique({ where: { id: data.id } });
    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Exam not found" });
    }

    return db.exam.update({
      where: { id: data.id },
      data: {
        ...(data.title !== undefined && { title: data.title.trim() }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.instructions !== undefined && { instructions: data.instructions }),
        ...(data.durationMinutes !== undefined && { durationMinutes: data.durationMinutes }),
        ...(data.totalMarks !== undefined && { totalMarks: data.totalMarks }),
        ...(data.passingPercentage !== undefined && { passingPercentage: data.passingPercentage }),
        ...(data.negativeMarking !== undefined && { negativeMarking: data.negativeMarking }),
        ...(data.negativeMarksPerQuestion !== undefined && {
          negativeMarksPerQuestion: data.negativeMarksPerQuestion,
        }),
        ...(data.randomizeQuestions !== undefined && {
          randomizeQuestions: data.randomizeQuestions,
        }),
        ...(data.maxAttempts !== undefined && { maxAttempts: data.maxAttempts }),
        ...(data.allowReview !== undefined && { allowReview: data.allowReview }),
        ...(data.startDate !== undefined && { startDate: data.startDate }),
        ...(data.endDate !== undefined && { endDate: data.endDate }),
      },
    });
  }

  static async updateStatus(user: AuthenticatedUser, id: string, status: ExamStatus) {
    this.checkCanManage(user);

    const exam = await db.exam.findUnique({
      where: { id },
      include: { questions: true },
    });
    if (!exam) throw new TRPCError({ code: "NOT_FOUND", message: "Exam not found" });

    if (status === ExamStatus.PUBLISHED && exam.questions.length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot publish an examination without at least one question.",
      });
    }

    return db.exam.update({
      where: { id },
      data: { status },
    });
  }

  static async addQuestionsToExam(
    user: AuthenticatedUser,
    examId: string,
    questionEntries: { questionId: string; marks?: number; sortOrder?: number }[]
  ) {
    this.checkCanManage(user);

    const exam = await db.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new TRPCError({ code: "NOT_FOUND", message: "Exam not found" });

    // Validate questions belong to the course
    const qIds = questionEntries.map((q) => q.questionId);
    const validQuestions = await db.questionBank.findMany({
      where: { id: { in: qIds }, courseId: exam.courseId },
      select: { id: true },
    });

    if (validQuestions.length !== qIds.length) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "One or more questions do not belong to the exam's course.",
      });
    }

    await db.$transaction(
      questionEntries.map((entry, idx) =>
        db.examQuestion.upsert({
          where: {
            examId_questionId: {
              examId,
              questionId: entry.questionId,
            },
          },
          update: {
            marksOverride: entry.marks,
            sortOrder: entry.sortOrder ?? idx + 1,
          },
          create: {
            examId,
            questionId: entry.questionId,
            marksOverride: entry.marks,
            sortOrder: entry.sortOrder ?? idx + 1,
          },
        })
      )
    );

    const questions = await db.examQuestion.findMany({
      where: { examId },
      include: { question: true },
    });

    const totalAssignedMarks = questions.reduce(
      (sum: number, eq: { marksOverride: number | null; question: { marks: number } }) =>
        sum + (eq.marksOverride !== null ? eq.marksOverride : eq.question.marks),
      0
    );

    return db.exam.update({
      where: { id: examId },
      data: { totalMarks: totalAssignedMarks },
    });
  }

  static async removeQuestionFromExam(
    user: AuthenticatedUser,
    examId: string,
    questionId: string
  ) {
    this.checkCanManage(user);

    await db.examQuestion.delete({
      where: {
        examId_questionId: {
          examId,
          questionId,
        },
      },
    });

    const questions = await db.examQuestion.findMany({
      where: { examId },
      include: { question: true },
    });

    const totalAssignedMarks = questions.reduce(
      (sum: number, eq: { marksOverride: number | null; question: { marks: number } }) =>
        sum + (eq.marksOverride !== null ? eq.marksOverride : eq.question.marks),
      0
    );

    return db.exam.update({
      where: { id: examId },
      data: { totalMarks: totalAssignedMarks },
    });
  }

  static async getExamById(id: string, includeQuestions = true) {
    return db.exam.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true } },
        module: { select: { id: true, title: true } },
        questions: includeQuestions
          ? {
              orderBy: { sortOrder: "asc" },
              include: { question: true },
            }
          : false,
      },
    });
  }

  static async getStudentExamView(examId: string, studentUserId: string) {
    const studentProfile = await db.studentProfile.findFirst({
      where: { userId: studentUserId },
    });

    if (!studentProfile) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Student profile not found.",
      });
    }

    const exam = await db.exam.findUnique({
      where: { id: examId },
      include: {
        course: { select: { id: true, title: true } },
        module: { select: { id: true, title: true } },
        questions: {
          orderBy: { sortOrder: "asc" },
          include: {
            question: {
              select: {
                id: true,
                questionText: true,
                type: true,
                options: true,
                marks: true,
                // Never select correctAnswer or explanation
              },
            },
          },
        },
      },
    });

    if (!exam || exam.status !== ExamStatus.PUBLISHED) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Exam is not available or published.",
      });
    }

    // Enforce active enrollment before providing exam questions
    const enrollment = await db.enrollment.findFirst({
      where: {
        studentId: studentProfile.id,
        courseId: exam.courseId,
        status: "ACTIVE",
      },
    });

    if (!enrollment) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not actively enrolled in this course.",
      });
    }

    const attemptCount = await db.examAttempt.count({
      where: {
        examId,
        studentId: studentProfile.id,
        status: { not: "ABANDONED" },
      },
    });

    return {
      exam,
      attemptCount,
      canAttempt: attemptCount < exam.maxAttempts,
    };
  }

  static async listExamsForAdmin(user: AuthenticatedUser, courseId?: string) {
    this.checkCanManage(user);

    return db.exam.findMany({
      where: courseId ? { courseId } : undefined,
      include: {
        course: { select: { id: true, title: true } },
        module: { select: { id: true, title: true } },
        _count: { select: { questions: true, attempts: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async listExamsForStudent(studentUserId: string, courseId?: string) {
    const studentProfile = await db.studentProfile.findFirst({
      where: { userId: studentUserId },
    });

    if (!studentProfile) return [];

    const enrollments = await db.enrollment.findMany({
      where: {
        studentId: studentProfile.id,
        status: "ACTIVE",
        ...(courseId ? { courseId } : {}),
      },
      select: { courseId: true },
    });

    const courseIds = enrollments.map((e: { courseId: string }) => e.courseId);

    const exams = await db.exam.findMany({
      where: {
        courseId: { in: courseIds },
        status: ExamStatus.PUBLISHED,
      },
      include: {
        course: { select: { id: true, title: true } },
        module: { select: { id: true, title: true } },
        attempts: {
          where: { studentId: studentProfile.id },
          orderBy: { attemptNumber: "desc" },
          take: 1,
          select: {
            id: true,
            status: true,
            finalScore: true,
            percentage: true,
            isPassed: true,
            attemptNumber: true,
            startedAt: true,
            submittedAt: true,
          },
        },
        _count: {
          select: {
            attempts: {
              where: { studentId: studentProfile.id },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return exams.map((exam) => ({
      ...exam,
      userAttemptCount: exam._count.attempts,
      latestAttempt: exam.attempts[0] || null,
      canAttempt: exam._count.attempts < exam.maxAttempts,
    }));
  }
}