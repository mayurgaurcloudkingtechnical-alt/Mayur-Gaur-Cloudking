import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { StudentExamViewDetails } from '../../types/quiz';

interface QuizInstructionsProps {
  examData: StudentExamViewDetails;
  moduleTitle?: string;
  isStarting: boolean;
  onStartQuiz: () => void;
}

export const QuizInstructions: React.FC<QuizInstructionsProps> = ({
  examData,
  moduleTitle,
  isStarting,
  onStartQuiz,
}) => {
  const { exam, attemptCount, canAttempt } = examData;
  const questionsCount = exam.questions?.length || 0;

  return (
    <View style={styles.container}>
      {/* Title & Category Header */}
      <View style={styles.header}>
        <View style={styles.badgeRow}>
          <Badge
            label={exam.type === 'FINAL_EXAM' ? 'Final Examination' : 'Module Assessment'}
            variant="warning"
          />
          {moduleTitle ? (
            <Badge label={moduleTitle} variant="info" />
          ) : null}
          <Badge label={`${questionsCount} Questions`} variant="default" />
        </View>

        <Text style={styles.title}>{exam.title}</Text>
        {exam.description && (
          <Text style={styles.description}>{exam.description}</Text>
        )}
      </View>

      {/* Assessment Metrics Grid */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricIcon}>⏱</Text>
          <Text style={styles.metricValue}>{exam.durationMinutes} Min</Text>
          <Text style={styles.metricLabel}>Time Limit</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricIcon}>🎯</Text>
          <Text style={styles.metricValue}>{exam.totalMarks}</Text>
          <Text style={styles.metricLabel}>Total Marks</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricIcon}>✓</Text>
          <Text style={styles.metricValue}>{exam.passingPercentage}%</Text>
          <Text style={styles.metricLabel}>Passing Score</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricIcon}>🔄</Text>
          <Text style={styles.metricValue}>
            {attemptCount} / {exam.maxAttempts}
          </Text>
          <Text style={styles.metricLabel}>Attempts</Text>
        </View>
      </View>

      {/* Negative Marking Alert */}
      {exam.negativeMarking && exam.negativeMarksPerQuestion > 0 && (
        <View style={styles.negativeNotice}>
          <Text style={styles.negativeNoticeIcon}>⚠️</Text>
          <Text style={styles.negativeNoticeText}>
            Negative marking active: -{exam.negativeMarksPerQuestion} mark deducted for each incorrect answer. Unanswered questions receive 0 marks.
          </Text>
        </View>
      )}

      {/* Instructions & Guidelines */}
      <View style={styles.guidelinesCard}>
        <Text style={styles.guidelinesHeading}>Assessment Guidelines</Text>
        <View style={styles.ruleItem}>
          <Text style={styles.ruleBullet}>•</Text>
          <Text style={styles.ruleText}>
            This is a timed assessment. The timer begins as soon as you press Start.
          </Text>
        </View>
        <View style={styles.ruleItem}>
          <Text style={styles.ruleBullet}>•</Text>
          <Text style={styles.ruleText}>
            Your answers autosave continuously to the server. You can freely navigate between questions.
          </Text>
        </View>
        <View style={styles.ruleItem}>
          <Text style={styles.ruleBullet}>•</Text>
          <Text style={styles.ruleText}>
            Use "Mark for Review" to bookmark challenging questions and inspect them on the Review Palette before submission.
          </Text>
        </View>
        <View style={styles.ruleItem}>
          <Text style={styles.ruleBullet}>•</Text>
          <Text style={styles.ruleText}>
            If time expires, your current answers are automatically submitted and graded server-side.
          </Text>
        </View>
      </View>

      {/* Action Button */}
      <View style={styles.actionContainer}>
        {canAttempt ? (
          <Button
            title={attemptCount > 0 ? 'Resume / Retake Assessment' : 'Start Assessment Now'}
            variant="primary"
            onPress={onStartQuiz}
            loading={isStarting}
            style={styles.startButton}
          />
        ) : (
          <View style={styles.exhaustedNotice}>
            <Text style={styles.exhaustedTitle}>Maximum Attempts Reached</Text>
            <Text style={styles.exhaustedSub}>
              You have completed the maximum allowed {exam.maxAttempts} attempts for this examination.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: theme.spacing.sm,
  },
  title: {
    color: '#F8FAFC',
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    color: '#94A3B8',
    fontSize: theme.typography.fontSize.xs,
    lineHeight: 18,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 10,
    alignItems: 'center',
  },
  metricIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  metricValue: {
    color: '#F8FAFC',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '700',
  },
  metricLabel: {
    color: '#94A3B8',
    fontSize: 9,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  negativeNotice: {
    flexDirection: 'row',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: theme.borderRadius.md,
    padding: 10,
    gap: 8,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  negativeNoticeIcon: {
    fontSize: 16,
  },
  negativeNoticeText: {
    flex: 1,
    color: '#FCA5A5',
    fontSize: 11,
    lineHeight: 15,
  },
  guidelinesCard: {
    backgroundColor: '#161F30',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
    marginBottom: theme.spacing.lg,
  },
  guidelinesHeading: {
    color: '#F8FAFC',
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 6,
  },
  ruleBullet: {
    color: theme.colors.primary,
    fontSize: 12,
    lineHeight: 18,
  },
  ruleText: {
    flex: 1,
    color: '#CBD5E1',
    fontSize: theme.typography.fontSize.xs,
    lineHeight: 18,
  },
  actionContainer: {
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: theme.spacing.md,
  },
  startButton: {
    width: '100%',
  },
  exhaustedNotice: {
    backgroundColor: '#1E293B',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  exhaustedTitle: {
    color: '#EF4444',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '700',
    marginBottom: 4,
  },
  exhaustedSub: {
    color: '#94A3B8',
    fontSize: theme.typography.fontSize.xs,
    textAlign: 'center',
  },
});
