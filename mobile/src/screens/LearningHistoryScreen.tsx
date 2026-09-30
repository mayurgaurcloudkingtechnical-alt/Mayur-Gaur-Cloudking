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
import {
  LearningHistoryResponse,
  RecentActivityTimelineItem,
  LessonActivityItem,
  ExamActivityItem,
  CertificateActivityItem,
} from '../types/history';
import { theme } from '../constants/theme';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorBanner } from '../components/common/ErrorBanner';

type FilterType = 'ALL' | 'LESSONS' | 'QUIZZES' | 'CERTIFICATES';

interface LearningHistoryScreenProps {
  onBack: () => void;
  onOpenCertificate?: (certificateId: string) => void;
}

export const LearningHistoryScreen: React.FC<LearningHistoryScreenProps> = ({
  onBack,
  onOpenCertificate,
}) => {
  const [data, setData] = useState<LearningHistoryResponse | null>(null);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setError(null);
      const res = await learningService.getLearningHistory();
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Unable to retrieve your learning history. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  if (loading) {
    return <LoadingSpinner message="Loading your learning history..." fullScreen />;
  }

  const completedLessons = data?.completedLessons || [];
  const examAttempts = data?.examAttempts || [];
  const certificates = data?.certificates || [];
  const recentActivity = data?.recentActivity || [];

  const filterTabs: { label: string; value: FilterType; count: number }[] = [
    { label: 'All Activity', value: 'ALL', count: recentActivity.length },
    { label: 'Lessons', value: 'LESSONS', count: completedLessons.length },
    { label: 'Quizzes', value: 'QUIZZES', count: examAttempts.length },
    { label: 'Certificates', value: 'CERTIFICATES', count: certificates.length },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
    >
      {/* Header */}
      <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
        <Text style={styles.backBtnText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.titleSection}>
        <Text style={styles.screenTitle}>Learning History</Text>
        <Text style={styles.screenSubtitle}>
          Chronological record of coursework, assessments, and earned credentials
        </Text>
      </View>

      {error && (
        <View style={styles.errorSection}>
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
          <Button title="Retry" onPress={fetchHistory} variant="outline" style={{ marginTop: theme.spacing.sm }} />
        </View>
      )}

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <Card style={styles.metricCard}>
          <Text style={styles.metricNumber}>{completedLessons.length}</Text>
          <Text style={styles.metricLabel}>Lessons Done</Text>
        </Card>
        <Card style={styles.metricCard}>
          <Text style={styles.metricNumber}>{examAttempts.length}</Text>
          <Text style={styles.metricLabel}>Quizzes Taken</Text>
        </Card>
        <Card style={styles.metricCard}>
          <Text style={styles.metricNumber}>{certificates.length}</Text>
          <Text style={styles.metricLabel}>Certificates</Text>
        </Card>
      </View>

      {/* Filter Tabs */}
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
              <View style={[styles.counterBadge, isActive && styles.activeCounterBadge]}>
                <Text style={[styles.counterText, isActive && styles.activeCounterText]}>
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Timeline Items */}
      {filter === 'ALL' && (
        <View style={styles.timelineList}>
          {recentActivity.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyTitle}>No Activity Recorded</Text>
              <Text style={styles.emptyText}>
                Complete lessons and quizzes to see your activity timeline here.
              </Text>
            </Card>
          ) : (
            recentActivity.map((item) => (
              <Card key={item.id} style={styles.activityCard}>
                <View style={styles.activityHeader}>
                  <View style={styles.activityIconBox}>
                    <Text style={styles.activityIcon}>
                      {item.type === 'LESSON_COMPLETED' ? '✓' : item.type === 'EXAM_ATTEMPT' ? '📋' : '🏆'}
                    </Text>
                  </View>
                  <View style={styles.activityDetails}>
                    <Text style={styles.activityTitle}>{item.title}</Text>
                    <Text style={styles.activitySubtitle}>{item.subtitle}</Text>
                    <Text style={styles.activityTime}>
                      {new Date(item.timestamp).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>
      )}

      {filter === 'LESSONS' && (
        <View style={styles.timelineList}>
          {completedLessons.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📖</Text>
              <Text style={styles.emptyTitle}>No Completed Lessons</Text>
              <Text style={styles.emptyText}>Open an enrolled course to begin studying.</Text>
            </Card>
          ) : (
            completedLessons.map((lesson) => (
              <Card key={lesson.id} style={styles.activityCard}>
                <View style={styles.activityHeader}>
                  <View style={[styles.activityIconBox, { backgroundColor: '#DCFCE7' }]}>
                    <Text style={[styles.activityIcon, { color: '#16A34A' }]}>✓</Text>
                  </View>
                  <View style={styles.activityDetails}>
                    <Text style={styles.activityTitle}>{lesson.lessonTitle}</Text>
                    <Text style={styles.activitySubtitle}>
                      {lesson.courseTitle} • {lesson.moduleTitle}
                    </Text>
                    <View style={styles.tagRow}>
                      <Badge label={lesson.lessonType} variant="default" />
                      <Text style={styles.activityTime}>
                        Completed: {new Date(lesson.completedAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>
      )}

      {filter === 'QUIZZES' && (
        <View style={styles.timelineList}>
          {examAttempts.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No Quiz Attempts</Text>
              <Text style={styles.emptyText}>Complete curriculum modules to take quizzes.</Text>
            </Card>
          ) : (
            examAttempts.map((attempt) => (
              <Card key={attempt.id} style={styles.activityCard}>
                <View style={styles.activityHeader}>
                  <View
                    style={[
                      styles.activityIconBox,
                      { backgroundColor: attempt.isPassed ? '#DCFCE7' : '#FEE2E2' },
                    ]}
                  >
                    <Text style={styles.activityIcon}>
                      {attempt.isPassed ? '✓' : '✗'}
                    </Text>
                  </View>
                  <View style={styles.activityDetails}>
                    <Text style={styles.activityTitle}>{attempt.examTitle}</Text>
                    <Text style={styles.activitySubtitle}>{attempt.courseTitle}</Text>
                    <View style={styles.tagRow}>
                      <Badge
                        label={attempt.isPassed ? 'PASSED' : 'NOT PASSED'}
                        variant={attempt.isPassed ? 'success' : 'error'}
                      />
                      {attempt.percentage !== null && attempt.percentage !== undefined && (
                        <Text style={styles.scoreText}>
                          Score: {attempt.finalScore}/{attempt.totalMarks} ({attempt.percentage}%)
                        </Text>
                      )}
                    </View>
                    <Text style={styles.activityTime}>
                      {new Date(attempt.startedAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>
      )}

      {filter === 'CERTIFICATES' && (
        <View style={styles.timelineList}>
          {certificates.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🎓</Text>
              <Text style={styles.emptyTitle}>No Certificates Earned Yet</Text>
              <Text style={styles.emptyText}>
                Complete 100% of course lessons and pass exams to earn credentials.
              </Text>
            </Card>
          ) : (
            certificates.map((cert) => (
              <Card key={cert.id} style={styles.activityCard}>
                <View style={styles.activityHeader}>
                  <View style={[styles.activityIconBox, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={styles.activityIcon}>🏆</Text>
                  </View>
                  <View style={styles.activityDetails}>
                    <Text style={styles.activityTitle}>{cert.courseTitle}</Text>
                    <Text style={styles.activitySubtitle}>
                      Certificate No: {cert.certificateNo}
                    </Text>
                    <View style={styles.tagRow}>
                      <Badge
                        label={cert.status === 'VALID' ? 'Verified Credential' : 'Revoked'}
                        variant={cert.status === 'VALID' ? 'success' : 'error'}
                      />
                      <Text style={styles.activityTime}>
                        Issued: {new Date(cert.issuedDate).toLocaleDateString()}
                      </Text>
                    </View>
                    {onOpenCertificate && (
                      <Button
                        title="View Certificate ↗"
                        onPress={() => onOpenCertificate(cert.id)}
                        variant="outline"
                        style={{ marginTop: theme.spacing.xs }}
                      />
                    )}
                  </View>
                </View>
              </Card>
            ))
          )}
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
  backBtn: {
    marginBottom: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  backBtnText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  titleSection: {
    marginBottom: theme.spacing.md,
  },
  screenTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '800',
    color: theme.colors.text,
  },
  screenSubtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  errorSection: {
    marginBottom: theme.spacing.md,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  metricCard: {
    flex: 1,
    padding: theme.spacing.sm,
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  filterBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 3,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
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
  counterBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  activeCounterBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  counterText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  activeCounterText: {
    color: '#FFFFFF',
  },
  timelineList: {
    gap: theme.spacing.sm,
  },
  activityCard: {
    padding: theme.spacing.sm,
  },
  activityHeader: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'flex-start',
  },
  activityIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityIcon: {
    fontSize: 16,
    fontWeight: '800',
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '700',
    color: theme.colors.text,
  },
  activitySubtitle: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  activityTime: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },
  emptyCard: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginVertical: theme.spacing.md,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: theme.spacing.xs,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
});
