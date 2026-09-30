export type QuestionType = 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER';
export type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'EVALUATED' | 'TIMED_OUT' | 'ABANDONED';
export type ExamType = 'MODULE_QUIZ' | 'FINAL_EXAM' | 'PRACTICE';

export interface QuestionOption {
  id: string;
  text: string;
}

export interface QuizQuestionItem {
  id: string;
  questionText: string;
  type: QuestionType;
  options: QuestionOption[] | null;
  marks: number;
  marksOverride?: number | null;
  negativeMarksOverride?: number | null;
}

export interface StudentExamSummary {
  id: string;
  title: string;
  slug?: string | null;
  description?: string | null;
  type: ExamType;
  durationMinutes: number;
  totalMarks: number;
  passingPercentage: number;
  maxAttempts: number;
  negativeMarking: boolean;
  negativeMarksPerQuestion: number;
  userAttemptCount: number;
  canAttempt: boolean;
  course?: { id: string; title: string };
  module?: { id: string; title: string } | null;
  _count?: { questions: number };
  latestAttempt?: {
    id: string;
    status: AttemptStatus;
    finalScore: number;
    percentage: number;
    isPassed: boolean;
  } | null;
}

export interface StudentExamViewDetails {
  exam: {
    id: string;
    title: string;
    slug?: string | null;
    description?: string | null;
    instructions?: string | null;
    type: ExamType;
    durationMinutes: number;
    totalMarks: number;
    passingPercentage: number;
    negativeMarking: boolean;
    negativeMarksPerQuestion: number;
    randomizeQuestions: boolean;
    maxAttempts: number;
    allowReview: boolean;
    course: { id: string; title: string };
    module?: { id: string; title: string } | null;
    questions: Array<{
      id: string;
      sortOrder: number;
      marksOverride: number | null;
      negativeMarksOverride: number | null;
      question: QuizQuestionItem;
    }>;
  };
  attemptCount: number;
  canAttempt: boolean;
}

export interface AnswerState {
  answer: string | null;
  isMarked: boolean;
}

export interface AttemptAnswerRecord {
  id: string;
  questionId: string;
  selectedAnswer: string | null;
  isCorrect?: boolean | null;
  isMarkedForReview: boolean;
  marksAwarded: number;
}

export interface ExamAttemptRecord {
  id: string;
  examId: string;
  studentId: string;
  enrollmentId: string;
  attemptNumber: number;
  status: AttemptStatus;
  startedAt: string;
  submittedAt?: string | null;
  timeTakenSeconds?: number | null;
  totalQuestions: number;
  attemptedQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  rawScore: number;
  negativeScore: number;
  finalScore: number;
  percentage: number;
  isPassed: boolean;
  answers: AttemptAnswerRecord[];
}

export interface AttemptResultReviewQuestion {
  questionId: string;
  questionText: string;
  type: QuestionType;
  options: QuestionOption[] | null;
  marks: number;
  selectedAnswer: string | null;
  isCorrect: boolean | null;
  marksAwarded: number;
}

export interface AttemptResultResponse {
  id: string;
  attemptNumber: number;
  status: AttemptStatus;
  startedAt: string;
  submittedAt: string | null;
  timeTakenSeconds: number | null;
  totalQuestions: number;
  attemptedQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  finalScore: number;
  percentage: number;
  isPassed: boolean;
  exam: {
    id: string;
    title: string;
    totalMarks: number;
    passingPercentage: number;
    durationMinutes: number;
    allowReview: boolean;
    course?: { id: string; title: string };
    module?: { id: string; title: string } | null;
    questions?: Array<{
      questionId: string;
      question: {
        id: string;
        questionText: string;
        type: QuestionType;
        options: QuestionOption[] | null;
        marks: number;
      };
    }>;
  };
  answers: AttemptAnswerRecord[];
}
