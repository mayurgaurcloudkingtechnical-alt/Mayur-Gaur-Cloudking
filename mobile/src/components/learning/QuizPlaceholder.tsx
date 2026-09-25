import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import { Badge } from '../common/Badge';

export interface QuizPlaceholderProps {
  lessonTitle: string;
  moduleTitle?: string;
  durationMin?: number;
  summary?: string | null;
}

export const QuizPlaceholder: React.FC<QuizPlaceholderProps> = ({
  lessonTitle,
  moduleTitle,
  durationMin = 15,
  summary,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.badgeRow}>
        <Badge label="Assessment" variant="warning" />
        {moduleTitle ? (
          <Badge label={moduleTitle} variant="info" />
        ) : null}
        <Badge label={`${durationMin} Min`} variant="default" />
      </View>

      <View style={styles.iconCircle}>
        <Text style={styles.icon}>📝</Text>
      </View>

      <Text style={styles.title}>{lessonTitle}</Text>

      {summary && (
        <Text style={styles.summary}>{summary}</Text>
      )}

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Mobile Assessment Runner Scheduled</Text>
        <Text style={styles.infoText}>
          Interactive mobile test runner with timed questions, auto-grading, and instant feedback is scheduled for Step 5B.
        </Text>
        <Text style={styles.infoSubtext}>
          You can complete this assessment on the SoftLab Global Web LMS portal in your browser, or mark this lesson as reviewed after self-study.
        </Text>
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
    alignItems: 'center',
    marginVertical: theme.spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
    justifyContent: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  icon: {
    fontSize: 26,
  },
  title: {
    color: '#F8FAFC',
    fontSize: theme.typography.fontSize.md,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  summary: {
    color: '#94A3B8',
    fontSize: theme.typography.fontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  infoCard: {
    backgroundColor: '#1E293B',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    width: '100%',
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  infoTitle: {
    color: '#F8FAFC',
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    color: '#CBD5E1',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 6,
  },
  infoSubtext: {
    color: '#94A3B8',
    fontSize: 10,
    lineHeight: 14,
  },
});
