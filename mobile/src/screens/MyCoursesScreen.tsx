import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { learningService } from '../api/learning';
import { EnrolledCourseSummary } from '../types/learning';
import { theme } from '../constants/theme';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { ProgressBar } from '../components/learning/ProgressBar';

interface MyCoursesScreenProps {
  onSelectCourse: (enrollmentId: string) => void;
  onBack?: () => void;
}

export const MyCoursesScreen: React.FC<MyCoursesScreenProps> = ({
  onSelectCourse,
  onBack,
}) => {
  const [courses, setCourses] = useState<EnrolledCourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    try {
      setError(null);
      const res = await learningService.getEnrolledCourses();
      setCourses(res);
    } catch (err: any) {
      setError(err?.message || 'Unable to load your courses. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCourses();
  };

  if (loading) {
    return <LoadingSpinner message="Loading your enrolled courses..." fullScreen />;
  }

  const renderCourseItem = ({ item }: { item: EnrolledCourseSummary }) => {
    const isCompleted = item.totalLessons > 0 && item.completedLessons === item.totalLessons;

    return (
      <Card style={styles.courseCard}>
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
            label={isCompleted ? 'Completed' : item.status}
            variant={isCompleted ? 'success' : 'default'}
          />
        </View>

        {item.courseSummary && (
          <Text style={styles.summary} numberOfLines={2}>
            {item.courseSummary}
          </Text>
        )}

        <View style={styles.progressSection}>
          <ProgressBar progressPercent={item.progressPercent} />
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.lessonsCount}>
            {item.completedLessons} of {item.totalLessons} Lessons
          </Text>
          <Button
            title={item.progressPercent > 0 ? 'Resume Course' : 'Start Course'}
            onPress={() => onSelectCourse(item.id)}
            variant={item.progressPercent > 0 ? 'primary' : 'outline'}
            style={styles.actionBtn}
          />
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
        <Text style={styles.screenTitle}>My Enrolled Courses</Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
          <Button title="Try Again" onPress={fetchCourses} variant="outline" style={{ marginTop: theme.spacing.sm }} />
        </View>
      )}

      <FlatList
        data={courses}
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
              <Text style={styles.emptyTitle}>No Courses Enrolled</Text>
              <Text style={styles.emptyDescription}>
                Your enrolled courses will appear here once registered by your academic administrator.
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
    paddingBottom: theme.spacing.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    marginBottom: theme.spacing.xs,
  },
  backButtonText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  screenTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.text,
  },
  errorContainer: {
    padding: theme.spacing.md,
  },
  listContainer: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  courseCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  headerInfo: {
    flex: 1,
    marginRight: theme.spacing.sm,
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
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  lessonsCount: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  actionBtn: {
    minWidth: 120,
  },
  emptyContainer: {
    paddingVertical: theme.spacing.xxl,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.sm,
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
    maxWidth: 280,
    marginTop: 4,
  },
});
