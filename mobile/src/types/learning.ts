export interface DashboardStats {
  enrolledCoursesCount: number;
  totalLessonsCount: number;
  completedLessonsCount: number;
  overallProgressPercent: number;
}

export interface EnrolledCourseSummary {
  id: string; // enrollmentId
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  courseThumbnail: string | null;
  durationWeeks: number;
  batchCode: string | null;
  batchName: string | null;
  status: string;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  lastAccessedLessonId: string | null;
  lastAccessedLessonTitle?: string | null;
  lastAccessedAt?: string | null;
  courseSummary?: string;
  enrolledAt?: string;
}

export interface UpcomingClass {
  id: string;
  title: string;
  batchCode: string;
  batchName: string;
  scheduledAt: string;
  durationMin: number;
  mode: string;
  location?: string | null;
  trainerName: string;
}

export interface DashboardOverviewResponse {
  enrollments: EnrolledCourseSummary[];
  stats: DashboardStats;
  upcomingClasses: UpcomingClass[];
}

export interface CurriculumLesson {
  id: string;
  moduleId: string;
  moduleTitle: string;
  title: string;
  slug?: string | null;
  type: 'VIDEO' | 'PDF' | 'DOCUMENT' | 'RICH_TEXT' | 'ASSIGNMENT' | 'QUIZ' | 'TEST' | 'EXTERNAL_LINK';
  durationMin: number;
  isFreePreview: boolean;
  isCompleted: boolean;
}

export interface CurriculumModule {
  id: string;
  title: string;
  description: string | null;
  lessons: CurriculumLesson[];
}

export interface LessonContentDetails {
  id: string;
  fileName: string | null;
  fileSizeBytes: number | null;
  mimeType: string | null;
  hasResource: boolean;
  bodyHtml: string | null;
  bodyText: string | null;
  bunnyVideoId: string | null;
  videoUrl: string | null;
  externalUrl: string | null;
}

export interface CurrentLessonDetails {
  id: string;
  moduleId: string;
  moduleTitle: string;
  title: string;
  type: string;
  durationMin: number;
  summary: string | null;
  topics: string[];
  isCompleted: boolean;
  contentDetails: LessonContentDetails | null;
}

export interface CoursePlayerResponse {
  enrollment: {
    id: string;
    status: string;
    batchCode: string | null;
    batchName: string | null;
  };
  course: {
    id: string;
    title: string;
    slug: string;
  };
  modules: CurriculumModule[];
  currentLesson: CurrentLessonDetails;
  prevLesson: { id: string; title: string } | null;
  nextLesson: { id: string; title: string } | null;
  stats: {
    totalLessons: number;
    completedLessons: number;
    progressPercent: number;
  };
  watermark: {
    email: string;
    timestamp: string;
  };
}

export interface ToggleProgressResult {
  isCompleted: boolean;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  courseCompleted: boolean;
}

export interface LessonResourceDownloadResponse {
  available: boolean;
  downloadUrl?: string;
  fileName?: string;
  expiresInSec?: number;
  message?: string;
}

export interface StudentProfileData {
  id: string;
  studentId: string;
  center?: string | null;
  highestDegree?: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    avatarUrl?: string | null;
  };
  enrollments: Array<{
    id: string;
    course: { title: string };
    batch: { name: string; code: string } | null;
  }>;
}
