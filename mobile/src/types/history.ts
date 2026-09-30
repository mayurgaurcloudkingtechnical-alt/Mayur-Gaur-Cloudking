export interface LessonActivityItem {
  id: string;
  lessonId: string;
  lessonTitle: string;
  lessonType: string;
  durationMin: number;
  moduleTitle: string;
  courseId: string;
  courseTitle: string;
  completedAt: string;
}

export interface ExamActivityItem {
  id: string;
  examId: string;
  examTitle: string;
  courseTitle: string;
  status: string;
  startedAt: string;
  submittedAt?: string | null;
  finalScore?: number | null;
  totalMarks?: number | null;
  percentage?: number | null;
  isPassed?: boolean | null;
}

export interface CertificateActivityItem {
  id: string;
  certificateNo: string;
  courseTitle: string;
  issuedDate: string;
  status: string;
}

export interface RecentActivityTimelineItem {
  type: 'LESSON_COMPLETED' | 'EXAM_ATTEMPT' | 'CERTIFICATE_EARNED';
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface LearningHistoryResponse {
  completedLessons: LessonActivityItem[];
  examAttempts: ExamActivityItem[];
  certificates: CertificateActivityItem[];
  recentActivity: RecentActivityTimelineItem[];
}
