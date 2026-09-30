import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { learningService } from '../api/learning';
import { certificateApi } from '../api/certificate';
import { EnrolledCourseSummary } from '../types/learning';
import { StudentCertificate } from '../types/certificate';
import { theme } from '../constants/theme';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { ProgressBar } from '../components/learning/ProgressBar';

type CourseFilter = 'ALL' | 'IN_PROGRESS' | 'COMPLETED' | 'NOT_STARTED';

interface MyCoursesScreenProps {
  onSelectCourse: (enrollmentId: string) => void;
  onViewCertificate?: (courseId: string, certificateId?: string) => void;
  onBack?: () => void;
}

export const MyCoursesScreen: React.FC<MyCoursesScreenProps> = ({
  onSelectCourse,
  onViewCertificate,
  onBack,
}) => {
  const [courses, setCourses] = useState<EnrolledCourseSummary[]>([]);
  const [certificates, setCertificates] = useState<StudentCertificate[]>([]);
  const [filter, setFilter] = useState<CourseFilter>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCoursesAndCertificates = useCallback(async () => {
    try {
      setError(null);
      const [coursesRes, certsRes] = await Promise.all([
        learningService.getEnrolledCourses(),
        certificateApi.getMyCertificates().catch(() => []),
      ]);
      setCourses(coursesRes);
      setCertificates(certsRes);
    } catch (err: any) {
      setError(err?.message || 'Unable to load your courses. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCoursesAndCertificates();
  }, [fetchCoursesAndCertificates]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCoursesAndCertificates();
  };

  if (loading) {
    return <LoadingSpinner message="Loading your enrolled courses..." fullScreen />;
  }

  // Filter categorization
  const inProgressCourses = courses.filter(
    (c) => c.progressPercent > 0 && c.progressPercent < 100 && c.status !== 'COMPLETED'
  );
  const completedCourses = courses.filter(
    (c) => c.progressPercent === 100 || c.status === 'COMPLETED'
  );
  const notStartedCourses = courses.filter(
    (c) => c.progressPercent === 0 && c.status !== 'COMPLETED'
  );

  const filteredCourses =
    filter === 'IN_PROGRESS'
      ? inProgressCourses
      : filter === 'COMPLETED'
      ? completedCourses
      : filter === 'NOT_STARTED'
      ? notStartedCourses
      : courses;

  const filterTabs: { label: string; value: CourseFilter; count: number }[] = [
    { label: 'All', value: 'ALL', count: courses.length },
    { label: 'In Progress', value: 'IN_PROGRESS', count: inProgressCourses.length },
    { label: 'Completed', value: 'COMPLETED', count: completedCourses.length },
    { label: 'Not Started', value: 'NOT_STARTED', count: notStartedCourses.length },
  ];

  const renderCourseItem = ({ item }: { item: EnrolledCourseSummary }) => {
    const isCompleted = item.progressPercent === 100 || item.status === 'COMPLETED';
    const cert = certificates.find((c) => c.courseId === item.courseId);

    return (
      <Card style={styles.courseCard}>
        {item.courseThumbnail && (
          <Image
            source={{ uri: item.courseThumbnail }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        )}

        <View style={styles.cardHeader}>
          <View style={styles.headerInfo}>
            <Text style={styles.courseTitle} numberOfLines={2}>
              {item.courseTitle}
            </Text>
            {item.batchCode && (
              <Text style={styles.batchCode}>Cohort: {item.batchCode}</Text>
            )}
          </View>
          <Badge
            label={isCompleted ? 'Completed' : item.progressPercent > 0 ? `${item.progressPercent}%` : 'Not Started'}
            variant={isCompleted ? 'success' : item.progressPercent > 0 ? 'primary' : 'default'}
          />
        </View>

        {item.courseSummary && (
          <Text style={styles.summary} numberOfLines={2}>
            {item.courseSummary}
          </Text>
        )}

        <View style={styles.progressSection}>
          <ProgressBar progressPercent={item.progressPercent} height={6} />
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.lessonsCount}>
            {item.completedLessons} of {item.totalLessons} Lessons Completed
          </Text>
          {item.durationWeeks && (
            <Text style={styles.durationText}>{item.durationWeeks} Weeks</Text>
          )}
        </View>

        <View style={styles.cardActions}>
          <Button
            title={isCompleted ? 'Review Course' : item.progressPercent > 0 ? 'Continue' : 'Start Course'}
            onPress={() => onSelectCourse(item.id)}
            variant={isCompleted ? 'outline' : 'primary'}
            style={styles.actionBtn}
          />

          {isCompleted && onViewCertificate && (
            <Button
              title={cert ? 'View Certificate 🏆' : 'Check Certificate 🎖'}
              onPress={() => onViewCertificate(item.courseId, cert?.id)}
              variant="secondary"
              style={styles.actionBtn}
            />
          )}
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.screenTitle}>My Learning</Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
          <Button title="Try Again" onPress={fetchCoursesAndCertificates} variant="outline" style={{ marginTop: theme.spacing.sm }} />
        </View>
      )}

      {/* Segment Filter Tabs */}
      <View style={styles.filterBar}>
        {filterTabs.map((tab) => {
          const isActive = filter === tab.value;
          return (
            <TouchableOpacity
              key={tab.value}
              onPress={() => setFilter(tab.value)}
              style={[styles.filterTab, isActive && styles.activeFilterTab]}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterTabText, isActive && styles.activeFilterTabText]}>
                {tab.label}
              </Text>
              <View style={[styles.tabBadge, isActive && styles.activeTabBadge]}>
                <Text style={[styles.tabBadgeText, isActive && styles.activeTabBadgeText]}>
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filteredCourses}
        keyExtractor={(item) => item.id}
        renderItem={renderCourseItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          !error ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📚</Text>
              <Text style={styles.emptyTitle}>
                {filter === 'ALL'
                  ? 'No Courses Enrolled'
                  : `No Courses ${filter === 'IN_PROGRESS' ? 'In Progress' : filter === 'COMPLETED' ? 'Completed' : 'Not Started'}`}
              </Text>
              <Text style={styles.emptyDescription}>
                {filter === 'ALL'
                  ? 'You are not actively enrolled in any courses yet. Speak to your academic counselor to get enrolled.'
                  : 'Check your other filter tabs to view available curriculum courses.'}
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
  },
  backButton: {
    paddingVertical: theme.spacing.xs,
    marginBottom: 4,
  },
  backButtonText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  screenTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '800',
    color: theme.colors.text,
  },
  errorContainer: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  filterBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  activeFilterTab: {
    backgroundColor: theme.colors.primary,
  },
  filterTabText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  activeFilterTabText: {
    color: '#FFFFFF',
  },
  tabBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  activeTabBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  tabBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  activeTabBadgeText: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  courseCard: {
    padding: theme.spacing.md,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: 120,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  headerInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '700',
    color: theme.colors.text,
  },
  batchCode: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  summary: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    lineHeight: 18,
    marginVertical: theme.spacing.xs,
  },
  progressSection: {
    marginVertical: theme.spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: theme.spacing.xs,
  },
  lessonsCount: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  durationText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  cardActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  actionBtn: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    marginTop: theme.spacing.lg,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.sm,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  emptyDescription: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
