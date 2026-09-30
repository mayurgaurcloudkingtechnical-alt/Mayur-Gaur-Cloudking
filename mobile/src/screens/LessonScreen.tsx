import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { learningService } from '../api/learning';
import { quizService } from '../api/quiz';
import { CoursePlayerResponse } from '../types/learning';
import {
  StudentExamViewDetails,
  ExamAttemptRecord,
  AttemptResultResponse,
  AnswerState,
} from '../types/quiz';
import { theme } from '../constants/theme';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { VideoPlayer } from '../components/learning/VideoPlayer';
import { DocumentViewer } from '../components/learning/DocumentViewer';
import { RichTextContent } from '../components/learning/RichTextContent';
import { QuizPlaceholder } from '../components/learning/QuizPlaceholder';
import { QuizInstructions } from '../components/quiz/QuizInstructions';
import { QuestionCard } from '../components/quiz/QuestionCard';
import { QuizTimer } from '../components/quiz/QuizTimer';
import { QuizReviewModal } from '../components/quiz/QuizReviewModal';
import { QuizResultView } from '../components/quiz/QuizResultView';

interface LessonScreenProps {
  enrollmentId: string;
  lessonId?: string;
  onBackToCourse: () => void;
  onNavigateToLesson: (enrollmentId: string, lessonId: string) => void;
}

