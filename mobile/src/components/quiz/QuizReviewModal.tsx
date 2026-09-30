import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { theme } from '../../constants/theme';
import { Button } from '../common/Button';
import { AnswerState } from '../../types/quiz';

interface QuizReviewModalProps {
  visible: boolean;
  totalQuestions: number;
  questionIds: string[];
  answers: Record<string, AnswerState>;
  currentIndex: number;
  isSubmitting: boolean;
  onSelectQuestion: (index: number) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export const QuizReviewModal: React.FC<QuizReviewModalProps> = ({
  visible,
  totalQuestions,
  questionIds,
  answers,
  currentIndex,
  isSubmitting,
  onSelectQuestion,
  onClose,
  onSubmit,
}) => {
  let answeredCount = 0;
  let reviewCount = 0;
  let unansweredCount = 0;

  questionIds.forEach((qId) => {
    const a = answers[qId];
    if (a?.answer && a.answer.trim().length > 0) {
      answeredCount++;
    } else {
      unansweredCount++;
    }
    if (a?.isMarked) {
      reviewCount++;
    }
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Assessment Review</Text>
              <Text style={styles.subtitle}>Check your answers before final submission</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Status Breakdown Pills */}
          <View style={styles.statsRow}>
            <View style={[styles.statPill, styles.statAnswered]}>
              <Text style={styles.statCount}>{answeredCount}</Text>
              <Text style={styles.statLabel}>Answered</Text>
            </View>
            <View style={[styles.statPill, styles.statReview]}>
              <Text style={styles.statCount}>{reviewCount}</Text>
              <Text style={styles.statLabel}>Review</Text>
            </View>
            <View style={[styles.statPill, styles.statUnanswered]}>
              <Text style={styles.statCount}>{unansweredCount}</Text>
              <Text style={styles.statLabel}>Unanswered</Text>
            </View>
          </View>

          {/* Question Palette Grid */}
          <Text style={styles.paletteHeading}>QUESTION PALETTE</Text>
          <ScrollView contentContainerStyle={styles.gridContainer}>
            {questionIds.map((qId, index) => {
              const a = answers[qId];
              const isAnswered = a?.answer && a.answer.trim().length > 0;
              const isMarked = a?.isMarked;
              const isCurrent = index === currentIndex;

              return (
                <TouchableOpacity
                  key={qId}
                  style={[
                    styles.paletteButton,
                    isAnswered && styles.paletteButtonAnswered,
                    isMarked && styles.paletteButtonMarked,
                    isCurrent && styles.paletteButtonCurrent,
                  ]}
                  onPress={() => {
                    onSelectQuestion(index);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.paletteButtonText,
                      isAnswered && styles.paletteButtonTextAnswered,
                      isCurrent && styles.paletteButtonTextCurrent,
                    ]}
                  >
                    {index + 1}
                  </Text>
                  {isMarked && <Text style={styles.paletteStar}>★</Text>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <Button
              title="Continue Answering"
              variant="outline"
              onPress={onClose}
              style={{ flex: 1 }}
            />
            <Button
              title="Submit Quiz"
              variant="primary"
              onPress={onSubmit}
              loading={isSubmitting}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  title: {
    color: '#F8FAFC',
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '700',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: theme.typography.fontSize.xs,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  statPill: {
    flex: 1,
    padding: 10,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  statAnswered: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statReview: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  statUnanswered: {
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    borderColor: 'rgba(100, 116, 139, 0.3)',
  },
  statCount: {
    color: '#F8FAFC',
    fontSize: theme.typography.fontSize.md,
    fontWeight: '700',
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  paletteHeading: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: theme.spacing.sm,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: theme.spacing.lg,
  },
  paletteButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  paletteButtonAnswered: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: theme.colors.primary,
  },
  paletteButtonMarked: {
    borderColor: '#A855F7',
  },
  paletteButtonCurrent: {
    borderWidth: 2,
    borderColor: '#38BDF8',
  },
  paletteButtonText: {
    color: '#94A3B8',
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '700',
  },
  paletteButtonTextAnswered: {
    color: '#F8FAFC',
  },
  paletteButtonTextCurrent: {
    color: '#38BDF8',
  },
  paletteStar: {
    position: 'absolute',
    top: 2,
    right: 3,
    fontSize: 9,
    color: '#A855F7',
  },
  footer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: theme.spacing.md,
  },
});
