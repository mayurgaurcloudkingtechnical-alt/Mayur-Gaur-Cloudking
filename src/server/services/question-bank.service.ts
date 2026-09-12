import { db } from "@/server/db/client";
import { TRPCError } from "@trpc/server";
import { AuthenticatedUser, hasPermission } from "@/server/auth/rbac";
import { AuditService } from "./audit.service";
import { QuestionType, Prisma } from "@prisma/client";

export interface CreateQuestionInput {
  courseId: string;
  moduleId?: string;
  questionText: string;
  type?: QuestionType;
  options: Array<{ id: string; text: string }>;
  correctAnswer: string;
  marks?: number;
  negativeMarks?: number;
  difficulty?: string;
  topic?: string;
  explanation?: string;
}

export interface ListQuestionsInput {
  courseId?: string;
  moduleId?: string;
  difficulty?: string;
  type?: QuestionType;
  search?: string;
  page?: number;
  limit?: number;
}

export class QuestionBankService {
  private static checkCanManage(user: AuthenticatedUser) {
    const isSuperOrAdmin =
      user.roleCode === "SUPER_ADMIN" ||
      user.roleCode === "ADMIN" ||
      user.roleCode === "DIRECTOR";
    const isTrainer = user.roleCode === "TRAINER";
    if (!isSuperOrAdmin && !isTrainer) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permissions to manage examination questions.",
      });
    }
  }

  /**
   * Creates a new question in the QuestionBank.
   */
  static async createQuestion(user: AuthenticatedUser, input: CreateQuestionInput) {
    this.checkCanManage(user);

    if (!input.questionText.trim()) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Question text is required." });
    }
    if (!input.correctAnswer.trim()) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Correct answer key is required." });
    }
    if (!Array.isArray(input.options) || input.options.length < 2) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "At least 2 options are required for the question.",
      });
    }

    const question = await db.questionBank.create({
      data: {
        courseId: input.courseId,
        moduleId: input.moduleId || null,
        questionText: input.questionText.trim(),
        type: input.type || QuestionType.MCQ,
        options: input.options,
        correctAnswer: input.correctAnswer.trim(),
        marks: input.marks !== undefined ? input.marks : 1.0,
        negativeMarks: input.negativeMarks !== undefined ? input.negativeMarks : 0.0,
        difficulty: input.difficulty || "MEDIUM",
        topic: input.topic || null,
        explanation: input.explanation?.trim() || null,
      },
    });

    await AuditService.log({
      actorId: user.id,
      action: "QUESTION_CREATED",
      resourceType: "QuestionBank",
      resourceId: question.id,
      newData: { courseId: input.courseId, type: question.type, marks: question.marks },
    });

    return question;
  }

  /**
   * Lists questions with filtering and pagination.
   */
  static async listQuestions(user: AuthenticatedUser, input: ListQuestionsInput) {
    this.checkCanManage(user);

    const page = Math.max(1, input.page || 1);
    const limit = Math.min(100, Math.max(1, input.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.QuestionBankWhereInput = { isActive: true };
    if (input.courseId) where.courseId = input.courseId;
    if (input.moduleId) where.moduleId = input.moduleId;
    if (input.difficulty) where.difficulty = input.difficulty;
    if (input.type) where.type = input.type;
    if (input.search?.trim()) {
      where.questionText = { contains: input.search.trim(), mode: "insensitive" };
    }

    const [total, items] = await Promise.all([
      db.questionBank.count({ where }),
      db.questionBank.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          course: { select: { id: true, title: true } },
          module: { select: { id: true, title: true } },
        },
      }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Retrieves single question details.
   */
  static async getQuestionById(id: string) {
    const question = await db.questionBank.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true } },
        module: { select: { id: true, title: true } },
      },
    });

    if (!question) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Question not found." });
    }
    return question;
  }

  /**
   * Updates question text, options, answer, or marks.
   */
  static async updateQuestion(
    user: AuthenticatedUser,
    id: string,
    data: Partial<CreateQuestionInput>
  ) {
    this.checkCanManage(user);

    const question = await db.questionBank.findUnique({ where: { id } });
    if (!question) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Question not found." });
    }

    const updated = await db.questionBank.update({
      where: { id },
      data: {
        questionText: data.questionText !== undefined ? data.questionText.trim() : undefined,
        options: data.options !== undefined ? data.options : undefined,
        correctAnswer: data.correctAnswer !== undefined ? data.correctAnswer.trim() : undefined,
        marks: data.marks !== undefined ? data.marks : undefined,
        negativeMarks: data.negativeMarks !== undefined ? data.negativeMarks : undefined,
        difficulty: data.difficulty || undefined,
        topic: data.topic !== undefined ? data.topic : undefined,
        explanation: data.explanation !== undefined ? data.explanation?.trim() : undefined,
      },
    });

    await AuditService.log({
      actorId: user.id,
      action: "QUESTION_UPDATED",
      resourceType: "QuestionBank",
      resourceId: id,
      newData: { marks: updated.marks, negativeMarks: updated.negativeMarks },
    });

    return updated;
  }

  /**
   * Deactivates question.
   */
  static async deactivateQuestion(user: AuthenticatedUser, id: string) {
    this.checkCanManage(user);

    return db.questionBank.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