export const LessonScreen: React.FC<LessonScreenProps> = ({
  enrollmentId,
  lessonId,
  onBackToCourse,
  onNavigateToLesson,
}) => {
  const [data, setData] = useState<CoursePlayerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quiz Lifecycle State
  const [quizState, setQuizState] = useState<
    'LOADING' | 'INSTRUCTIONS' | 'RUNNER' | 'RESULT' | 'NO_EXAM'
  >('LOADING');
  const [examData, setExamData] = useState<StudentExamViewDetails | null>(null);
  const [attempt, setAttempt] = useState<ExamAttemptRecord | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, AnswerState>>({});
  const [quizCurrentIndex, setQuizCurrentIndex] = useState(0);
  const [saveStatusMap, setSaveStatusMap] = useState<Record<string, string>>({});
  const [isStartingQuiz, setIsStartingQuiz] = useState(false);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [quizResult, setQuizResult] = useState<AttemptResultResponse | null>(null);

  const fetchLesson = useCallback(async () => {
    try {
      setError(null);
      const res = await learningService.getCoursePlayer(enrollmentId, lessonId);
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Unable to load lesson details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [enrollmentId, lessonId]);

  useEffect(() => {
    fetchLesson();
  }, [fetchLesson]);

  // Load Exam/Quiz when active lesson is a QUIZ or TEST
  useEffect(() => {
    if (!data?.currentLesson) return;

    const isQuizType =
      data.currentLesson.type === 'QUIZ' || data.currentLesson.type === 'TEST';

    if (!isQuizType) {
      return;
    }

    const loadExam = async () => {
      setQuizState('LOADING');
      try {
        const exams = await quizService.listStudentExams(data.course.id);
        const matched =
          exams.find((e) => e.module?.id === data.currentLesson.moduleId) ||
          exams.find((e) => e.course?.id === data.course.id) ||
          exams[0];

        if (matched) {
          const details = await quizService.getStudentExam(matched.id);
          setExamData(details);
          setQuizState('INSTRUCTIONS');
        } else {
          setQuizState('NO_EXAM');
        }
      } catch (err) {
        console.warn('Could not load exam for lesson:', err);
        setQuizState('NO_EXAM');
      }
    };

    loadExam();
  }, [data?.currentLesson?.id, data?.currentLesson?.type, data?.course?.id]);

  const handleStartQuiz = async () => {
    if (!examData) return;
    setIsStartingQuiz(true);
    try {
      const attemptRes = await quizService.startAttempt(examData.exam.id);
      setAttempt(attemptRes);

      // Pre-populate answers from attempt if resuming
      const initialAnswers: Record<string, AnswerState> = {};
      if (Array.isArray(attemptRes.answers)) {
        attemptRes.answers.forEach((ans) => {
          initialAnswers[ans.questionId] = {
            answer: ans.selectedAnswer,
            isMarked: ans.isMarkedForReview,
          };
        });
      }
      setQuizAnswers(initialAnswers);
      setQuizCurrentIndex(0);
      setQuizState('RUNNER');
    } catch (err: any) {
      Alert.alert('Cannot Start Assessment', err?.message || 'Unable to start attempt.');
    } finally {
      setIsStartingQuiz(false);
    }
  };

  const handleSelectAnswer = async (qId: string, answer: string | null) => {
    if (!attempt) return;
    const currentObj = quizAnswers[qId] || { answer: null, isMarked: false };
    setQuizAnswers((prev) => ({
      ...prev,
      [qId]: { ...currentObj, answer },
    }));
    setSaveStatusMap((prev) => ({ ...prev, [qId]: 'Saving...' }));

    try {
      await quizService.saveAnswer(attempt.id, qId, answer, currentObj.isMarked);
      setSaveStatusMap((prev) => ({ ...prev, [qId]: 'Saved' }));
    } catch (err) {
      setSaveStatusMap((prev) => ({ ...prev, [qId]: 'Error saving' }));
    }
  };

  const handleToggleReview = async (qId: string) => {
    if (!attempt) return;
    const currentObj = quizAnswers[qId] || { answer: null, isMarked: false };
    const newMarked = !currentObj.isMarked;

    setQuizAnswers((prev) => ({
      ...prev,
      [qId]: { ...currentObj, isMarked: newMarked },
    }));
    setSaveStatusMap((prev) => ({ ...prev, [qId]: 'Saving...' }));

    try {
      await quizService.saveAnswer(attempt.id, qId, currentObj.answer, newMarked);
      setSaveStatusMap((prev) => ({ ...prev, [qId]: 'Saved' }));
    } catch (err) {
      setSaveStatusMap((prev) => ({ ...prev, [qId]: 'Error saving' }));
    }
  };

  const performSubmit = async (isTimeout: boolean) => {
    if (!attempt) return;
    setIsSubmittingQuiz(true);
    setReviewModalVisible(false);

    try {
      await quizService.submitAttempt(attempt.id, isTimeout);
      const result = await quizService.getAttemptResult(attempt.id);
      setQuizResult(result);
      setQuizState('RESULT');

      // Progress synchronization: auto-mark lesson complete upon passing
      if (result.isPassed && data?.currentLesson && !data.currentLesson.isCompleted) {
        try {
          const targetLessonId = data.currentLesson.id;
          const progRes = await learningService.toggleLessonComplete(
            enrollmentId,
            targetLessonId,
            true
          );
          setData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              currentLesson: { ...prev.currentLesson, isCompleted: true },
              stats: {
                ...prev.stats,
                completedLessons: progRes.completedLessons,
                progressPercent: progRes.progressPercent,
              },
            };
          });
        } catch (e) {
          console.warn('Progress sync warning:', e);
        }
      }
    } catch (err: any) {
      Alert.alert('Submission Error', err?.message || 'Failed to submit assessment.');
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  const handleSubmitQuizPrompt = (isTimeout = false) => {
    if (isTimeout) {
      performSubmit(true);
      return;
    }

    Alert.alert(
      'Submit Assessment',
      'Are you sure you want to finish and submit your answers for grading?',
      [
        { text: 'Keep Reviewing', style: 'cancel' },
        { text: 'Submit Now', onPress: () => performSubmit(false) },
      ]
    );
  };

  const handleRetakeQuiz = () => {
    setQuizResult(null);
    setAttempt(null);
    setQuizAnswers({});
    setQuizCurrentIndex(0);
    setQuizState('INSTRUCTIONS');
  };

  const handleToggleComplete = async (andContinue = false) => {
    if (!data?.currentLesson) return;
    const newStatus = !data.currentLesson.isCompleted;

    setToggling(true);
    try {
      const res = await learningService.toggleLessonComplete(
        enrollmentId,
        data.currentLesson.id,
        newStatus
      );

      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          currentLesson: {
            ...prev.currentLesson,
            isCompleted: res.isCompleted,
          },
          stats: {
            ...prev.stats,
            completedLessons: res.completedLessons,
            progressPercent: res.progressPercent,
          },
        };
      });

      if (andContinue && res.isCompleted && data.nextLesson) {
        onNavigateToLesson(enrollmentId, data.nextLesson.id);
      }
    } catch (err: any) {
      Alert.alert(
        'Update Failed',
        err?.message || 'Could not update lesson progress. Please try again.'
      );
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading lesson content..." fullScreen />;
  }

  if (error || !data) {
    return (
      <View style={styles.errorContainer}>
        <TouchableOpacity onPress={onBackToCourse} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back to Course</Text>
        </TouchableOpacity>
        <ErrorBanner message={error || 'Lesson not found'} />
        <Button
          title="Retry"
          onPress={fetchLesson}
          variant="outline"
          style={{ marginTop: theme.spacing.md }}
        />
      </View>
    );
  }

  const { currentLesson, prevLesson, nextLesson, course, watermark, stats } = data;
  const isVideo = currentLesson.type === 'VIDEO';
  const isDocument = currentLesson.type === 'PDF' || currentLesson.type === 'DOCUMENT';
  const isQuiz = currentLesson.type === 'QUIZ' || currentLesson.type === 'TEST';
  const isRichText = currentLesson.type === 'RICH_TEXT';

  const examQuestions = examData?.exam.questions || [];
  const totalExamQuestions = examQuestions.length;
  const activeQuestionEntry = examQuestions[quizCurrentIndex];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Top Navigation */}
      <View style={styles.navRow}>
        <TouchableOpacity onPress={onBackToCourse} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>← {course.title}</Text>
        </TouchableOpacity>
        <Badge
          label={`${stats.progressPercent}% Completed`}
          variant={stats.progressPercent === 100 ? 'success' : 'default'}
        />
      </View>

      {/* Module & Lesson Title Header */}
      <View style={styles.titleContainer}>
        <Text style={styles.moduleBreadcrumb}>{currentLesson.moduleTitle}</Text>
        <Text style={styles.lessonTitle}>{currentLesson.title}</Text>
        <View style={styles.metaRow}>
          <Badge label={currentLesson.type} variant="info" />
          <Text style={styles.metaText}>{currentLesson.durationMin} minutes</Text>
          {currentLesson.isCompleted && (
            <Badge label="Completed ✓" variant="success" />
          )}
        </View>
      </View>

      {/* Content Rendering by Lesson Type */}

      {/* 1. VIDEO LESSON */}
      {isVideo && (
        <View style={styles.sectionWrapper}>
          <VideoPlayer
            bunnyVideoId={currentLesson.contentDetails?.bunnyVideoId}
            videoUrl={currentLesson.contentDetails?.videoUrl}
            lessonTitle={currentLesson.title}
            watermark={watermark}
          />
        </View>
      )}

      {/* 2. DOCUMENT / PDF LESSON */}
      {isDocument && (
        <View style={styles.sectionWrapper}>
          <DocumentViewer
            enrollmentId={enrollmentId}
            lessonId={currentLesson.id}
            contentDetails={currentLesson.contentDetails}
            lessonTitle={currentLesson.title}
          />
        </View>
      )}

      {/* 3. INTERACTIVE QUIZ / TEST LESSON */}
      {isQuiz && (
        <View style={styles.sectionWrapper}>
          {quizState === 'LOADING' ? (
            <Card style={styles.quizLoadingCard}>
              <LoadingSpinner message="Loading assessment data..." />
            </Card>
          ) : quizState === 'INSTRUCTIONS' && examData ? (
            <QuizInstructions
              examData={examData}
              moduleTitle={currentLesson.moduleTitle}
              isStarting={isStartingQuiz}
              onStartQuiz={handleStartQuiz}
            />
          ) : quizState === 'RUNNER' && attempt && activeQuestionEntry ? (
            <View style={styles.quizRunnerContainer}>
              {/* Runner Top Bar */}
              <View style={styles.runnerTopBar}>
                <View>
                  <Text style={styles.runnerExamTitle} numberOfLines={1}>
                    {examData?.exam.title}
                  </Text>
                  <Text style={styles.runnerAttemptNumber}>
                    Attempt #{attempt.attemptNumber}
                  </Text>
                </View>
                <QuizTimer
                  startedAt={attempt.startedAt}
                  durationMinutes={examData?.exam.durationMinutes || 30}
                  onTimeout={() => handleSubmitQuizPrompt(true)}
                />
              </View>

              {/* Active Question Card */}
              <QuestionCard
                question={activeQuestionEntry.question}
                questionIndex={quizCurrentIndex}
                totalQuestions={totalExamQuestions}
                selectedAnswer={quizAnswers[activeQuestionEntry.question.id]?.answer ?? null}
                isMarkedForReview={quizAnswers[activeQuestionEntry.question.id]?.isMarked ?? false}
                marks={
                  activeQuestionEntry.marksOverride !== null
                    ? activeQuestionEntry.marksOverride
                    : activeQuestionEntry.question.marks
                }
                negativeMarking={examData?.exam.negativeMarking ?? false}
                negativeMarksPerQuestion={examData?.exam.negativeMarksPerQuestion ?? 0}
                saveStatus={saveStatusMap[activeQuestionEntry.question.id] || 'Saved'}
                onSelectAnswer={(answer) =>
                  handleSelectAnswer(activeQuestionEntry.question.id, answer)
                }
                onToggleReview={() => handleToggleReview(activeQuestionEntry.question.id)}
              />

              {/* Runner Navigation Bar */}
              <View style={styles.runnerNavRow}>
                <Button
                  title="← Previous"
                  variant="outline"
                  onPress={() => setQuizCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={quizCurrentIndex === 0}
                  style={{ flex: 1 }}
                />

                <Button
                  title="Review Palette"
                  variant="outline"
                  onPress={() => setReviewModalVisible(true)}
                  style={{ flex: 1 }}
                />

                {quizCurrentIndex < totalExamQuestions - 1 ? (
                  <Button
                    title="Next →"
                    variant="primary"
                    onPress={() =>
                      setQuizCurrentIndex((prev) =>
                        Math.min(totalExamQuestions - 1, prev + 1)
                      )
                    }
                    style={{ flex: 1 }}
                  />
                ) : (
                  <Button
                    title="Review & Submit"
                    variant="primary"
                    onPress={() => setReviewModalVisible(true)}
                    style={{ flex: 1 }}
                  />
                )}
              </View>

              {/* Review Palette Modal */}
              <QuizReviewModal
                visible={reviewModalVisible}
                totalQuestions={totalExamQuestions}
                questionIds={examQuestions.map((q) => q.question.id)}
                answers={quizAnswers}
                currentIndex={quizCurrentIndex}
                isSubmitting={isSubmittingQuiz}
                onSelectQuestion={(idx) => setQuizCurrentIndex(idx)}
                onClose={() => setReviewModalVisible(false)}
                onSubmit={() => handleSubmitQuizPrompt(false)}
              />
            </View>
          ) : quizState === 'RESULT' && quizResult ? (
            <QuizResultView
              result={quizResult}
              canRetake={(examData?.attemptCount || 0) < (examData?.exam.maxAttempts || 3)}
              onRetake={handleRetakeQuiz}
              onContinue={() => {
                if (nextLesson) {
                  onNavigateToLesson(enrollmentId, nextLesson.id);
                } else {
                  onBackToCourse();
                }
              }}
            />
          ) : (
            <QuizPlaceholder
              lessonTitle={currentLesson.title}
              moduleTitle={currentLesson.moduleTitle}
              durationMin={currentLesson.durationMin}
              summary={currentLesson.summary}
            />
          )}
        </View>
      )}

      {/* 4. WRITTEN CONTENT / RICH TEXT / LECTURE NOTES (rendered for RICH_TEXT and companion notes) */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionHeading}>
          {isRichText ? 'Lesson Content' : 'Curriculum Notes & Topics'}
        </Text>
        <RichTextContent
          bodyText={currentLesson.contentDetails?.bodyText}
          bodyHtml={currentLesson.contentDetails?.bodyHtml}
          summary={currentLesson.summary}
          topics={currentLesson.topics}
        />
      </Card>

      {/* Progress Completion Actions */}
      <Card style={styles.actionCard}>
        <View style={styles.actionCardHeader}>
          <Text style={styles.actionCardHeading}>Lesson Progress</Text>
          {currentLesson.isCompleted ? (
            <Badge label="Completed ✓" variant="success" />
          ) : (
            <Badge label="In Progress" variant="default" />
          )}
        </View>
        <Text style={styles.actionCardSub}>
          {currentLesson.isCompleted
            ? 'You have completed this lesson. Progress is synchronized with the SoftLab Global LMS.'
            : 'Complete this lesson to advance your overall course completion.'}
        </Text>

        <View style={styles.actionButtonsRow}>
          {!currentLesson.isCompleted && nextLesson ? (
            <Button
              title="Complete & Next Lesson →"
              onPress={() => handleToggleComplete(true)}
              variant="primary"
              loading={toggling}
              style={{ flex: 1 }}
            />
          ) : (
            <Button
              title={
                toggling
                  ? 'Updating...'
                  : currentLesson.isCompleted
                  ? 'Mark as Incomplete'
                  : 'Mark as Completed ✓'
              }
              onPress={() => handleToggleComplete(false)}
              variant={currentLesson.isCompleted ? 'outline' : 'primary'}
              loading={toggling}
              style={{ flex: 1 }}
            />
          )}

          {currentLesson.isCompleted && (
            <TouchableOpacity
              onPress={() => handleToggleComplete(false)}
              style={styles.reopenButton}
              disabled={toggling}
            >
              <Text style={styles.reopenButtonText}>Reopen Lesson</Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>

      {/* Lesson Navigation (Previous / Next) */}
      <View style={styles.bottomNav}>
        {prevLesson ? (
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => onNavigateToLesson(enrollmentId, prevLesson.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.navButtonDirection}>← Previous</Text>
            <Text style={styles.navButtonTitle} numberOfLines={1}>
              {prevLesson.title}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.navButtonPlaceholder} />
        )}

        {nextLesson ? (
          <TouchableOpacity
            style={[styles.navButton, styles.nextNavButton]}
            onPress={() => onNavigateToLesson(enrollmentId, nextLesson.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.navButtonDirection, { textAlign: 'right' }]}>
              Next →
            </Text>
            <Text style={[styles.navButtonTitle, { textAlign: 'right' }]} numberOfLines={1}>
              {nextLesson.title}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.navButtonPlaceholder} />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  errorContainer: {
    flex: 1,
    padding: theme.spacing.md,
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  backBtn: {
    paddingVertical: theme.spacing.xs,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  backBtnText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  titleContainer: {
    marginBottom: theme.spacing.md,
  },
  moduleBreadcrumb: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  lessonTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.text,
    marginVertical: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: 2,
  },
  metaText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
  },
  sectionWrapper: {
    marginBottom: theme.spacing.md,
  },
  quizLoadingCard: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  quizRunnerContainer: {
    marginBottom: theme.spacing.md,
  },
  runnerTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: theme.borderRadius.md,
    padding: 12,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  runnerExamTitle: {
    color: '#F8FAFC',
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '700',
    maxWidth: 180,
  },
  runnerAttemptNumber: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
  },
  runnerNavRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sectionCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  sectionHeading: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  actionCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1.5,
    borderColor: '#D1FAE5',
    backgroundColor: '#F0FDF4',
  },
  actionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionCardHeading: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '700',
    color: '#065F46',
  },
  actionCardSub: {
    fontSize: theme.typography.fontSize.xs,
    color: '#047857',
    marginBottom: theme.spacing.sm,
    lineHeight: 18,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  reopenButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 8,
  },
  reopenButtonText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.fontSize.xs,
    textDecorationLine: 'underline',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  navButton: {
    flex: 1,
    padding: theme.spacing.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  nextNavButton: {
    alignItems: 'flex-end',
  },
  navButtonDirection: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  navButtonTitle: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 2,
  },
  navButtonPlaceholder: {
    flex: 1,
  },
});
