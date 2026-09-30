import { apiClient } from './client';
import {
  StudentExamSummary,
  StudentExamViewDetails,
  ExamAttemptRecord,
  AttemptResultResponse,
} from '../types/quiz';

interface TrpcSuccessResponse<T> {
  result: {
    data: {
      json: T;
    };
  };
}

function unwrapTrpcResponse<T>(response: any): T {
  if (response?.result?.data?.json !== undefined) {
    return response.result.data.json as T;
  }
  if (response?.error?.message) {
    throw new Error(response.error.message);
  }
  return response as T;
}

export const quizService = {
  /**
   * Lists published exams/quizzes accessible to the student for a course.
   */
  async listStudentExams(courseId?: string): Promise<StudentExamSummary[]> {
    const inputPayload = {
      json: courseId ? { courseId } : {},
    };
    const queryParam = encodeURIComponent(JSON.stringify(inputPayload));
    const path = `/api/trpc/exam.listStudentExams?input=${queryParam}`;

    const raw = await apiClient.get<TrpcSuccessResponse<StudentExamSummary[]>>(path);
    return unwrapTrpcResponse<StudentExamSummary[]>(raw);
  },

  /**
   * Fetches full student exam view (instructions, time limit, questions without answers).
   */
  async getStudentExam(examId: string): Promise<StudentExamViewDetails> {
    const inputPayload = {
      json: { examId },
    };
    const queryParam = encodeURIComponent(JSON.stringify(inputPayload));
    const path = `/api/trpc/exam.getStudentExam?input=${queryParam}`;

    const raw = await apiClient.get<TrpcSuccessResponse<StudentExamViewDetails>>(path);
    return unwrapTrpcResponse<StudentExamViewDetails>(raw);
  },

  /**
   * Starts a new attempt or resumes an existing in-progress attempt.
   */
  async startAttempt(examId: string): Promise<ExamAttemptRecord> {
    const body = {
      json: { examId },
    };

    const raw = await apiClient.post<TrpcSuccessResponse<ExamAttemptRecord>>(
      '/api/trpc/exam.startAttempt',
      body
    );
    return unwrapTrpcResponse<ExamAttemptRecord>(raw);
  },

  /**
   * Autosaves student's selected answer or mark-for-review status.
   */
  async saveAnswer(
    attemptId: string,
    questionId: string,
    selectedAnswer: string | null,
    isMarkedForReview?: boolean
  ): Promise<any> {
    const body = {
      json: {
        attemptId,
        questionId,
        selectedAnswer,
        ...(isMarkedForReview !== undefined ? { isMarkedForReview } : {}),
      },
    };

    const raw = await apiClient.post<TrpcSuccessResponse<any>>(
      '/api/trpc/exam.saveAnswer',
      body
    );
    return unwrapTrpcResponse<any>(raw);
  },

  /**
   * Submits an exam attempt for server-authoritative grading.
   */
  async submitAttempt(
    attemptId: string,
    isTimeoutAutoSubmit = false
  ): Promise<ExamAttemptRecord> {
    const body = {
      json: {
        attemptId,
        isTimeoutAutoSubmit,
      },
    };

    const raw = await apiClient.post<TrpcSuccessResponse<ExamAttemptRecord>>(
      '/api/trpc/exam.submitAttempt',
      body
    );
    return unwrapTrpcResponse<ExamAttemptRecord>(raw);
  },

  /**
   * Fetches graded attempt results, score, pass/fail status, and allowed review.
   */
  async getAttemptResult(attemptId: string): Promise<AttemptResultResponse> {
    const inputPayload = {
      json: { attemptId },
    };
    const queryParam = encodeURIComponent(JSON.stringify(inputPayload));
    const path = `/api/trpc/exam.getAttemptResult?input=${queryParam}`;

    const raw = await apiClient.get<TrpcSuccessResponse<AttemptResultResponse>>(path);
    return unwrapTrpcResponse<AttemptResultResponse>(raw);
  },
};
