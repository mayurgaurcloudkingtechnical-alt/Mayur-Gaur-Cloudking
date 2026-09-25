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
import { CoursePlayerResponse } from '../types/learning';
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

      // Update state locally with response from backend
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

      // If user selected "Complete & Next" and there is a next lesson, navigate to it
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

      {/* 3. QUIZ / TEST LESSON */}
      {isQuiz && (
        <View style={styles.sectionWrapper}>
          <QuizPlaceholder
            lessonTitle={currentLesson.title}
            moduleTitle={currentLesson.moduleTitle}
            durationMin={currentLesson.durationMin}
            summary={currentLesson.summary}
          />
        </View>
      )}

      {/* 4. WRITTEN CONTENT / RICH TEXT / LECTURE NOTES (rendered for RICH_TEXT and as companion notes) */}
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
