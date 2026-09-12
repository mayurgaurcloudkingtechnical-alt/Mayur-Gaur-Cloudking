import { db } from "@/server/db/client";
import { AttemptStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { ResultEngineService, ScoreQuestionInput } from "./result-engine.service";
import { CourseCompletionService } from "./course-completion.service";

export interface StartAttemptInput {
  examId: string;
  studentUserId: string;
}

export interface SaveAnswerInput {
  attemptId: string;
  studentUserId: string;
  questionId: string;
  selectedAnswer: string | null;
  isMarkedForReview?: boolean;
}

export interface SubmitAttemptInput {
  attemptId: string;
  studentUserId: string;
  isTimeoutAutoSubmit?: boolean;
}

export class ExamAttemptService {
  /**
   * Starts or resumes an exam attempt verifying enrollment, exam status, and attempt limits.
   * Includes existing saved answers to properly restore state on resume.
   */
  static async startAttempt({ examId, studentUserId }: StartAttemptInput) {
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
        questions: {
          orderBy: { sortOrder: "asc" },
          include: { question: true },
        },
      },
    });

    if (!exam || exam.status !== "PUBLISHED") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Exam is not available or published.",
      });
    }

    // Verify active enrollment in the exam's course
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

    // Check existing in-progress attempt
    const activeAttempt = await db.examAttempt.findFirst({
      where: {
        examId,
        studentId: studentProfile.id,
        status: AttemptStatus.IN_PROGRESS,
      },
      include: {
        answers: true,
      },
    });

    if (activeAttempt) {
      // Check if time expired already
      const elapsedMinutes =
        (Date.now() - new Date(activeAttempt.startedAt).getTime()) / (1000 * 60);
      if (elapsedMinutes > exam.durationMinutes) {
        // Auto-submit expired attempt cleanly
        return this.submitAttempt({
          attemptId: activeAttempt.id,
          studentUserId,
          isTimeoutAutoSubmit: true,
        });
      }
      return activeAttempt;
    }

    // Check completed attempts
    const completedAttemptsCount = await db.examAttempt.count({
      where: {
        examId,
        studentId: studentProfile.id,
        status: { in: [AttemptStatus.SUBMITTED, AttemptStatus.EVALUATED] },
      },
    });

    if (completedAttemptsCount >= exam.maxAttempts) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Maximum attempts (${exam.maxAttempts}) reached for this exam.`,
      });
    }

    const nextAttemptNumber = completedAttemptsCount + 1;

    return db.examAttempt.create({
      data: {
        examId,
        studentId: studentProfile.id,
        enrollmentId: enrollment.id,
        attemptNumber: nextAttemptNumber,
        status: AttemptStatus.IN_PROGRESS,
        startedAt: new Date(),
        totalQuestions: exam.questions.length,
      },
      include: {
        answers: true,
      },
    });
  }

  /**
   * Autosaves a student's answer or updates mark-for-review flag with strict timer and ownership validation.
   */
  static async saveAnswer({
    attemptId,
    studentUserId,
    questionId,
    selectedAnswer,
    isMarkedForReview,
  }: SaveAnswerInput) {
    const studentProfile = await db.studentProfile.findFirst({
      where: { userId: studentUserId },
    });

    if (!studentProfile) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Student profile not found." });
    }

    const attempt = await db.examAttempt.findFirst({
      where: { id: attemptId, studentId: studentProfile.id, status: AttemptStatus.IN_PROGRESS },
      include: { exam: true },
    });

    if (!attempt) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Active exam attempt not found or already submitted.",
      });
    }

    // Server-side expiry validation: 60s tolerance for network latency
    const elapsedSeconds =
      (Date.now() - new Date(attempt.startedAt).getTime()) / 1000;
    const maxAllowedSeconds = attempt.exam.durationMinutes * 60 + 60;
    if (elapsedSeconds > maxAllowedSeconds) {
      // Auto-submit expired attempt and reject late answer
      await this.submitAttempt({
        attemptId,
        studentUserId,
        isTimeoutAutoSubmit: true,
      });
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Exam duration has expired. Attempt has been automatically submitted.",
      });
    }

    // Verify questionId belongs to this exam
    const examQuestion = await db.examQuestion.findUnique({
      where: {
        examId_questionId: {
          examId: attempt.examId,
          questionId,
        },
      },
    });

    if (!examQuestion) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Question does not belong to this exam.",
      });
    }

    return db.examAnswer.upsert({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId,
        },
      },
      update: {
        selectedAnswer,
        ...(isMarkedForReview !== undefined ? { isMarkedForReview } : {}),
      },
      create: {
        attemptId,
        questionId,
        selectedAnswer,
        isMarkedForReview: isMarkedForReview ?? false,
      },
    });
  }

  /**
   * Submits an exam attempt, grades answers server-side, and is strictly idempotent against double submissions.
   */
  static async submitAttempt({
    attemptId,
    studentUserId,
    isTimeoutAutoSubmit = false,
  }: SubmitAttemptInput) {
    const studentProfile = await db.studentProfile.findFirst({
      where: { userId: studentUserId },
    });

    if (!studentProfile) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Student profile not found." });
    }

    const attempt = await db.examAttempt.findFirst({
      where: { id: attemptId, studentId: studentProfile.id },
      include: {
        exam: {
          include: {
            questions: {
              include: { question: true },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Attempt not found." });
    }

    // Idempotent return if already evaluated or submitted
    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      return attempt;
    }

    const { exam, answers } = attempt;

    const answerMap = new Map<string, { option: string | null; answerId: string }>();
    for (const a of answers) {
      answerMap.set(a.questionId, { option: a.selectedAnswer, answerId: a.id });
    }

    const scoreItems: ScoreQuestionInput[] = exam.questions.map((eq: any) => {
      const recorded = answerMap.get(eq.questionId);
      const marks = eq.marksOverride !== null ? eq.marksOverride : eq.question.marks;
      const negativeMarks =
        eq.negativeMarksOverride !== null
          ? eq.negativeMarksOverride
          : exam.negativeMarksPerQuestion;

      return {
        questionId: eq.questionId,
        userAnswer: recorded?.option ?? null,
        correctAnswer: eq.question.correctAnswer,
        marks,
        negativeMarking: exam.negativeMarking,
        negativeMarksPerQ: negativeMarks,
      };
    });

    const passingMarks = (exam.totalMarks * exam.passingPercentage) / 100;

    const evaluation = ResultEngineService.evaluateAnswers(
      scoreItems,
      passingMarks,
      exam.totalMarks
    );

    const timeTakenSeconds = Math.round(
      (Date.now() - new Date(attempt.startedAt).getTime()) / 1000
    );

    const updatedAttempt = await db.$transaction(async (tx: any) => {
      for (const item of evaluation.details) {
        const existing = answerMap.get(item.questionId);
        if (existing) {
          await tx.examAnswer.update({
            where: { id: existing.answerId },
            data: {
              isCorrect: item.isCorrect,
              marksAwarded: item.marksAwarded,
            },
          });
        } else {
          await tx.examAnswer.create({
            data: {
              attemptId,
              questionId: item.questionId,
              selectedAnswer: null,
              isCorrect: false,
              marksAwarded: item.marksAwarded,
            },
          });
        }
      }

      return tx.examAttempt.update({
        where: { id: attemptId },
        data: {
          status: isTimeoutAutoSubmit ? AttemptStatus.EVALUATED : AttemptStatus.EVALUATED,
          submittedAt: new Date(),
          timeTakenSeconds,
          attemptedQuestions: evaluation.attemptedQuestions,
          correctAnswers: evaluation.correctCount,
          incorrectAnswers: evaluation.incorrectCount,
          unansweredQuestions: evaluation.unansweredCount,
          rawScore: evaluation.totalMarksEarned,
          finalScore: evaluation.totalMarksEarned,
          percentage: evaluation.percentage,
          isPassed: evaluation.passed,
        },
      });
    });

    if (evaluation.passed) {
      try {
        await CourseCompletionService.evaluateCompletion(studentUserId, exam.courseId);
      } catch (err) {
        console.error("Course completion evaluation error:", err);
      }
    }

    return updatedAttempt;
  }

  static async getAttemptDetails(attemptId: string, studentUserId?: string) {
    let studentId: string | undefined = undefined;
    if (studentUserId) {
      const sp = await db.studentProfile.findFirst({ where: { userId: studentUserId } });
      if (sp) studentId = sp.id;
    }

    return db.examAttempt.findFirst({
      where: {
        id: attemptId,
        ...(studentId ? { studentId } : {}),
      },
      include: {
        exam: {
          include: {
            course: { select: { id: true, title: true } },
            module: { select: { id: true, title: true } },
            questions: {
              orderBy: { sortOrder: "asc" },
              include: { question: true },
            },
          },
        },
        answers: {
          include: { question: true },
        },
        student: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
      },
    });
  }

  static async listStudentAttempts(studentUserId: string, examId?: string) {
    const studentProfile = await db.studentProfile.findFirst({
      where: { userId: studentUserId },
    });

    if (!studentProfile) return [];

    return db.examAttempt.findMany({
      where: {
        studentId: studentProfile.id,
        ...(examId ? { examId } : {}),
      },
      include: {
        exam: {
          include: {
            course: { select: { id: true, title: true } },
            module: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { startedAt: "desc" },
    });
  }
}