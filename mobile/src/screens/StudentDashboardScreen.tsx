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
import { Bell } from 'lucide-react-native';
import { notificationApi } from '../api/notification';

interface StudentDashboardScreenProps {
  onNavigateToCourses: () => void;
  onNavigateToCourseDetails: (enrollmentId: string) => void;
  onNavigateToLesson: (enrollmentId: string, lessonId?: string) => void;
  onNavigateToProfile: () => void;
  onNavigateToCertificates?: () => void;
  onNavigateToHistory?: () => void;
  onNavigateToNotifications?: () => void;
}

export const StudentDashboardScreen: React.FC<StudentDashboardScreenProps> = ({
  onNavigateToCourses,
  onNavigateToCourseDetails,
  onNavigateToLesson,
  onNavigateToProfile,
  onNavigateToCertificates,
  onNavigateToHistory,
  onNavigateToNotifications,
}) => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardOverviewResponse | null>(null);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setError(null);
      const [res, notifRes] = await Promise.allSettled([
        learningService.getDashboardOverview(),
        notificationApi.getMyNotifications({ limit: 1 }),
      ]);

      if (res.status === 'fulfilled') {
        setData(res.value);
      } else {
        throw res.reason;
      }

      if (notifRes.status === 'fulfilled') {
        setUnreadNotificationsCount(notifRes.value.unreadCount || 0);
      }
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
  
  // Calculate active and completed courses
  const completedCourses = enrollments.filter(
    (e) => e.status === 'COMPLETED' || e.progressPercent === 100
  );
  const activeCourses = enrollments.filter(
    (e) => e.status !== 'COMPLETED' && e.progressPercent < 100
  );

  // Spotlight prioritized in-progress course, or first course
  const primaryCourse: EnrolledCourseSummary | undefined =
    activeCourses[0] || enrollments[0];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
    >
      {/* Header Greeting */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>
            Welcome, {user?.firstName ? `${user.firstName} ${user?.lastName || ''}`.trim() : 'Student'}!
          </Text>
          <Text style={styles.subGreeting}>SoftLab Global Student Portal</Text>
        </View>

        <View style={styles.headerActions}>
          {onNavigateToNotifications && (
            <TouchableOpacity
              onPress={onNavigateToNotifications}
              style={styles.bellButton}
              activeOpacity={0.7}
              accessibilityLabel="Notifications"
            >
              <Bell size={22} color={theme.colors.text} />
              {unreadNotificationsCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>
                    {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={onNavigateToProfile} style={styles.profileBadge} activeOpacity={0.8}>
            <Text style={styles.profileBadgeText}>
              {(user?.firstName?.[0] || 'S') + (user?.lastName?.[0] || '')}
            </Text>
          </TouchableOpacity>
        </View>
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
            <Text style={styles.statValue}>{activeCourses.length}</Text>
            <Text style={styles.statLabel}>Active Courses</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#16A34A' }]}>{completedCourses.length}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {stats.overallProgressPercent}%
            </Text>
            <Text style={styles.statLabel}>Overall Progress</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>
              {stats.completedLessonsCount}
              <Text style={styles.statSubValue}>/{stats.totalLessonsCount}</Text>
            </Text>
            <Text style={styles.statLabel}>Lessons Done</Text>
          </Card>
        </View>
      )}

      {/* Quick Navigation Shortcuts */}
      <View style={styles.shortcutsRow}>
        <TouchableOpacity
          style={styles.shortcutBtn}
          onPress={onNavigateToCourses}
          activeOpacity={0.7}
        >
          <Text style={styles.shortcutIcon}>📖</Text>
          <Text style={styles.shortcutLabel}>My Learning</Text>
        </TouchableOpacity>

        {onNavigateToCertificates && (
          <TouchableOpacity
            style={styles.shortcutBtn}
            onPress={onNavigateToCertificates}
            activeOpacity={0.7}
          >
            <Text style={styles.shortcutIcon}>🏆</Text>
            <Text style={styles.shortcutLabel}>Certificates</Text>
          </TouchableOpacity>
        )}

        {onNavigateToHistory && (
          <TouchableOpacity
            style={styles.shortcutBtn}
            onPress={onNavigateToHistory}
            activeOpacity={0.7}
          >
            <Text style={styles.shortcutIcon}>⏱</Text>
            <Text style={styles.shortcutLabel}>History</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Continue Learning Spotlight */}
      {primaryCourse ? (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Continue Learning</Text>
            <Badge
              label={primaryCourse.progressPercent === 100 ? 'Completed' : 'In Progress'}
              variant={primaryCourse.progressPercent === 100 ? 'success' : 'primary'}
            />
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
              title={
                primaryCourse.progressPercent === 100
                  ? 'Review Course'
                  : 'Continue Learning →'
              }
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bellButton: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  profileBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
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
  shortcutsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  shortcutBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  shortcutIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  shortcutLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text,
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
