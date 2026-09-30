export interface StudentCertificateCourse {
  id: string;
  title: string;
  slug: string;
}

export interface StudentCertificate {
  id: string;
  certificateNo: string;
  verificationToken: string;
  studentId: string;
  courseId: string;
  enrollmentId?: string | null;
  completionDate: string;
  issuedDate: string;
  signatoryName: string;
  signatoryTitle: string;
  status: 'VALID' | 'REVOKED';
  revokedAt?: string | null;
  revocationReason?: string | null;
  metadata?: Record<string, any>;
  course: StudentCertificateCourse;
  qrCodeData?: string | null;
}

export interface CertificateVerificationDetails {
  certificateNo: string;
  verificationToken: string;
  studentName: string;
  courseTitle: string;
  courseCode?: string;
  completionDate: string;
  issuedDate: string;
  signatoryName?: string;
  signatoryTitle?: string;
  metadata?: Record<string, any>;
  status: 'VALID' | 'REVOKED';
  revokedAt?: string | null;
  revocationReason?: string | null;
}

export interface CertificateVerificationResponse {
  isValid: boolean;
  isRevoked?: boolean;
  message: string;
  certificate: CertificateVerificationDetails | null;
  qrCodeData?: string | null;
}

export interface CourseCompletionEvaluation {
  isComplete: boolean;
  totalRequiredExams: number;
  passedExamsCount: number;
  averageScorePercentage: number;
  attendancePercentage: number;
  isFeeCleared: boolean;
  certificateIssued: boolean;
  certificateNo?: string;
  rejectionReasons?: string[];
}
