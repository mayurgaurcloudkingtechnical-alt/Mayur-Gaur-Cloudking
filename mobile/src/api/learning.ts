import { apiClient } from './client';
import {
  DashboardOverviewResponse,
  EnrolledCourseSummary,
  CoursePlayerResponse,
  ToggleProgressResult,
  StudentProfileData,
  LessonResourceDownloadResponse,
} from '../types/learning';

interface TrpcSuccessResponse<T> {
  result: {
    data: {
      json: T;
    };
  };
}

interface TrpcErrorResponse {
  error: {
    message: string;
    code: number;
    data?: {
      code: string;
      httpStatus: number;
    };
  };
}

/**
 * Parses tRPC response envelope { result: { data: { json: T } } }
 */
function unwrapTrpcResponse<T>(response: any): T {
  if (response?.result?.data?.json !== undefined) {
    return response.result.data.json as T;
  }
  if (response?.error?.message) {
    throw new Error(response.error.message);
  }
  return response as T;
}

export const learningService = {
  /**
   * Fetches student dashboard metrics, enrollments with progress, and upcoming classes.
   */
  async getDashboardOverview(): Promise<DashboardOverviewResponse> {
    const raw = await apiClient.get<TrpcSuccessResponse<DashboardOverviewResponse>>(
      '/api/trpc/learning.getDashboardOverview'
    );
    return unwrapTrpcResponse<DashboardOverviewResponse>(raw);
  },

  /**
   * Fetches all courses actively enrolled by the authenticated student.
   */
  async getEnrolledCourses(): Promise<EnrolledCourseSummary[]> {
    const raw = await apiClient.get<TrpcSuccessResponse<EnrolledCourseSummary[]>>(
      '/api/trpc/learning.getEnrolledCourses'
    );
    return unwrapTrpcResponse<EnrolledCourseSummary[]>(raw);
  },

  /**
   * Fetches full course player data (modules, lessons, active lesson content, and progress).
   */
  async getCoursePlayer(enrollmentId: string, lessonId?: string): Promise<CoursePlayerResponse> {
    const inputPayload = {
      json: {
        enrollmentId,
        ...(lessonId ? { lessonId } : {}),
      },
    };
    const queryParam = encodeURIComponent(JSON.stringify(inputPayload));
    const path = `/api/trpc/learning.getCoursePlayer?input=${queryParam}`;

    const raw = await apiClient.get<TrpcSuccessResponse<CoursePlayerResponse>>(path);
    return unwrapTrpcResponse<CoursePlayerResponse>(raw);
  },

  /**
   * Toggles completion status of a lesson for an active enrollment.
   */
  async toggleLessonComplete(
    enrollmentId: string,
    lessonId: string,
    isCompleted: boolean
  ): Promise<ToggleProgressResult> {
    const body = {
      json: {
        enrollmentId,
        lessonId,
        isCompleted,
      },
    };

    const raw = await apiClient.post<TrpcSuccessResponse<ToggleProgressResult>>(
      '/api/trpc/learning.toggleLessonComplete',
      body
    );
    return unwrapTrpcResponse<ToggleProgressResult>(raw);
  },

  /**
   * Fetches student profile and campus details.
   */
  async getStudentProfile(): Promise<StudentProfileData> {
    const raw = await apiClient.get<TrpcSuccessResponse<StudentProfileData>>(
      '/api/trpc/learning.getMyIdCard'
    );
    return unwrapTrpcResponse<StudentProfileData>(raw);
  },

  /**
   * Requests a short-lived (5-minute) authorized download URL for a private lesson resource (PDF/doc).
   */
  async getLessonResourceDownloadUrl(
    enrollmentId: string,
    lessonId: string
  ): Promise<LessonResourceDownloadResponse> {
    const body = {
      json: {
        enrollmentId,
        lessonId,
      },
    };

    const raw = await apiClient.post<TrpcSuccessResponse<LessonResourceDownloadResponse>>(
      '/api/trpc/learning.getLessonResourceDownloadUrl',
      body
    );
    return unwrapTrpcResponse<LessonResourceDownloadResponse>(raw);
  },
};

