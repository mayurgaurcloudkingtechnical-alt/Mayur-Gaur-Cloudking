import { apiClient } from './client';
import {
  StudentCertificate,
  CertificateVerificationResponse,
  CourseCompletionEvaluation,
} from '../types/certificate';

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

export const certificateApi = {
  /**
   * Fetches all valid credentials/certificates awarded to the authenticated student.
   */
  async getMyCertificates(): Promise<StudentCertificate[]> {
    const raw = await apiClient.get<TrpcSuccessResponse<StudentCertificate[]>>(
      '/api/trpc/certificate.getMyCertificates'
    );
    return unwrapTrpcResponse<StudentCertificate[]>(raw);
  },

  /**
   * Verifies a certificate public identifier (certificate number or verification token).
   */
  async verifyCertificate(identifier: string): Promise<CertificateVerificationResponse> {
    const query = encodeURIComponent(JSON.stringify({ json: { identifier } }));
    const raw = await apiClient.get<TrpcSuccessResponse<CertificateVerificationResponse>>(
      `/api/trpc/certificate.verify?input=${query}`
    );
    return unwrapTrpcResponse<CertificateVerificationResponse>(raw);
  },

  /**
   * Evaluates course completion criteria and automatically triggers certificate issuance if met.
   */
  async checkCourseCompletion(courseId: string): Promise<CourseCompletionEvaluation> {
    const query = encodeURIComponent(JSON.stringify({ json: { courseId } }));
    const raw = await apiClient.get<TrpcSuccessResponse<CourseCompletionEvaluation>>(
      `/api/trpc/exam.checkCourseCompletion?input=${query}`
    );
    return unwrapTrpcResponse<CourseCompletionEvaluation>(raw);
  },
};
