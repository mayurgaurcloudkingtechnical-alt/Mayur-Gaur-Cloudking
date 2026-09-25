import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { learningService } from '../api/learning';
import { CoursePlayerResponse, CurriculumLesson } from '../types/learning';
import { theme } from '../constants/theme';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { ProgressBar } from '../components/learning/ProgressBar';
import { ModuleAccordion } from '../components/learning/ModuleAccordion';

interface CourseDetailsScreenProps {
  enrollmentId: string;
  onBack: () => void;
  onOpenLesson: (enrollmentId: string, lessonId: string) => void;
}

export const CourseDetailsScreen: React.FC<CourseDetailsScreenProps> = ({
  enrollmentId,
  onBack,
  onOpenLesson,
}) => {
  const [data, setData] = useState<CoursePlayerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCourseData = useCallback(async () => {
    try {
      setError(null);
      const res = await learningService.getCoursePlayer(enrollmentId);
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Unable to load course curriculum. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [enrollmentId]);

  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCourseData();
  };

  const handleSelectLesson = (lesson: CurriculumLesson) => {
    onOpenLesson(enrollmentId, lesson.id);
  };

  if (loading) {
    return <LoadingSpinner message="Loading course curriculum..." fullScreen />;
  }

  if (error || !data) {
    return (
      <View style={styles.errorContainer}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back to My Courses</Text>
        </TouchableOpacity>
        <ErrorBanner message={error || 'Course data not found'} />
        <Button title="Retry" onPress={fetchCourseData} variant="outline" style={{ marginTop: theme.spacing.md }} />
      </View>
    );
  }

  const { course, enrollment, modules, stats, currentLesson } = data;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
    >
      {/* Navigation Header */}
      <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
        <Text style={styles.backBtnText}>← Back to My Courses</Text>
      </TouchableOpacity>

      {/* Course Overview Card */}
      <Card style={styles.overviewCard}>
        <View style={styles.badgeRow}>
          <Badge label={enrollment.status} variant="success" />
          {enrollment.batchCode && (
            <Badge label={`Batch: ${enrollment.batchCode}`} variant="default" />
          )}
        </View>

        <Text style={styles.courseTitle}>{course.title}</Text>

        <View style={styles.progressBox}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Course Progress</Text>
            <Text style={styles.progressCount}>
              {stats.completedLessons} of {stats.totalLessons} Lessons ({stats.progressPercent}%)
            </Text>
          </View>
          <ProgressBar progressPercent={stats.progressPercent} showLabel={false} height={10} />
        </View>

        {currentLesson && (
          <Button
            title={`Resume: ${currentLesson.title}`}
            onPress={() => onOpenLesson(enrollmentId, currentLesson.id)}
            variant="primary"
            style={{ marginTop: theme.spacing.sm }}
          />
        )}
      </Card>

      {/* Curriculum Outline */}
      <View style={styles.curriculumSection}>
        <View style={styles.curriculumHeader}>
          <Text style={styles.sectionHeading}>Curriculum Modules</Text>
          <Text style={styles.modulesCount}>
            {modules.length} Modules • {stats.totalLessons} Lessons
          </Text>
        </View>

        {modules.map((mod, index) => (
          <ModuleAccordion
            key={mod.id}
            module={mod}
            activeLessonId={currentLesson?.id}
            onSelectLesson={handleSelectLesson}
            defaultExpanded={index === 0}
          />
        ))}
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
  backBtn: {
    marginBottom: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  backBtnText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  overviewCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  courseTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.text,
    marginVertical: theme.spacing.xs,
  },
  progressBox: {
    marginVertical: theme.spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressTitle: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '600',
    color: theme.colors.text,
  },
  progressCount: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
  },
  curriculumSection: {
    marginBottom: theme.spacing.lg,
  },
  curriculumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: theme.spacing.sm,
  },
  sectionHeading: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '700',
    color: theme.colors.text,
  },
  modulesCount: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
  },
});
