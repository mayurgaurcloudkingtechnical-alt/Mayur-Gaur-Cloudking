import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { learningService } from '../api/learning';
import { DashboardOverviewResponse, EnrolledCourseSummary } from '../types/learning';
import { theme } from '../constants/theme';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { ProgressBar } from '../components/learning/ProgressBar';

interface StudentDashboardScreenProps {
  onNavigateToCourses: () => void;
  onNavigateToCourseDetails: (enrollmentId: string) => void;
  onNavigateToLesson: (enrollmentId: string, lessonId?: string) => void;
  onNavigateToProfile: () => void;
}

export const StudentDashboardScreen: React.FC<StudentDashboardScreenProps> = ({
  onNavigateToCourses,
  onNavigateToCourseDetails,
  onNavigateToLesson,
  onNavigateToProfile,
}) => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setError(null);
      const res = await learningService.getDashboardOverview();
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Unable to load your student dashboard. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  if (loading) {
    return <LoadingSpinner message="Loading your dashboard..." fullScreen />;
  }

  const stats = data?.stats;
  const enrollments = data?.enrollments || [];
  const primaryCourse: EnrolledCourseSummary | undefined = enrollments[0];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
    >
      {/* Header Greeting */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>Welcome, {user?.firstName || 'Student'}!</Text>
          <Text style={styles.subGreeting}>SoftLab Global Student Portal</Text>
        </View>
        <TouchableOpacity onPress={onNavigateToProfile} style={styles.profileBadge} activeOpacity={0.8}>
          <Text style={styles.profileBadgeText}>
            {(user?.firstName?.[0] || 'S') + (user?.lastName?.[0] || '')}
          </Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.section}>
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
          <Button title="Retry" onPress={fetchDashboard} variant="outline" style={{ marginTop: theme.spacing.sm }} />
        </View>
      )}

      {/* 4 Stats Cards */}
      {stats && (
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{stats.enrolledCoursesCount}</Text>
            <Text style={styles.statLabel}>Enrolled Courses</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>
              {stats.completedLessonsCount}
              <Text style={styles.statSubValue}>/{stats.totalLessonsCount}</Text>
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {stats.overallProgressPercent}%
            </Text>
            <Text style={styles.statLabel}>Overall Progress</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{data?.upcomingClasses?.length || 0}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </Card>
        </View>
      )}

      {/* Continue Learning Spotlight */}
      {primaryCourse ? (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Continue Learning</Text>
            <Badge label={primaryCourse.status} variant="success" />
          </View>
          <Card style={styles.continueCard}>
            <Text style={styles.courseTitle}>{primaryCourse.courseTitle}</Text>
            {primaryCourse.batchCode && (
              <Text style={styles.batchText}>Cohort Batch: {primaryCourse.batchCode}</Text>
            )}
            <View style={styles.progressContainer}>
              <ProgressBar progressPercent={primaryCourse.progressPercent} />
            </View>
            {primaryCourse.lastAccessedLessonTitle && (
              <View style={styles.lessonRow}>
                <Text style={styles.lessonPrompt}>Current Lesson:</Text>
                <Text style={styles.lessonName} numberOfLines={1}>
                  {primaryCourse.lastAccessedLessonTitle}
                </Text>
              </View>
            )}
            <Button
              title="Resume Lesson"
              onPress={() =>
                onNavigateToLesson(
                  primaryCourse.id,
                  primaryCourse.lastAccessedLessonId || undefined
                )
              }
              variant="primary"
              style={{ marginTop: theme.spacing.md }}
            />
          </Card>
        </View>
      ) : (
        <View style={styles.section}>
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No Enrolled Courses Found</Text>
            <Text style={styles.emptyDescription}>
              Your enrolled courses will appear here once finalized by admissions.
            </Text>
          </Card>
        </View>
      )}

      {/* Enrolled Courses Preview */}
      {enrollments.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>My Courses</Text>
            <TouchableOpacity onPress={onNavigateToCourses}>
              <Text style={styles.seeAllText}>View All ({enrollments.length})</Text>
            </TouchableOpacity>
          </View>
          {enrollments.slice(0, 3).map((enr) => (
            <TouchableOpacity
              key={enr.id}
              activeOpacity={0.8}
              onPress={() => onNavigateToCourseDetails(enr.id)}
            >
              <Card style={styles.courseItemCard}>
                <View style={styles.courseItemHeader}>
                  <Text style={styles.courseItemTitle} numberOfLines={1}>
                    {enr.courseTitle}
                  </Text>
                  <Badge label={`${enr.progressPercent}%`} variant="default" />
                </View>
                <ProgressBar progressPercent={enr.progressPercent} showLabel={false} height={5} />
                <View style={styles.courseItemFooter}>
                  <Text style={styles.courseItemMeta}>
                    {enr.completedLessons} of {enr.totalLessons} lessons
                  </Text>
                  <Text style={styles.openDetailsText}>Details →</Text>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.text,
  },
  subGreeting: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  profileBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.md,
  },
  profileBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: theme.typography.fontSize.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.text,
  },
  statSubValue: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '400',
    color: theme.colors.textMuted,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '700',
    color: theme.colors.text,
  },
  seeAllText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  continueCard: {
    padding: theme.spacing.md,
  },
  courseTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '700',
    color: theme.colors.text,
  },
  batchText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
    marginBottom: theme.spacing.xs,
  },
  progressContainer: {
    marginVertical: theme.spacing.xs,
  },
  lessonRow: {
    backgroundColor: '#F1F5F9',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.xs,
  },
  lessonPrompt: {
    fontSize: 10,
    color: theme.colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  lessonName: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 2,
  },
  emptyCard: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
  },
  emptyDescription: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  courseItemCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  courseItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  courseItemTitle: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text,
    marginRight: theme.spacing.sm,
  },
  courseItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  courseItemMeta: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
  },
  openDetailsText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});
