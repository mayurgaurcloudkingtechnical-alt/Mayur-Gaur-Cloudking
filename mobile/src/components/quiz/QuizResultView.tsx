import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../../constants/theme';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { AttemptResultResponse } from '../../types/quiz';

interface QuizResultViewProps {
  result: AttemptResultResponse;
  canRetake: boolean;
  onRetake: () => void;
  onContinue: () => void;
}

export const QuizResultView: React.FC<QuizResultViewProps> = ({
  result,
  canRetake,
  onRetake,
  onContinue,
}) => {
  const { exam, isPassed, percentage, finalScore, totalQuestions, correctAnswers, incorrectAnswers, unansweredQuestions, timeTakenSeconds } = result;

  const mins = Math.floor((timeTakenSeconds || 0) / 60);
  const secs = (timeTakenSeconds || 0) % 60;
  const timeTakenFormatted = `${mins}m ${secs}s`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Result Status Banner */}
      <View
        style={[
          styles.statusCard,
          isPassed ? styles.statusCardPassed : styles.statusCardFailed,
        ]}
      >
        <Text style={styles.statusIcon}>{isPassed ? '🏆' : '⚠️'}</Text>
        <Text style={[styles.statusTitle, isPassed ? styles.statusTextPassed : styles.statusTextFailed]}>
          {isPassed ? 'ASSESSMENT PASSED' : 'NOT PASSED'}
        </Text>
        <Text style={styles.statusSubtitle}>
          {isPassed
            ? 'Congratulations! You have met the academic proficiency requirement.'
            : `Passing threshold is ${exam.passingPercentage}%. Review curriculum material and try again.`}
        </Text>
      </View>

      {/* Primary Score Grid */}
      <View style={styles.scoreGrid}>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreValue}>
            {finalScore} <Text style={styles.scoreTotal}>/ {exam.totalMarks}</Text>
          </Text>
          <Text style={styles.scoreLabel}>Final Score</Text>
        </View>

        <View style={styles.scoreCard}>
          <Text style={styles.scoreValue}>{percentage}%</Text>
          <Text style={styles.scoreLabel}>Percentage</Text>
        </View>
      </View>

      {/* Detailed Metrics */}
      <View style={styles.metricsBox}>
        <Text style={styles.metricsHeading}>PERFORMANCE BREAKDOWN</Text>
        <View style={styles.metricRow}>
          <Text style={styles.metricRowLabel}>Total Questions</Text>
          <Text style={styles.metricRowVal}>{totalQuestions}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricRowLabel}>Correct Answers</Text>
          <Text style={[styles.metricRowVal, { color: theme.colors.primary }]}>{correctAnswers}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricRowLabel}>Incorrect Answers</Text>
          <Text style={[styles.metricRowVal, { color: '#EF4444' }]}>{incorrectAnswers}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricRowLabel}>Unanswered Questions</Text>
          <Text style={[styles.metricRowVal, { color: '#94A3B8' }]}>{unansweredQuestions}</Text>
        </View>
        <View style={[styles.metricRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.metricRowLabel}>Time Taken</Text>
          <Text style={styles.metricRowVal}>{timeTakenFormatted}</Text>
        </View>
      </View>

      {/* Question Review (if permitted by exam settings) */}
      {exam.allowReview && Array.isArray(result.answers) && result.answers.length > 0 && (
        <View style={styles.reviewSection}>
          <Text style={styles.reviewHeading}>QUESTION REVIEW</Text>
          {result.answers.map((ans, idx) => {
            const questionDetail = exam.questions?.find((q) => q.questionId === ans.questionId)?.question;
            const isCorrect = ans.isCorrect;

            return (
              <View key={ans.id} style={styles.questionReviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewQIndex}>Q{idx + 1}</Text>
                  <Badge
                    label={isCorrect ? 'Correct (+marks)' : ans.selectedAnswer ? 'Incorrect' : 'Unanswered'}
                    variant={isCorrect ? 'success' : ans.selectedAnswer ? 'error' : 'default'}
                  />
                </View>
                {questionDetail && (
                  <Text style={styles.reviewQText}>{questionDetail.questionText}</Text>
                )}
                <View style={styles.reviewAnsRow}>
                  <Text style={styles.reviewAnsLabel}>Your Response: </Text>
                  <Text style={styles.reviewAnsVal}>
                    {ans.selectedAnswer || 'No answer submitted'}
                  </Text>
                </View>
                <Text style={styles.reviewMarks}>Marks Awarded: {ans.marksAwarded}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsBox}>
        <Button
          title="Continue to Next Lesson →"
          variant="primary"
          onPress={onContinue}
          style={styles.actionBtn}
        />
        {canRetake && (
          <Button
            title="Retake Assessment"
            variant="outline"
            onPress={onRetake}
            style={styles.actionBtn}
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: theme.spacing.sm,
  },
  statusCard: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 1,
  },
  statusCardPassed: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusCardFailed: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  statusIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  statusTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statusTextPassed: {
    color: theme.colors.primary,
  },
  statusTextFailed: {
    color: '#EF4444',
  },
  statusSubtitle: {
    color: '#CBD5E1',
    fontSize: theme.typography.fontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: theme.spacing.sm,
  },
  scoreGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  scoreValue: {
    color: '#F8FAFC',
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '800',
  },
  scoreTotal: {
    fontSize: theme.typography.fontSize.xs,
    color: '#64748B',
    fontWeight: '400',
  },
  scoreLabel: {
    color: '#94A3B8',
    fontSize: theme.typography.fontSize.xs,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  metricsBox: {
    backgroundColor: '#0F172A',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  metricsHeading: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: theme.spacing.sm,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  metricRowLabel: {
    color: '#CBD5E1',
    fontSize: theme.typography.fontSize.xs,
  },
  metricRowVal: {
    color: '#F8FAFC',
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '600',
  },
  reviewSection: {
    backgroundColor: '#0F172A',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  reviewHeading: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: theme.spacing.md,
  },
  questionReviewCard: {
    backgroundColor: '#1E293B',
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewQIndex: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  reviewQText: {
    color: '#F8FAFC',
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '500',
    marginVertical: 4,
  },
  reviewAnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  reviewAnsLabel: {
    color: '#94A3B8',
    fontSize: 11,
  },
  reviewAnsVal: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '600',
  },
  reviewMarks: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 4,
  },
  actionsBox: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  actionBtn: {
    width: '100%',
  },
});
