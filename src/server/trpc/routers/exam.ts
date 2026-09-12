import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  router,
  protectedProcedure,
  requireRoleProcedure,
} from "../init";
import { ExamService } from "@/server/services/exam.service";
import { ExamAttemptService } from "@/server/services/exam-attempt.service";
import { QuestionBankService } from "@/server/services/question-bank.service";
import { CourseCompletionService } from "@/server/services/course-completion.service";
import { ExamType, ExamStatus, QuestionType, UserRoleCode } from "@prisma/client";
import { AuthenticatedUser } from "@/server/auth/rbac";

function asAuthUser(user: any): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email || "",
    roleCode: user.roleCode,
    permissions: user.permissions || [],
    firstName: user.firstName || "",
    lastName: user.lastName || "",
  };
}

// Strictly guard administrative procedures against unauthorized roles (STUDENT, COUNSELOR, TELECALLER)
const adminExamProcedure = requireRoleProcedure([
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.ADMIN,
  UserRoleCode.DIRECTOR,
  UserRoleCode.TRAINER,
]);

export const examRouter = router({
  // ================= ADMIN PROCEDURES =================
  createExam: adminExamProcedure
    .input(
      z.object({
        title: z.string().min(3),
        slug: z.string().optional(),
        description: z.string().optional(),
        instructions: z.string().optional(),
        courseId: z.string(),
        moduleId: z.string().optional(),
        type: z.nativeEnum(ExamType).optional(),
        durationMinutes: z.number().int().min(1),
        totalMarks: z.number().positive(),
        passingPercentage: z.number().int().min(1).max(100),
        negativeMarking: z.boolean().optional(),
        negativeMarksPerQuestion: z.number().nonnegative().optional(),
        randomizeQuestions: z.boolean().optional(),
        maxAttempts: z.number().int().min(1).optional(),
        allowReview: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const authUser = asAuthUser(ctx.user);
      return ExamService.createExam(authUser, input);
    }),

  updateExam: adminExamProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(3).optional(),
        description: z.string().optional(),
        instructions: z.string().optional(),
        durationMinutes: z.number().int().min(1).optional(),
        totalMarks: z.number().positive().optional(),
        passingPercentage: z.number().int().min(1).max(100).optional(),
        negativeMarking: z.boolean().optional(),
        negativeMarksPerQuestion: z.number().nonnegative().optional(),
        randomizeQuestions: z.boolean().optional(),
        maxAttempts: z.number().int().min(1).optional(),
        allowReview: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const authUser = asAuthUser(ctx.user);
      return ExamService.updateExam(authUser, input);
    }),

  updateStatus: adminExamProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(ExamStatus),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const authUser = asAuthUser(ctx.user);
      return ExamService.updateStatus(authUser, input.id, input.status);
    }),

  addQuestions: adminExamProcedure
    .input(
      z.object({
        examId: z.string(),
        questions: z.array(
          z.object({
            questionId: z.string(),
            marks: z.number().positive().optional(),
            sortOrder: z.number().int().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const authUser = asAuthUser(ctx.user);
      return ExamService.addQuestionsToExam(authUser, input.examId, input.questions);
    }),

  removeQuestion: adminExamProcedure
    .input(
      z.object({
        examId: z.string(),
        questionId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const authUser = asAuthUser(ctx.user);
      return ExamService.removeQuestionFromExam(authUser, input.examId, input.questionId);
    }),

  getAdminExamDetails: adminExamProcedure
    .input(z.object({ examId: z.string() }))
    .query(async ({ input }) => {
      const exam = await ExamService.getExamById(input.examId, true);
      if (!exam) throw new TRPCError({ code: "NOT_FOUND", message: "Exam not found" });
      return exam;
    }),

  listAdminExams: adminExamProcedure
    .input(z.object({ courseId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const authUser = asAuthUser(ctx.user);
      return ExamService.listExamsForAdmin(authUser, input?.courseId);
    }),

  // Question bank procedures
  createQuestion: adminExamProcedure
    .input(
      z.object({
        courseId: z.string(),
        moduleId: z.string().optional(),
        questionText: z.string().min(5),
        type: z.nativeEnum(QuestionType).optional(),
        options: z.array(z.object({ id: z.string(), text: z.string() })).min(2),
        correctAnswer: z.string().min(1),
        explanation: z.string().optional(),
        marks: z.number().positive().optional(),
        negativeMarks: z.number().nonnegative().optional(),
        difficulty: z.string().optional(),
        topic: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const authUser = asAuthUser(ctx.user);
      return QuestionBankService.createQuestion(authUser, input);
    }),

  listQuestions: adminExamProcedure
    .input(
      z.object({
        courseId: z.string().optional(),
        moduleId: z.string().optional(),
        difficulty: z.string().optional(),
        type: z.nativeEnum(QuestionType).optional(),
        search: z.string().optional(),
        page: z.number().int().optional(),
        limit: z.number().int().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const authUser = asAuthUser(ctx.user);
      return QuestionBankService.listQuestions(authUser, input || {});
    }),

  // ================= STUDENT PROCEDURES =================
  listStudentExams: protectedProcedure
    .input(z.object({ courseId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ExamService.listExamsForStudent(ctx.user.id, input?.courseId);
    }),

  getStudentExam: protectedProcedure
    .input(z.object({ examId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ExamService.getStudentExamView(input.examId, ctx.user.id);
    }),

  startAttempt: protectedProcedure
    .input(z.object({ examId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ExamAttemptService.startAttempt({
        examId: input.examId,
        studentUserId: ctx.user.id,
      });
    }),

  saveAnswer: protectedProcedure
    .input(
      z.object({
        attemptId: z.string(),
        questionId: z.string(),
        selectedAnswer: z.string().nullable(),
        isMarkedForReview: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ExamAttemptService.saveAnswer({
        ...input,
        studentUserId: ctx.user.id,
      });
    }),

  submitAttempt: protectedProcedure
    .input(
      z.object({
        attemptId: z.string(),
        isTimeoutAutoSubmit: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ExamAttemptService.submitAttempt({
        attemptId: input.attemptId,
        studentUserId: ctx.user.id,
        isTimeoutAutoSubmit: input.isTimeoutAutoSubmit,
      });
    }),

  getAttemptResult: protectedProcedure
    .input(z.object({ attemptId: z.string() }))
    .query(async ({ ctx, input }) => {
      const isPrivileged =
        ctx.user.roleCode === UserRoleCode.SUPER_ADMIN ||
        ctx.user.roleCode === UserRoleCode.ADMIN ||
        ctx.user.roleCode === UserRoleCode.DIRECTOR;

      const attempt = await ExamAttemptService.getAttemptDetails(
        input.attemptId,
        isPrivileged ? undefined : ctx.user.id
      );
      if (!attempt) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Attempt not found" });
      }
      return attempt;
    }),

  listMyAttempts: protectedProcedure
    .input(z.object({ examId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ExamAttemptService.listStudentAttempts(ctx.user.id, input?.examId);
    }),

  checkCourseCompletion: protectedProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      return CourseCompletionService.evaluateCompletion(ctx.user.id, input.courseId);
    }),
});